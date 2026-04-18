// server/middleware/admin-auth.ts
export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Only guard /admin/* and /api/admin/* paths
  if (!path.startsWith('/admin/') && path !== '/admin' && !path.startsWith('/api/admin/') && path !== '/api/admin') return

  // Login endpoints are always accessible
  if (path === '/admin/login' || path === '/api/admin/login') return

  const session = await useAdminSession(event)

  if (!session.data.authenticated) {
    if (path.startsWith('/api/')) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    } else {
      return sendRedirect(event, '/admin/login', 302)
    }
  }
})
