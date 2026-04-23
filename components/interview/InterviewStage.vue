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
const localePath = useLocalePath()
const sessionIdRef = toRef(props, 'sessionId')
const { state, turns, phase, progress, isFinal, consecutiveErrors, summary, submitTurn, endInterview, initTurns } =
  useInterviewSession(sessionIdRef)
const { isRecording, elapsedSec, start, stop, isSupported, MAX_DURATION_SEC } = useAudioRecorder()
const sessionElapsed = ref(0)

onMounted(() => {
  initTurns(props.initialAiText)
  if (process.client && props.initialAudioBase64) {
    const audio = new Audio(`data:audio/mpeg;base64,${props.initialAudioBase64}`)
    audio.play().catch(() => {})
  }
  const sessionTimer = setInterval(() => sessionElapsed.value++, 1000)
  onUnmounted(() => clearInterval(sessionTimer))
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
</script>

<template>
  <div class="iv-stage">

    <!-- Error banner -->
    <div v-if="state === 'error'" class="iv-error-banner">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z"/>
      </svg>
      <span>{{ t('interview.errors.session_error') }}</span>
      <NuxtLink :to="localePath('/interview')" class="iv-error-link">
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

      <div class="iv-recorder-wrap">
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
    <Teleport to="body">
      <div v-if="showEndConfirm" class="iv-overlay" @click.self="showEndConfirm = false">
        <div class="iv-dialog">
          <p class="iv-dialog-title">{{ t('interview.stage.end_confirm') }}</p>
          <div class="iv-dialog-actions">
            <button @click="confirmEnd" class="iv-dialog-btn iv-dialog-btn--danger">
              {{ t('interview.stage.confirm_end') }}
            </button>
            <button @click="showEndConfirm = false" class="iv-dialog-btn iv-dialog-btn--ghost">
              {{ t('interview.stage.cancel') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
.iv-stage {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 3.5rem);
  background: var(--color-bg, #f8fafc);
}

.iv-error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fef2f2;
  border-bottom: 1px solid #fecaca;
  font-size: 13px;
  color: #ef4444;
}

.iv-error-link {
  margin-left: auto;
  color: #ef4444;
  text-decoration: underline;
  font-size: 12px;
}

.iv-recorder-wrap {
  border-top: 1px solid var(--color-border, #e2e8f0);
  flex-shrink: 0;
}

.iv-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
  backdrop-filter: blur(4px);
  animation: iv-fade-in 0.15s ease;
}

@keyframes iv-fade-in { from { opacity: 0; } to { opacity: 1; } }

.iv-dialog {
  background: #ffffff;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 16px;
  padding: 24px;
  max-width: 360px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(15,23,42,0.15);
  animation: iv-slide-up 0.18s ease;
}

@keyframes iv-slide-up {
  from { transform: translateY(10px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

.iv-dialog-title {
  font-size: 14px;
  color: var(--color-text-primary, #0f172a);
  line-height: 1.6;
  margin-bottom: 18px;
}

.iv-dialog-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.iv-dialog-btn {
  width: 100%;
  padding: 11px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
}

.iv-dialog-btn--danger {
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
}
.iv-dialog-btn--danger:hover { background: #fee2e2; }

.iv-dialog-btn--ghost {
  background: var(--color-bg, #f8fafc);
  color: var(--color-text-muted, #64748b);
  border: 1px solid var(--color-border, #e2e8f0);
}
.iv-dialog-btn--ghost:hover { background: var(--color-border, #e2e8f0); }
</style>
