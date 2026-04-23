// server/utils/interview/pickQuestionPool.ts
import type { QuestionPoolItem } from './types'

interface RawQuestion {
  id: string
  slug: string
  difficulty: string
  translations: Array<{ category: string; title: string }>
}

export function pickQuestionPool(
  questions: RawQuestion[],
  targetCategories: string[],
  locale: 'zh' | 'en',
  usedQuestionIds: string[]
): QuestionPoolItem[] {
  return questions
    .filter(q =>
      q.translations.some(t => targetCategories.includes(t.category))
    )
    .map(q => {
      const matchedTranslation = q.translations.find(t => targetCategories.includes(t.category))
      return {
        id: q.id,
        title: matchedTranslation?.title ?? q.slug,
        difficulty: q.difficulty,
        category: matchedTranslation?.category ?? '',
        used: usedQuestionIds.includes(q.id),
      }
    })
    .slice(0, 10)
}
