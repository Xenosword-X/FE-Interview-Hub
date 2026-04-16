<!-- components/bookmark/BookmarkCard.vue -->
<script setup lang="ts">
import type { QuestionMeta } from '~/composables/useQuestions'

const props = defineProps<{
  question: QuestionMeta
}>()
const emit = defineEmits<{ remove: [slug: string] }>()

const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <div class="relative group border border-[--color-border] rounded-xl p-4 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:border-[--color-border-hover] hover:shadow-[0_4px_14px_rgba(99,102,241,0.10)] transition-all duration-200">
    <!-- Remove button (top-right, visible on hover) -->
    <button
      @click="emit('remove', question.slug)"
      class="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-md text-[--color-text-muted] hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
      :aria-label="t('bookmark.remove')"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- Card content (clickable link) -->
    <NuxtLink :to="localePath(`/questions/${question.slug}`)">
      <h3 class="text-base font-semibold text-[--color-text-primary] leading-snug mb-2 pr-8 hover:text-[--color-primary] transition-colors">
        {{ question.title }}
      </h3>
      <div class="flex items-center gap-1.5 flex-wrap">
        <TagBadge :category="question.category" />
        <DifficultyBadge :difficulty="question.difficulty" />
      </div>
    </NuxtLink>
  </div>
</template>
