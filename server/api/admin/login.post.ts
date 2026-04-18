// server/api/admin/login.post.ts
import { timingSafeEqual } from 'node:crypto'

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a.padEnd(b.length))
  const bb = Buffer.from(b.padEnd(a.length))
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

export default defineEventHandler(async (event) => {
  const { account, password } = await readBody<{ account: string; password: string }>(event)
  const config = useRuntimeConfig(event)

  if (!account || !password) {
    throw createError({ statusCode: 400, message: 'Account and password are required' })
  }

  if (!safeEqual(account, config.backendAccount) || !safeEqual(password, config.backendPassword)) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  const session = await useAdminSession(event)
  await session.update({ authenticated: true })

  return { success: true }
})
