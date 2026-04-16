// composables/useQuestions.ts
export interface QuestionMeta {
  slug: string
  title: string
  category: string
  tags: string[]
  difficulty: 'basic' | 'intermediate' | 'advanced'
  path: string
}

export function useQuestions() {
  const { locale } = useI18n()
  const route = useRoute()

  const { data: questions, pending } = useAsyncData(
    `questions-${locale.value}`,
    async () => {
      const all = await queryCollection('questions').all()
      return all.filter(q => q.path?.includes(`/${locale.value}/`)) as QuestionMeta[]
    }
  )

  const activeTag = computed(() => (route.query.tag as string) ?? '')

  const filtered = computed(() => {
    if (!questions.value) return []
    if (!activeTag.value) return questions.value
    return questions.value.filter(q => q.category === activeTag.value)
  })

  return { questions, filtered, activeTag, pending }
}
