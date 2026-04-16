// tests/components/BookmarkButton.test.ts
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect, vi } from 'vitest'
import BookmarkButton from '~/components/bookmark/BookmarkButton.vue'

vi.mock('~/composables/useBookmarks', () => ({
  useBookmarks: () => ({
    isBookmarked: (slug: string) => slug === 'event-loop',
    toggleBookmark: vi.fn(),
    pending: { value: false },
  }),
}))


describe('BookmarkButton', () => {
  it('shows bookmarked styling when slug is bookmarked', async () => {
    const wrapper = await mountSuspended(BookmarkButton, {
      props: { slug: 'event-loop' },
      global: {
        mocks: {
          $t: (k: string) => k,
          useSupabaseUser: () => ({ value: { id: '1' } }),
          useSupabaseClient: () => ({ auth: { signInWithOAuth: vi.fn() } }),
        },
      },
    })
    // bookmarked state should have indigo background class
    expect(wrapper.classes().join(' ')).toMatch(/indigo/)
  })

  it('shows unbookmarked text when slug is not bookmarked', async () => {
    const wrapper = await mountSuspended(BookmarkButton, {
      props: { slug: 'closure' },
      global: {
        mocks: {
          $t: (k: string) => k,
          useSupabaseUser: () => ({ value: { id: '1' } }),
          useSupabaseClient: () => ({ auth: { signInWithOAuth: vi.fn() } }),
        },
      },
    })
    expect(wrapper.text()).toContain('Bookmark')
  })
})
