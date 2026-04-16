// server/api/bookmarks/index.get.ts
// Server-side fetch: uses HttpOnly session cookie directly → auth.uid() is valid
export default defineEventHandler(async (event) => {
  const client = await useServerSupabaseClient(event)
  const user   = await useServerSupabaseUser(event)

  if (!user) return []

  const { data, error } = await client
    .from('bookmarks')
    .select('question_slug')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[/api/bookmarks GET] error:', error.message)
    return []
  }

  return (data as { question_slug: string }[]).map(b => b.question_slug)
})
