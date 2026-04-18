// server/utils/admin-session.ts
import type { H3Event } from 'h3'

export interface AdminSessionData {
  authenticated?: boolean
}

export function useAdminSession(event: H3Event) {
  const config = useRuntimeConfig(event)
  return useSession<AdminSessionData>(event, {
    password: config.sessionSecret,
    maxAge: 86400,
    cookie: {
      sameSite: 'strict',
      httpOnly: true,
      secure: !import.meta.dev,
    },
  })
}
