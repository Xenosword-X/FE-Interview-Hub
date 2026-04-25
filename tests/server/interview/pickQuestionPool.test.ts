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

  it('caps at 12 items', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      id: `q${i}`, slug: `q${i}`, difficulty: 'mid',
      translations: [{ category: 'react', title: `Q${i}` }],
    }))
    const result = pickQuestionPool(many, ['react'], 'zh', [])
    expect(result).toHaveLength(12)
  })

  it('excludes already-covered categories so the AI cannot reuse them', () => {
    const result = pickQuestionPool(mockQuestions, ['react', 'javascript', 'vue'], 'zh', [], ['react'])
    expect(result.map(q => q.id).sort()).toEqual(['q2', 'q3'])
    expect(result.every(q => q.category !== 'react')).toBe(true)
  })

  it('round-robins across categories so the menu is diverse', () => {
    const questions = [
      { id: 'r1', slug: 'r1', difficulty: 'intermediate', translations: [{ category: 'react', title: 'R1' }] },
      { id: 'r2', slug: 'r2', difficulty: 'intermediate', translations: [{ category: 'react', title: 'R2' }] },
      { id: 'j1', slug: 'j1', difficulty: 'intermediate', translations: [{ category: 'javascript', title: 'J1' }] },
      { id: 'j2', slug: 'j2', difficulty: 'intermediate', translations: [{ category: 'javascript', title: 'J2' }] },
      { id: 'c1', slug: 'c1', difficulty: 'intermediate', translations: [{ category: 'css', title: 'C1' }] },
    ]
    const result = pickQuestionPool(questions, ['react', 'javascript', 'css'], 'zh', [])
    // First 3 entries should be one from each category (any order, but not 2 from same).
    const firstThreeCats = new Set(result.slice(0, 3).map(q => q.category))
    expect(firstThreeCats.size).toBe(3)
  })

  it('ranks basic questions first for junior role within a category', () => {
    const questions = [
      { id: 'a', slug: 'a', difficulty: 'advanced', translations: [{ category: 'javascript', title: 'A' }] },
      { id: 'b', slug: 'b', difficulty: 'basic', translations: [{ category: 'javascript', title: 'B' }] },
      { id: 'i', slug: 'i', difficulty: 'intermediate', translations: [{ category: 'javascript', title: 'I' }] },
    ]
    const result = pickQuestionPool(questions, ['javascript'], 'zh', [], [], 'frontend-junior')
    expect(result.map(q => q.id)).toEqual(['b', 'i', 'a'])
  })

  it('ranks advanced questions first for senior role within a category', () => {
    const questions = [
      { id: 'b', slug: 'b', difficulty: 'basic', translations: [{ category: 'javascript', title: 'B' }] },
      { id: 'a', slug: 'a', difficulty: 'advanced', translations: [{ category: 'javascript', title: 'A' }] },
      { id: 'i', slug: 'i', difficulty: 'intermediate', translations: [{ category: 'javascript', title: 'I' }] },
    ]
    const result = pickQuestionPool(questions, ['javascript'], 'zh', [], [], 'frontend-senior')
    expect(result.map(q => q.id)).toEqual(['a', 'i', 'b'])
  })

  it('still puts unused before used regardless of role fit', () => {
    const questions = [
      { id: 'used-basic', slug: 'ub', difficulty: 'basic', translations: [{ category: 'javascript', title: 'UB' }] },
      { id: 'fresh-advanced', slug: 'fa', difficulty: 'advanced', translations: [{ category: 'javascript', title: 'FA' }] },
    ]
    // Junior would normally pick basic first, but it's used.
    const result = pickQuestionPool(questions, ['javascript'], 'zh', ['used-basic'], [], 'frontend-junior')
    expect(result[0]?.id).toBe('fresh-advanced')
  })
})
