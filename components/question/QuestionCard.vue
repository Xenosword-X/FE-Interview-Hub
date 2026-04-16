<!-- components/question/QuestionCard.vue -->
<script setup lang="ts">
import type { QuestionMeta } from '~/composables/useQuestions'
defineProps<{ question: QuestionMeta }>()
const localePath = useLocalePath()
</script>

<template>
  <NuxtLink
    :to="localePath(`/questions/${question.slug}`)"
    class="group block border border-[--color-border] rounded-[10px] p-4 bg-white hover:border-[--color-border-hover] hover:shadow-sm transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:outline-none"
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
