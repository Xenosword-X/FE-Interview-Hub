// server/api/interview/end.post.ts
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import OpenAI from 'openai'
import { buildSummaryPromptZh, buildSummaryPromptEn } from '~/server/utils/interview/prompts'
import { parseSummaryResponse } from '~/server/utils/interview/schemas'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const userId: string | undefined = (user as any)?.id ?? (user as any)?.sub
  if (!userId) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const { sessionId } = await readBody<{ sessionId: string }>(event)
  if (!sessionId) throw createError({ statusCode: 400, message: 'sessionId required' })

  const db = serverSupabaseServiceRole(event)

  const { data: session } = await db
    .from('interview_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single()

  if (!session) throw createError({ statusCode: 404, message: 'Session not found' })

  // Idempotent: already completed
  if (session.status === 'completed' && session.summary) {
    return { summary: session.summary }
  }

  // Load full transcript
  const { data: turns } = await db
    .from('interview_turns')
    .select('role, content, turn_index')
    .eq('session_id', sessionId)
    .order('turn_index', { ascending: true })

  const transcript = (turns ?? [])
    .map(t => `[${t.role === 'assistant' ? '面試官' : '候選人'}] ${t.content}`)
    .join('\n\n')

  const config = useRuntimeConfig()
  const openai = new OpenAI({ apiKey: config.openaiApiKey as string })
  const locale = session.locale as 'zh' | 'en'
  const summaryPrompt = locale === 'zh' ? buildSummaryPromptZh() : buildSummaryPromptEn()

  let summary: ReturnType<typeof parseSummaryResponse>
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.5,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: summaryPrompt },
        { role: 'user', content: `Interview Transcript:\n\n${transcript}` },
      ],
    })
    summary = parseSummaryResponse(completion.choices[0].message.content ?? '{}')
  } catch (e) {
    console.error('[interview/end] summary generation error:', e)
    throw createError({ statusCode: 500, message: 'Summary generation failed' })
  }

  await db.from('interview_sessions').update({
    status: 'completed',
    phase: 'completed',
    summary,
    ended_at: new Date().toISOString(),
  }).eq('id', sessionId)

  return { summary }
})
