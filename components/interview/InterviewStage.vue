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
      <span class="iv-error-icon">⚠</span>
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
          <div class="iv-dialog-icon">■</div>
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
  background: #0a0d12;
}

.iv-error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: rgba(239,68,68,0.08);
  border-bottom: 1px solid rgba(239,68,68,0.2);
  font-size: 13px;
  color: #fca5a5;
}

.iv-error-icon { font-size: 16px; }

.iv-error-link {
  margin-left: auto;
  color: #f87171;
  text-decoration: underline;
  font-size: 12px;
}

.iv-recorder-wrap {
  border-top: 1px solid rgba(255,255,255,0.05);
  flex-shrink: 0;
}

.iv-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
  backdrop-filter: blur(4px);
  animation: iv-fade-in 0.15s ease;
}

@keyframes iv-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.iv-dialog {
  background: #131920;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 28px 24px 24px;
  max-width: 360px;
  width: 100%;
  box-shadow: 0 24px 64px rgba(0,0,0,0.7);
  animation: iv-slide-up 0.2s ease;
}

@keyframes iv-slide-up {
  from { transform: translateY(12px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

.iv-dialog-icon {
  font-size: 28px;
  text-align: center;
  margin-bottom: 12px;
  color: #ef4444;
  letter-spacing: -2px;
}

.iv-dialog-title {
  font-size: 14px;
  color: #cbd5e1;
  line-height: 1.6;
  text-align: center;
  margin-bottom: 20px;
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
  background: rgba(239,68,68,0.15);
  color: #f87171;
  border: 1px solid rgba(239,68,68,0.25);
}
.iv-dialog-btn--danger:hover {
  background: rgba(239,68,68,0.25);
}

.iv-dialog-btn--ghost {
  background: rgba(255,255,255,0.04);
  color: #475569;
  border: 1px solid rgba(255,255,255,0.06);
}
.iv-dialog-btn--ghost:hover {
  background: rgba(255,255,255,0.08);
  color: #64748b;
}
</style>
