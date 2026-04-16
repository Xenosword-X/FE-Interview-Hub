// server/api/bookmarks/toggle.post.ts
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  // @nuxtjs/supabase v2 may return JWT claims directly; user ID is in `sub` (JWT standard) or `id`
  const userId = (user as any)?.id ?? (user as any)?.sub
  if (!userId) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const { slug, action } = await readBody<{ slug: string; action: 'add' | 'remove' }>(event)
  if (!slug) throw createError({ statusCode: 400, message: 'slug is required' })

  const client = serverSupabaseServiceRole(event)

  if (action === 'add') {
    const { error } = await client
      .from('bookmarks')
      .insert({ user_id: userId, question_slug: slug })
    if (error) throw createError({ statusCode: 400, message: error.message })
  } else {
    const { error } = await client
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('question_slug', slug)
    if (error) throw createError({ statusCode: 400, message: error.message })
  }

  return { success: true }
})
