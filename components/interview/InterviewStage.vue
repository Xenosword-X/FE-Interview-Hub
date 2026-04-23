<!-- components/interview/InterviewStage.vue -->
<script setup lang="ts">
import type { InterviewSummary } from '~/server/utils/interview/types'

const props = defineProps<{
  sessionId: string
  initialAiText: string
  initialAudioBase64: string
}>()

const emit = defineEmits<{ completed: [summary: InterviewSummary] }>()

const { t } = useI18n()
const sessionIdRef = toRef(props, 'sessionId')
const { state, turns, phase, progress, isFinal, consecutiveErrors, summary, submitTurn, endInterview, initTurns } =
  useInterviewSession(sessionIdRef)
const { isRecording, elapsedSec, start, stop, isSupported, MAX_DURATION_SEC } = useAudioRecorder()
const sessionElapsed = ref(0)

onMounted(() => {
  initTurns(props.initialAiText)
  // Play opening greeting
  const audio = new Audio(`data:audio/mpeg;base64,${props.initialAudioBase64}`)
  audio.play().catch(() => {})
  setInterval(() => sessionElapsed.value++, 1000)
})

const showEndConfirm = ref(false)

async function handleStartRecording() {
  if (!isSupported.value) return alert(t('interview.errors.no_mic'))
  state.value = 'recording'
  await start()
}

async function handleStopRecording() {
  const blob = await stop()
  state.value = 'uploading'
  const result = await submitTurn(blob)

  if (result?.isFinal || result?.forceEnd) {
    await triggerEnd()
  }
}

async function triggerEnd() {
  const s = await endInterview()
  if (s) emit('completed', s)
}

async function confirmEnd() {
  showEndConfirm.value = false
  await triggerEnd()
}

watch(isFinal, async (val) => {
  if (val) await triggerEnd()
})
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-3.5rem)]">
    <!-- Error state -->
    <div v-if="state === 'error'" class="p-4 text-center">
      <p class="text-red-500 text-sm mb-2">{{ t('interview.errors.session_error') }}</p>
      <NuxtLink :to="useLocalePath()('/interview')" class="text-sm text-[--color-primary] underline">
        {{ t('interview.errors.back_to_setup') }}
      </NuxtLink>
    </div>

    <template v-else>
      <InterviewStatusBar
        :phase="phase"
        :progress="progress"
        :elapsed-sec="sessionElapsed"
        @end="showEndConfirm = true"
      />

      <InterviewTranscript :turns="turns" />

      <div class="border-t border-[--color-border]">
        <InterviewRecorder
          :state="state"
          :elapsed-sec="elapsedSec"
          :max-sec="MAX_DURATION_SEC"
          @start-recording="handleStartRecording"
          @stop-recording="handleStopRecording"
        />
      </div>
    </template>

    <!-- End confirm dialog -->
    <div v-if="showEndConfirm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div class="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
        <p class="text-sm text-[--color-text-primary] mb-4">{{ t('interview.stage.end_confirm') }}</p>
        <div class="flex gap-3">
          <AppButton class="flex-1" @click="confirmEnd">{{ t('interview.stage.confirm_end') }}</AppButton>
          <button @click="showEndConfirm = false" class="flex-1 text-sm border border-[--color-border] rounded-lg py-2">
            {{ t('interview.stage.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
