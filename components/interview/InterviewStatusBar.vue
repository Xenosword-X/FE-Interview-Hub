<!-- components/interview/InterviewStatusBar.vue -->
<script setup lang="ts">
import type { Phase } from '~/server/utils/interview/types'

defineProps<{
  phase: Phase
  progress: { current: number; totalInPhase: number; phaseLabel: string }
  elapsedSec: number
}>()

const emit = defineEmits<{ end: [] }>()
const { t } = useI18n()

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="sticky top-14 z-30 bg-white border-b border-[--color-border] px-4 py-2 flex items-center gap-3">
    <span class="text-xs font-medium text-[--color-text-secondary]">
      {{ t(`interview.phase.${phase}`) }}
    </span>
    <span class="text-xs text-[--color-text-muted]">
      {{ progress.current }} / {{ progress.totalInPhase }}
    </span>
    <span class="text-xs text-[--color-text-muted] ml-auto">⏱ {{ formatTime(elapsedSec) }}</span>
    <button
      @click="emit('end')"
      class="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors"
    >
      {{ t('interview.stage.end_btn') }}
    </button>
  </div>
</template>
