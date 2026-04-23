// server/api/interview/[id].delete.ts
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const userId: string | undefined = (user as any)?.id ?? (user as any)?.sub
  if (!userId) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const id = getRouterParam(event, 'id')
  const db = serverSupabaseServiceRole(event)

  // Verify ownership before delete (ON DELETE CASCADE removes turns automatically)
  const { data: session } = await db
    .from('interview_sessions')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (!session) throw createError({ statusCode: 404, message: 'Not found' })

  await db.from('interview_sessions').delete().eq('id', id)

  setResponseStatus(event, 204)
  return null
})
