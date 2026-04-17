// server/api/admin/logout.post.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, {
    password: config.sessionSecret,
    maxAge: 86400,
    cookie: { sameSite: 'strict' },
  })
  await session.clear()
  return { success: true }
})
