// server/api/questions/index.get.ts
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const locale = (query.locale as string) || 'zh'
  const slug = query.slug as string | undefined

  const SUPPORTED_LOCALES = ['zh', 'en'] as const
  if (!SUPPORTED_LOCALES.includes(locale as any)) {
    throw createError({ statusCode: 400, message: `Unsupported locale: ${locale}` })
  }

  const client = serverSupabaseServiceRole(event)

  // Select body_md only when fetching a single question (slug provided)
  const selectFields = slug
    ? 'title, body_md, locale, questions!inner(id, slug, category, difficulty, tags, is_published)'
    : 'title, locale, questions!inner(id, slug, category, difficulty, tags, is_published)'

  let qb = client
    .from('translations')
    .select(selectFields)
    .eq('locale', locale)
    .eq('questions.is_published', true)

  if (slug) {
    qb = qb.eq('questions.slug', slug)
  }

  const { data, error } = await qb

  if (error) throw createError({ statusCode: 500, message: error.message })

  const result = (data ?? []).map((row: any) => {
    const base = {
      id: row.questions.id,
      slug: row.questions.slug,
      category: row.questions.category,
      difficulty: row.questions.difficulty,
      tags: row.questions.tags,
      title: row.title,
    }
    return slug ? { ...base, body_md: row.body_md ?? '' } : base
  })

  if (slug) {
    if (result.length === 0) throw createError({ statusCode: 404, message: 'Question not found' })
    return result[0]
  }

  return result
})
