// tests/composables/useBookmarks.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// Mock Nuxt auto-imports
vi.mock('#imports', () => ({
  useSupabaseUser: vi.fn(() => ref({ id: 'user-123' })),
  useSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    })),
  })),
  useState: vi.fn((_key: string, init: () => any) => ref(init())),
  ref: vi.fn((v: any) => ({ value: v })),
}))


describe('useBookmarks - isBookmarked', () => {
  it('returns false when slug is not in set', () => {
    const { bookmarkedSlugs, isBookmarked } = useBookmarks()
    bookmarkedSlugs.value = new Set(['closure'])
    expect(isBookmarked('event-loop')).toBe(false)
  })

  it('returns true when slug is in set', () => {
    const { bookmarkedSlugs, isBookmarked } = useBookmarks()
    bookmarkedSlugs.value = new Set(['event-loop'])
    expect(isBookmarked('event-loop')).toBe(true)
  })
})
