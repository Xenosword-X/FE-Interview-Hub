// server/api/admin/login.post.ts
export default defineEventHandler(async (event) => {
  const { account, password } = await readBody<{ account: string; password: string }>(event)
  const config = useRuntimeConfig(event)

  if (!account || !password) {
    throw createError({ statusCode: 400, message: 'Account and password are required' })
  }

  if (account !== config.backendAccount || password !== config.backendPassword) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  const session = await useSession(event, {
    password: config.sessionSecret,
    maxAge: 86400,
  })
  await session.update({ authenticated: true })

  return { success: true }
})
