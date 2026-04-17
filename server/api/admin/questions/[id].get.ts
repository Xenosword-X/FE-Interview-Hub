// server/api/admin/questions/[id].get.ts
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id' })

  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client
    .from('questions')
    .select('*, translations(*)')
    .eq('id', id)
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!data) throw createError({ statusCode: 404, message: 'Question not found' })
  return data
})
