// tests/components/BookmarkButton.test.ts
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect, vi } from 'vitest'
import { useState } from '#imports'
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
    // Seed Nuxt state so useSupabaseUser() returns an authenticated user
    const userState = useState('supabase_user', () => null as any)
    userState.value = { id: '1' }

    const wrapper = await mountSuspended(BookmarkButton, {
      props: { slug: 'event-loop' },
      global: {
        mocks: {
          $t: (k: string) => k,
        },
      },
    })
    // bookmarked state: find the authenticated button (v-else branch) with indigo class
    const btn = wrapper.find('button')
    expect(btn.classes().join(' ')).toMatch(/indigo/)
  })

  it('shows unbookmarked text when slug is not bookmarked', async () => {
    // Seed Nuxt state so useSupabaseUser() returns an authenticated user
    const userState = useState('supabase_user', () => null as any)
    userState.value = { id: '1' }

    const wrapper = await mountSuspended(BookmarkButton, {
      props: { slug: 'closure' },
      global: {
        mocks: {
          $t: (k: string) => k,
        },
      },
    })
    expect(wrapper.text()).toContain('Bookmark')
  })
})
