// server/api/bookmarks/index.get.ts
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) return []

  const client = await serverSupabaseClient(event)
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
