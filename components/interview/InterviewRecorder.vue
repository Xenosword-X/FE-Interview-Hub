<!-- components/interview/InterviewRecorder.vue -->
<script setup lang="ts">
type RecorderState = 'idle' | 'recording' | 'uploading' | 'ai_thinking' | 'ai_speaking' | 'error'

const props = defineProps<{ state: RecorderState; elapsedSec: number; maxSec: number }>()
const emit = defineEmits<{ startRecording: []; stopRecording: [] }>()
const { t } = useI18n()

const canRecord = computed(() => props.state === 'idle')
const isRecording = computed(() => props.state === 'recording')
const isBusy = computed(() => ['uploading', 'ai_thinking', 'ai_speaking'].includes(props.state))

let clickGuard = false

function handleClick() {
  if (clickGuard) return
  if (isRecording.value) {
    emit('stopRecording')
  } else if (canRecord.value) {
    clickGuard = true
    emit('startRecording')
    setTimeout(() => { clickGuard = false }, 500)
  }
}

function formatDuration(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}
</script>

<template>
  <div class="flex flex-col items-center gap-3 py-6">
    <!-- Status label -->
    <p class="text-sm text-[--color-text-secondary]">
      <span v-if="state === 'idle'">{{ t('interview.stage.status_idle') }}</span>
      <span v-else-if="state === 'recording'" class="text-red-500">{{ t('interview.stage.status_recording') }}</span>
      <span v-else-if="state === 'uploading'">{{ t('interview.stage.status_uploading') }}</span>
      <span v-else-if="state === 'ai_thinking'">{{ t('interview.stage.status_thinking') }}</span>
      <span v-else-if="state === 'ai_speaking'">{{ t('interview.stage.status_speaking') }}</span>
      <span v-else-if="state === 'error'" class="text-red-600">{{ t('interview.stage.status_error') }}</span>
    </p>

    <!-- Record button -->
    <button
      @click="handleClick"
      :disabled="isBusy || state === 'error'"
      :class="[
        'w-20 h-20 rounded-full flex items-center justify-center text-white font-semibold text-sm transition-all shadow-lg',
        isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : '',
        canRecord ? 'bg-[--color-primary] hover:bg-indigo-600 cursor-pointer' : '',
        isBusy ? 'bg-gray-300 cursor-not-allowed' : '',
        state === 'error' ? 'bg-gray-200 cursor-not-allowed' : '',
      ]"
    >
      <span v-if="isRecording">⏹</span>
      <span v-else-if="canRecord">🎙️</span>
      <span v-else>⏳</span>
    </button>

    <!-- Recording timer -->
    <p v-if="isRecording" class="text-xs text-red-500 font-mono">
      {{ formatDuration(elapsedSec) }} / {{ formatDuration(maxSec) }}
    </p>

    <!-- Button label -->
    <p class="text-xs text-[--color-text-muted]">
      <span v-if="isRecording">{{ t('interview.stage.stop_btn') }}</span>
      <span v-else-if="canRecord">{{ t('interview.stage.start_btn') }}</span>
    </p>
  </div>
</template>
