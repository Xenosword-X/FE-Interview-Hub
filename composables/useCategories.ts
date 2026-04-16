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
  { key: 'typescript',  icon: 'M3 3h18v18H3V3zm9 9h3v6h-3v-6zm0-4h3v3h-3V8z' },
  { key: 'react',       icon: 'M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z' },
  { key: 'web-vitals',  icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  { key: 'browser',     icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm1 3v13h16V7H4zm0-3v2h16V4H4z' },
  { key: 'http',        icon: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.142 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0' },
]

export function useCategories() {
  const { locale } = useI18n()

  const { data: questions } = useAsyncData(
    `questions-meta-${locale.value}`,
    () => queryCollection('questions').all()
  )

  const categoriesWithCount = computed<Category[]>(() =>
    CATEGORIES.map(cat => ({
      ...cat,
      count: questions.value?.filter(q =>
        q.path?.includes(`/${locale.value}/`) && q.category === cat.key
      ).length ?? 0,
    }))
  )

  return { categories: categoriesWithCount }
}
