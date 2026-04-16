<!-- components/question/CategoryCard.vue -->
<script setup lang="ts">
import type { Category } from '~/composables/useCategories'
defineProps<{ category: Category }>()
const localePath = useLocalePath()
</script>

<template>
  <NuxtLink
    :to="`${localePath('/questions')}?tag=${category.key}`"
    class="group border border-[--color-border] rounded-[10px] p-4 bg-white hover:border-[--color-border-hover] hover:shadow-[0_4px_16px_rgba(99,102,241,0.08)] transition-all duration-150 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:outline-none block"
  >
    <div class="w-9 h-9 rounded-[9px] flex items-center justify-center mb-2.5 bg-slate-100">
      <svg class="w-5 h-5 text-[--color-text-secondary]" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" :d="category.icon" />
      </svg>
    </div>
    <p class="text-sm font-semibold text-[--color-text-primary] mb-0.5">{{ $t(`categories.${category.key}`) }}</p>
    <p class="text-[11px] text-[--color-text-muted]">{{ category.count }} 道題目</p>
  </NuxtLink>
</template>
