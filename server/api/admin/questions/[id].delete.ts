// server/api/admin/questions/[id].delete.ts
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id' })

  const client = serverSupabaseServiceRole(event)

  // Translations are cascade-deleted by the FK constraint
  const { error } = await client.from('questions').delete().eq('id', id)
  if (error) throw createError({ statusCode: 500, message: error.message })

  return { success: true }
})
