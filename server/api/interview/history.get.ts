// server/api/interview/history.get.ts
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const userId: string | undefined = (user as any)?.id ?? (user as any)?.sub
  if (!userId) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const query = getQuery(event)
  const limit = Math.min(Number(query.limit ?? 20), 50)
  const cursor = query.cursor as string | undefined

  const db = serverSupabaseServiceRole(event)

  let req = db
    .from('interview_sessions')
    .select('id, started_at, ended_at, status, target_role, target_categories, total_turns, summary')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    req = req.lt('started_at', Buffer.from(cursor, 'base64').toString())
  }

  const { data, error } = await req
  if (error) throw createError({ statusCode: 500, message: 'DB error' })

  const items = (data ?? []).slice(0, limit)
  const hasMore = (data ?? []).length > limit
  const nextCursor = hasMore
    ? Buffer.from(items[items.length - 1].started_at).toString('base64')
    : null

  return {
    items: items.map(s => ({
      id: s.id,
      startedAt: s.started_at,
      endedAt: s.ended_at,
      status: s.status,
      targetRole: s.target_role,
      targetCategories: s.target_categories,
      totalTurns: s.total_turns,
      hasSummary: !!s.summary,
    })),
    nextCursor,
  }
})
