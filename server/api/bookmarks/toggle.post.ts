// server/api/bookmarks/toggle.post.ts
// Server-side toggle: HttpOnly cookie → auth.uid() valid → RLS passes
export default defineEventHandler(async (event) => {
  const client = await useServerSupabaseClient(event)
  const user   = await useServerSupabaseUser(event)

  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const { slug, action } = await readBody<{ slug: string; action: 'add' | 'remove' }>(event)

  if (!slug) throw createError({ statusCode: 400, message: 'slug is required' })

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
