// composables/useCategories.ts
export interface Category {
  key: string
  icon: string   // SVG path data（Heroicons outline）
  count: number
}

export const CATEGORIES: Omit<Category, 'count'>[] = [
  { key: 'javascript',  icon: 'M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 14.5v-9l7 4.5-7 4.5z' },
  { key: 'vue',         icon: 'M12 2l10 6v8l-10 6L2 16V8l10-6z' },
  { key: 'css',         icon: 'M4 3h16l-1.5 14L12 20l-6.5-3L4 3z' },
  { key: 'network-security', icon: 'M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7l-9-5z' },
  { key: 'html',        icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  { key: 'web-vitals',  icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  { key: 'browser',     icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm1 3v13h16V7H4zm0-3v2h16V4H4z' },
  { key: 'behavioral',  icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
]

export function useCategories() {
  const { locale } = useI18n()

  const { data: questions } = useAsyncData(
    `questions-meta-${locale.value}`,
    () => $fetch<{ category: string }[]>('/api/questions', { query: { locale: locale.value } })
  )

  const categoriesWithCount = computed<Category[]>(() =>
    CATEGORIES.map(cat => ({
      ...cat,
      count: questions.value?.filter(q => q.category === cat.key).length ?? 0,
    }))
  )

  return { categories: categoriesWithCount }
}
