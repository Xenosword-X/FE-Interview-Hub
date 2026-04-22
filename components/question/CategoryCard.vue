<!-- components/question/CategoryCard.vue -->
<script setup lang="ts">
import type { Category } from '~/composables/useCategories'
const props = defineProps<{ category: Category }>()
const localePath = useLocalePath()

const iconBgMap: Record<string, string> = {
  javascript:   'bg-yellow-100 text-yellow-700',
  vue:          'bg-green-100  text-green-700',
  css:          'bg-pink-100   text-pink-700',
  'network-security': 'bg-blue-100 text-blue-700',
  html:         'bg-orange-100 text-orange-700',
  'web-vitals': 'bg-purple-100 text-purple-700',
  browser:      'bg-sky-100    text-sky-700',
  behavioral:   'bg-teal-100   text-teal-700',
}
const iconClass = computed(() => iconBgMap[props.category.key] ?? 'bg-slate-100 text-slate-600')
</script>

<template>
  <NuxtLink
    :to="`${localePath('/questions')}?tag=${category.key}`"
    class="group border border-[--color-border] rounded-xl p-4 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:border-[--color-border-hover] hover:shadow-[0_6px_20px_rgba(99,102,241,0.12)] transition-all duration-200 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:outline-none block"
  >
    <div :class="['w-9 h-9 rounded-[9px] flex items-center justify-center mb-2.5', iconClass]">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" :d="category.icon" />
      </svg>
    </div>
    <p class="text-sm font-semibold text-[--color-text-primary] mb-0.5">{{ $t(`categories.${category.key}`) }}</p>
    <p class="text-[11px] text-[--color-text-muted]">{{ $t('categories.count_label', { count: category.count }) }}</p>
  </NuxtLink>
</template>
