// server/api/admin/questions/[id].put.ts
import { serverSupabaseServiceRole } from '#supabase/server'

interface UpdateBody {
  category: string
  difficulty: string
  tags: string[]
  zh: { title: string; body_md: string }
  en: { title: string; body_md: string }
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id' })

  const body = await readBody<UpdateBody>(event)

  if (!body.zh?.title || !body.en?.title || !body.category || !body.difficulty) {
    throw createError({ statusCode: 400, message: 'category, difficulty, and both titles are required' })
  }

  const client = serverSupabaseServiceRole(event)

  const { error: qErr } = await client
    .from('questions')
    .update({
      category: body.category,
      difficulty: body.difficulty,
      tags: body.tags ?? [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (qErr) throw createError({ statusCode: 500, message: qErr.message })

  for (const locale of ['zh', 'en'] as const) {
    const t = body[locale]
    const { error: tErr } = await client
      .from('translations')
      .upsert(
        {
          question_id: id,
          locale,
          title: t.title,
          body_md: t.body_md,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'question_id,locale' }
      )

    if (tErr) throw createError({ statusCode: 500, message: tErr.message })
  }

  return { success: true }
})
