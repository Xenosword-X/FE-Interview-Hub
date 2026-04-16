// server/api/bookmarks/index.get.ts
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Authenticate first via RLS-aware user lookup
  const user = await serverSupabaseUser(event)
  if (!user) return []

  // Use service role for the actual query — bypasses RLS but we already
  // filter by user.id so users can only see their own bookmarks
  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client
    .from('bookmarks')
    .select('question_slug')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[/api/bookmarks GET] error:', error.message)
    return []
  }

  return (data as { question_slug: string }[]).map(b => b.question_slug)
})
