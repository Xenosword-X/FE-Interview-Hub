// server/api/admin/login.post.ts
function safeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length)
  let diff = a.length ^ b.length
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  }
  return diff === 0
}

export default defineEventHandler(async (event) => {
  const { account, password } = await readBody<{ account: string; password: string }>(event)
  const config = useRuntimeConfig(event)

  if (!account || !password) {
    throw createError({ statusCode: 400, message: 'Account and password are required' })
  }

  if (!config.backendAccount || !config.backendPassword || !config.sessionSecret) {
    throw createError({ statusCode: 500, message: 'Server env not configured' })
  }
  if (config.sessionSecret.length < 32) {
    throw createError({ statusCode: 500, message: 'SESSION_SECRET must be at least 32 characters' })
  }

  if (!safeEqual(account, config.backendAccount) || !safeEqual(password, config.backendPassword)) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  const session = await useAdminSession(event)
  await session.update({ authenticated: true })

  return { success: true }
})
