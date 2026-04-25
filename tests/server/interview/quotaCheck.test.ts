// tests/server/interview/quotaCheck.test.ts
import { describe, it, expect } from 'vitest'

function isWhitelisted(email: string, bypassEmails: string): boolean {
  return bypassEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase())
}

function isQuotaExceeded(sessionCount: number, isWhitelisted: boolean): boolean {
  if (isWhitelisted) return false
  return sessionCount >= 1
}

describe('isWhitelisted', () => {
  it('returns true for email in bypass list', () => {
    expect(isWhitelisted('dev@test.com', 'dev@test.com,other@test.com')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isWhitelisted('DEV@TEST.COM', 'dev@test.com')).toBe(true)
  })

  it('returns false when not in list', () => {
    expect(isWhitelisted('user@test.com', 'dev@test.com')).toBe(false)
  })

  it('handles empty bypass list', () => {
    expect(isWhitelisted('dev@test.com', '')).toBe(false)
  })
})

describe('isQuotaExceeded', () => {
  it('returns true when sessionCount >= 1 and not whitelisted', () => {
    expect(isQuotaExceeded(1, false)).toBe(true)
    expect(isQuotaExceeded(3, false)).toBe(true)
  })

  it('returns false when sessionCount is 0', () => {
    expect(isQuotaExceeded(0, false)).toBe(false)
  })

  it('always returns false for whitelisted users', () => {
    expect(isQuotaExceeded(99, true)).toBe(false)
  })
})
