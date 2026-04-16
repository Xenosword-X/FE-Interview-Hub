// server/api/bookmarks/index.get.ts
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  // @nuxtjs/supabase v2 may return JWT claims directly; user ID is in `sub` (JWT standard) or `id`
  const userId = (user as any)?.id ?? (user as any)?.sub
  if (!userId) return []

  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client
    .from('bookmarks')
    .select('question_slug')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[/api/bookmarks GET] error:', error.message)
    return []
  }

  return (data as { question_slug: string }[]).map(b => b.question_slug)
})
