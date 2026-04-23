// server/api/interview/turn.post.ts
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import OpenAI from 'openai'
import { buildSystemPromptZh, buildSystemPromptEn } from '~/server/utils/interview/prompts'
import { buildTurnMessages } from '~/server/utils/interview/buildTurnMessages'
import { pickQuestionPool } from '~/server/utils/interview/pickQuestionPool'
import { validateAndCoerce } from '~/server/utils/interview/validateAiResponse'
import { parseTurnResponse } from '~/server/utils/interview/schemas'
import { isSilentTranscript, FALLBACK_REPLIES } from '~/server/utils/interview/applyFallback'
import type { Phase, InterviewTurn } from '~/server/utils/interview/types'

const MAX_TURNS = 15
const MAX_SESSION_MINUTES = 45

export default defineEventHandler(async (event) => {
  // 1. Auth
  const user = await serverSupabaseUser(event)
  const userId: string | undefined = (user as any)?.id ?? (user as any)?.sub
  if (!userId) throw createError({ statusCode: 401, message: 'Unauthorized' })

  // 2. Parse multipart
  const formData = await readFormData(event)
  const sessionId = formData.get('sessionId') as string | null
  const audioFile = formData.get('audio') as File | null

  if (!sessionId) throw createError({ statusCode: 400, message: 'sessionId required' })
  if (!audioFile || audioFile.size === 0) throw createError({ statusCode: 400, message: 'audio required' })
  if (audioFile.size > 25 * 1024 * 1024) throw createError({ statusCode: 413, message: 'Audio too large' })

  const db = serverSupabaseServiceRole(event)

  // 3. Load session + ownership check
  const { data: session } = await db
    .from('interview_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single()

  if (!session) throw createError({ statusCode: 404, message: 'Session not found' })
  if (session.status !== 'active') throw createError({ statusCode: 400, message: 'Session is not active' })

  // 4. Timeout check
  const sessionAgeMinutes = (Date.now() - new Date(session.started_at).getTime()) / 60000
  if (sessionAgeMinutes > MAX_SESSION_MINUTES) {
    await db.from('interview_sessions').update({ status: 'completed', ended_at: new Date().toISOString() }).eq('id', sessionId)
    return { forceEnd: true, reason: 'timeout' }
  }

  // 5. Max turns check
  if (session.total_turns >= MAX_TURNS) {
    await db.from('interview_sessions').update({ status: 'completed', ended_at: new Date().toISOString() }).eq('id', sessionId)
    return { forceEnd: true, reason: 'max_turns' }
  }

  const config = useRuntimeConfig()
  const openai = new OpenAI({ apiKey: config.openaiApiKey as string })
  const locale = session.locale as 'zh' | 'en'

  // 6. STT
  let userTranscript = ''
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'gpt-4o-mini-transcribe',
      language: locale === 'zh' ? 'zh' : 'en',
      prompt: 'React, Vue, useState, Virtual DOM, SSR, Hydration, TypeScript, JavaScript',
    })
    userTranscript = transcription.text ?? ''
  } catch (e) {
    console.error('[interview/turn] STT error:', e)
    throw createError({ statusCode: 500, message: 'Transcription failed' })
  }

  // 7. Silent fallback
  if (isSilentTranscript(userTranscript)) {
    const fallbackText = FALLBACK_REPLIES[locale]
    const speech = await openai.audio.speech.create({ model: 'tts-1', voice: 'alloy', input: fallbackText })
    const buffer = Buffer.from(await speech.arrayBuffer())
    return {
      userTranscript: '',
      userTurnIndex: -1,
      aiText: fallbackText,
      aiAudioBase64: buffer.toString('base64'),
      aiAudioMimeType: 'audio/mpeg',
      aiTurnIndex: -1,
      phase: session.phase,
      progress: { current: 1, totalInPhase: 3, phaseLabel: session.phase },
      isFinal: false,
      silent: true,
    }
  }

  // 8. Load existing turns for context
  const { data: existingTurns } = await db
    .from('interview_turns')
    .select('role, content, turn_index, question_id, is_generated, phase')
    .eq('session_id', sessionId)
    .order('turn_index', { ascending: true })

  const turns: InterviewTurn[] = (existingTurns ?? []) as InterviewTurn[]
  const usedQuestionIds = turns.filter(t => t.question_id).map(t => t.question_id as string)
  const behavioralCount = turns.filter(t => t.phase === 'behavioral' && t.role === 'assistant').length
  const technicalCount = turns.filter(t => t.phase === 'technical' && t.role === 'assistant').length

  // 9. Build question pool for technical phase
  let questionPool = undefined
  if (session.phase === 'technical') {
    const { data: dbQuestions } = await db
      .from('questions')
      .select('id, slug, difficulty, translations!inner(category, title)')
      .eq('translations.locale', locale)

    questionPool = pickQuestionPool(
      (dbQuestions ?? []) as any,
      session.target_categories,
      locale,
      usedQuestionIds
    )
  }

  // 10. Build system prompt + messages
  const systemPrompt = locale === 'zh'
    ? buildSystemPromptZh({ phase: session.phase as Phase, behavioralCount, technicalCount, targetRole: session.target_role, targetCategories: session.target_categories, questionPool })
    : buildSystemPromptEn({ phase: session.phase as Phase, behavioralCount, technicalCount, targetRole: session.target_role, targetCategories: session.target_categories, questionPool })

  const messages = buildTurnMessages(systemPrompt, turns, userTranscript)

  // 11. LLM call
  let aiResponse: ReturnType<typeof parseTurnResponse>
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
      messages,
    })
    aiResponse = parseTurnResponse(completion.choices[0].message.content ?? '{}')
  } catch (e) {
    console.error('[interview/turn] LLM error:', e)
    throw createError({ statusCode: 500, message: 'AI response failed' })
  }

  // 12. Validate + coerce
  const poolIds = (questionPool ?? []).map(q => q.id)
  const validated = validateAndCoerce(aiResponse, session.phase as Phase, behavioralCount, technicalCount, usedQuestionIds, poolIds)

  // 13. TTS
  let aiAudioBase64 = ''
  try {
    const speech = await openai.audio.speech.create({ model: 'tts-1', voice: 'alloy', input: validated.reply })
    aiAudioBase64 = Buffer.from(await speech.arrayBuffer()).toString('base64')
  } catch (e) {
    console.error('[interview/turn] TTS error:', e)
    throw createError({ statusCode: 500, message: 'TTS failed' })
  }

  // 14. Write user turn + assistant turn + update session
  const nextTurnIndex = session.total_turns + 1
  const aiTurnIndex = nextTurnIndex + 1

  await db.from('interview_turns').insert([
    {
      session_id: sessionId,
      turn_index: nextTurnIndex,
      role: 'user',
      phase: session.phase,
      content: userTranscript,
    },
    {
      session_id: sessionId,
      turn_index: aiTurnIndex,
      role: 'assistant',
      phase: validated.nextPhase,
      content: validated.reply,
      question_id: validated.pickedQuestionId,
      is_generated: validated.isGeneratedQuestion,
    },
  ])

  await db.from('interview_sessions').update({
    phase: validated.nextPhase,
    total_turns: aiTurnIndex,
  }).eq('id', sessionId)

  return {
    userTranscript,
    userTurnIndex: nextTurnIndex,
    aiText: validated.reply,
    aiAudioBase64,
    aiAudioMimeType: 'audio/mpeg',
    aiTurnIndex,
    phase: validated.nextPhase,
    progress: {
      current: validated.progressCurrent,
      totalInPhase: validated.progressTotalInPhase,
      phaseLabel: validated.nextPhase,
    },
    isFinal: validated.isFinal,
  }
})
