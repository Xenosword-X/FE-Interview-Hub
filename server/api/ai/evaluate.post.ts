// server/api/ai/evaluate.post.ts
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import OpenAI from 'openai'

interface AiFeedback {
  accuracy: { score: number; summary: string }
  gaps: string[]
  example: string
}

const SYSTEM_PROMPT = `你是一位資深前端工程師面試官。
請針對以下前端面試題，評估應試者的回答品質。

請以 JSON 格式回應，格式如下：
{
  "accuracy": {
    "score": <0-100 整數>,
    "summary": "<一句話評語，30字以內>"
  },
  "gaps": ["<缺漏要點1>", "<缺漏要點2>"],
  "example": "<優化後的完整建議答案>"
}

評分標準：
- 80-100：核心概念正確，有具體細節
- 60-79：基本正確但缺乏深度
- 40-59：部分正確，有明顯錯誤
- 0-39：回答方向有誤或過於簡略

語言：回答語言與題目語言相同（繁體中文或英文）。
只回傳 JSON，不要有任何額外說明文字。`

export default defineEventHandler(async (event) => {
  // 1. Auth — extract user ID (sub or id, handles @nuxtjs/supabase v2 JWT quirk)
  const user = await serverSupabaseUser(event)
  const userId: string | undefined = (user as any)?.id ?? (user as any)?.sub
  if (!userId) throw createError({ statusCode: 401, message: 'Unauthorized' })

  // 2. Parse body
  const { slug, questionText, answer } = await readBody<{
    slug: string
    questionText: string
    answer: string
  }>(event)

  if (!slug || !questionText || !answer?.trim()) {
    throw createError({ statusCode: 400, message: 'slug, questionText and answer are required' })
  }

  // 3. Rate limit check
  const config = useRuntimeConfig()
  const userEmail: string = (user as any)?.email ?? ''
  const bypassEmails = (config.bypassEmails as string)
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
  const isDevBypass = bypassEmails.includes(userEmail.toLowerCase())

  const dailyLimit = parseInt(config.dailyAiLimit as string) || 10
  let usedToday = 0

  if (!isDevBypass) {
    const dbClient = serverSupabaseServiceRole(event)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count } = await dbClient
      .from('practice_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today.toISOString())

    usedToday = count ?? 0
    if (usedToday >= dailyLimit) {
      throw createError({ statusCode: 429, message: `Daily limit reached (${dailyLimit})` })
    }
  }

  // 4. Detect locale from Accept-Language header
  const acceptLang = getHeader(event, 'accept-language') ?? ''
  const locale = acceptLang.toLowerCase().startsWith('zh') ? 'zh' : 'en'

  // 5. OpenAI call
  const openai = new OpenAI({ apiKey: config.openaiApiKey as string })

  let feedback: AiFeedback
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `面試題目：${questionText}\n\n應試者回答：${answer}` },
      ],
    })
    feedback = JSON.parse(completion.choices[0].message.content ?? '{}') as AiFeedback
  } catch (e) {
    console.error('[/api/ai/evaluate] OpenAI error:', e)
    throw createError({ statusCode: 500, message: 'AI scoring failed' })
  }

  // 6. Save to practice_logs
  const dbClient = serverSupabaseServiceRole(event)
  await dbClient.from('practice_logs').insert({
    user_id:       userId,
    question_slug: slug,
    question_text: questionText,
    user_answer:   answer,
    ai_feedback:   feedback,
    locale,
  })

  return {
    feedback,
    usedToday:  isDevBypass ? 0 : usedToday + 1,
    dailyLimit: isDevBypass ? null : dailyLimit,
  }
})
