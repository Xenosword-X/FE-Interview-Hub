// composables/useQuestions.ts
export interface QuestionMeta {
  id: string
  slug: string
  title: string
  category: string
  tags: string[]
  difficulty: 'basic' | 'intermediate' | 'advanced'
}

export interface QuestionItem extends QuestionMeta {
  body_md: string
}

export function useQuestions() {
  const { locale } = useI18n()
  const route = useRoute()

  const { data: questions, pending } = useAsyncData(
    `questions-${locale.value}`,
    () => $fetch<QuestionMeta[]>('/api/questions', { query: { locale: locale.value } })
  )

  const activeTag = computed(() => (route.query.tag as string) ?? '')

  const filtered = computed(() => {
    if (!questions.value) return []
    if (!activeTag.value) return questions.value
    return questions.value.filter(q => q.category === activeTag.value)
  })

  return { questions, filtered, activeTag, pending }
}
