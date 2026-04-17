// tests/server/evaluate.test.ts
import { describe, it, expect } from 'vitest'

// Helper functions extracted from the server route for unit testing
function isBypassEmail(email: string, bypassList: string): boolean {
  return bypassList
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase())
}

function isRateLimited(usedToday: number, limit: number, bypass: boolean): boolean {
  if (bypass) return false
  return usedToday >= limit
}

describe('isBypassEmail', () => {
  it('returns true when email is in bypass list', () => {
    expect(isBypassEmail('dev@example.com', 'dev@example.com,other@example.com')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isBypassEmail('DEV@EXAMPLE.COM', 'dev@example.com')).toBe(true)
  })

  it('returns false when email is not in list', () => {
    expect(isBypassEmail('other@example.com', 'dev@example.com')).toBe(false)
  })
})

describe('isRateLimited', () => {
  it('returns true when usedToday >= limit', () => {
    expect(isRateLimited(10, 10, false)).toBe(true)
    expect(isRateLimited(11, 10, false)).toBe(true)
  })

  it('returns false when under limit', () => {
    expect(isRateLimited(9, 10, false)).toBe(false)
  })

  it('always returns false for bypass emails', () => {
    expect(isRateLimited(100, 10, true)).toBe(false)
  })
})
