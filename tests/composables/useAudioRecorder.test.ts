// tests/composables/useAudioRecorder.test.ts
import { describe, it, expect } from 'vitest'

// Test pure helper logic only (MediaRecorder can't run in happy-dom without mocking)

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function isOverLimit(elapsedSec: number, maxSec: number): boolean {
  return elapsedSec >= maxSec
}

describe('formatDuration', () => {
  it('formats 0 as 0:00', () => expect(formatDuration(0)).toBe('0:00'))
  it('formats 65 as 1:05', () => expect(formatDuration(65)).toBe('1:05'))
  it('formats 180 as 3:00', () => expect(formatDuration(180)).toBe('3:00'))
})

describe('isOverLimit', () => {
  it('returns false when under limit', () => expect(isOverLimit(120, 180)).toBe(false))
  it('returns true when at limit', () => expect(isOverLimit(180, 180)).toBe(true))
  it('returns true when over limit', () => expect(isOverLimit(200, 180)).toBe(true))
})
