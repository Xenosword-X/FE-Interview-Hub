// tests/server/interview/pickQuestionPool.test.ts
import { describe, it, expect } from 'vitest'
import { pickQuestionPool } from '../../../server/utils/interview/pickQuestionPool'

const mockQuestions = [
  { id: 'q1', slug: 'virtual-dom', difficulty: 'mid', translations: [{ category: 'react', title: 'Virtual DOM 原理' }] },
  { id: 'q2', slug: 'js-closure', difficulty: 'basic', translations: [{ category: 'javascript', title: 'Closure 解釋' }] },
  { id: 'q3', slug: 'vue-reactivity', difficulty: 'mid', translations: [{ category: 'vue', title: 'Vue 響應式原理' }] },
]

describe('pickQuestionPool', () => {
  it('filters by targetCategories', () => {
    const result = pickQuestionPool(mockQuestions, ['react'], 'zh', [])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('q1')
  })

  it('marks used questions', () => {
    const result = pickQuestionPool(mockQuestions, ['react', 'javascript'], 'zh', ['q1'])
    const q1 = result.find(q => q.id === 'q1')
    expect(q1?.used).toBe(true)
  })

  it('returns empty array when no category match', () => {
    const result = pickQuestionPool(mockQuestions, ['css'], 'zh', [])
    expect(result).toHaveLength(0)
  })

  it('caps at 10 items', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({
      id: `q${i}`, slug: `q${i}`, difficulty: 'mid',
      translations: [{ category: 'react', title: `Q${i}` }],
    }))
    const result = pickQuestionPool(many, ['react'], 'zh', [])
    expect(result).toHaveLength(10)
  })
})
