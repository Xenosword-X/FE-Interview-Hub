// tests/components/TagBadge.test.ts
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'
import TagBadge from '~/components/question/TagBadge.vue'

describe('TagBadge', () => {
  it('renders the category label', async () => {
    const wrapper = await mountSuspended(TagBadge, {
      props: { category: 'javascript' },
      global: {
        mocks: { $t: (key: string) => ({ 'categories.javascript': 'JavaScript' })[key] ?? key }
      }
    })
    expect(wrapper.text()).toContain('JavaScript')
  })

  it('applies category-specific colour class', async () => {
    const wrapper = await mountSuspended(TagBadge, {
      props: { category: 'vue' },
      global: { mocks: { $t: (k: string) => k } }
    })
    expect(wrapper.classes().join(' ')).toMatch(/vue|green/)
  })
})
