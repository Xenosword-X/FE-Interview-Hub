// server/utils/interview/quotaCheck.ts

export function isWhitelisted(email: string, bypassEmails: string): boolean {
  return bypassEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase())
}

export function isQuotaExceeded(sessionCount: number, whitelisted: boolean): boolean {
  if (whitelisted) return false
  return sessionCount >= 1
}
