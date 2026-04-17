// server/middleware/admin-auth.ts
export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Only guard /admin/* and /api/admin/* paths
  if (!path.startsWith('/admin') && !path.startsWith('/api/admin')) return

  // Login endpoints are always accessible
  if (path === '/admin/login' || path === '/api/admin/login') return

  const config = useRuntimeConfig(event)
  const session = await useSession(event, {
    password: config.sessionSecret,
    maxAge: 86400, // 24 hours
  })

  if (!session.data.authenticated) {
    if (path.startsWith('/api/')) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    } else {
      return sendRedirect(event, '/admin/login', 302)
    }
  }
})
