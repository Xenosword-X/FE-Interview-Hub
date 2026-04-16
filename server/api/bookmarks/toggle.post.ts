// server/api/bookmarks/toggle.post.ts
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const { slug, action } = await readBody<{ slug: string; action: 'add' | 'remove' }>(event)
  if (!slug) throw createError({ statusCode: 400, message: 'slug is required' })

  const client = await serverSupabaseClient(event)

  if (action === 'add') {
    const { error } = await client
      .from('bookmarks')
      .insert({ user_id: user.id, question_slug: slug })
    if (error) throw createError({ statusCode: 400, message: error.message })
  } else {
    const { error } = await client
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('question_slug', slug)
    if (error) throw createError({ statusCode: 400, message: error.message })
  }

  return { success: true }
})
