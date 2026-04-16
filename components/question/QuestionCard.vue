<!-- components/question/QuestionCard.vue -->
<script setup lang="ts">
import type { QuestionMeta } from '~/composables/useQuestions'
defineProps<{ question: QuestionMeta }>()
const localePath = useLocalePath()
</script>

<template>
  <NuxtLink
    :to="localePath(`/questions/${question.slug}`)"
    class="group block border border-[--color-border] rounded-xl p-4 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:border-[--color-border-hover] hover:shadow-[0_4px_14px_rgba(99,102,241,0.10)] transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:outline-none"
  >
    <h3 class="text-base font-semibold text-[--color-text-primary] leading-snug mb-2 group-hover:text-[--color-primary] transition-colors">
      {{ question.title }}
    </h3>
    <div class="flex items-center gap-1.5 flex-wrap">
      <TagBadge :category="question.category" />
      <DifficultyBadge :difficulty="question.difficulty" />
    </div>
  </NuxtLink>
</template>
