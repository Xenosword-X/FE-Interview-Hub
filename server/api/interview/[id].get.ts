// server/api/interview/[id].get.ts
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const userId: string | undefined = (user as any)?.id ?? (user as any)?.sub
  if (!userId) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const id = getRouterParam(event, 'id')
  const db = serverSupabaseServiceRole(event)

  const { data: session } = await db
    .from('interview_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (!session) throw createError({ statusCode: 404, message: 'Not found' })

  const { data: turns } = await db
    .from('interview_turns')
    .select('*')
    .eq('session_id', id)
    .order('turn_index', { ascending: true })

  return { session, turns: turns ?? [], summary: session.summary ?? null }
})
