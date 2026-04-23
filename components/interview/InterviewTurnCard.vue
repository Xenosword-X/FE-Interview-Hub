<!-- components/interview/InterviewTurnCard.vue -->
<script setup lang="ts">
defineProps<{
  role: 'assistant' | 'user'
  content: string
  turnIndex: number
}>()
</script>

<template>
  <div :class="['flex gap-3 mb-3', role === 'user' ? 'flex-row-reverse' : '']">
    <div class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm bg-[--color-border]">
      {{ role === 'assistant' ? '👔' : '🧑' }}
    </div>
    <div
      :class="[
        'max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
        role === 'assistant'
          ? 'bg-[--color-surface] border border-[--color-border] text-[--color-text-primary] rounded-tl-sm'
          : 'bg-[--color-primary] text-white rounded-tr-sm',
      ]"
    >
      {{ content }}
    </div>
  </div>
</template>
