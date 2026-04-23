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

const progressPct = computed(() => {
  if (!isRecording.value || props.maxSec === 0) return 0
  return Math.min((props.elapsedSec / props.maxSec) * 100, 100)
})

const statusText = computed(() => {
  if (props.state === 'idle') return t('interview.stage.status_idle')
  if (props.state === 'recording') return t('interview.stage.status_recording')
  if (props.state === 'uploading') return t('interview.stage.status_uploading')
  if (props.state === 'ai_thinking') return t('interview.stage.status_thinking')
  if (props.state === 'ai_speaking') return t('interview.stage.status_speaking')
  if (props.state === 'error') return t('interview.stage.status_error')
  return ''
})
</script>

<template>
  <div class="iv-recorder">

    <!-- Status label -->
    <p :class="['iv-status-text', state === 'recording' && 'iv-status-text--rec', state === 'error' && 'iv-status-text--err', (state === 'ai_thinking' || state === 'ai_speaking') && 'iv-status-text--ai']">
      {{ statusText }}
    </p>

    <!-- Button container with rings -->
    <div class="iv-btn-wrap">
      <!-- Rings: only show when recording -->
      <span v-if="isRecording" class="iv-ring iv-ring-1" />
      <span v-if="isRecording" class="iv-ring iv-ring-2" />

      <!-- Main button -->
      <button
        @click="handleClick"
        :disabled="isBusy || state === 'error'"
        :class="['iv-mic-btn', isRecording && 'iv-mic-btn--rec', isBusy && 'iv-mic-btn--busy', state === 'ai_speaking' && 'iv-mic-btn--speak']"
        :aria-label="isRecording ? t('interview.stage.stop_btn') : t('interview.stage.start_btn')"
      >
        <!-- Stop icon (recording) -->
        <svg v-if="isRecording" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <rect x="5" y="5" width="14" height="14" rx="2"/>
        </svg>
        <!-- Mic icon (idle) -->
        <svg v-else-if="canRecord" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"/>
          <path d="M19 11a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.94V22h2v-2.06A9 9 0 0 0 21 11h-2z"/>
        </svg>
        <!-- Waveform (ai_speaking) -->
        <svg v-else-if="state === 'ai_speaking'" width="28" height="20" viewBox="0 0 28 20" fill="currentColor" class="iv-wave-icon">
          <rect x="0" y="6" width="3" height="8" rx="1.5" class="iv-wave-bar iv-wave-bar-1"/>
          <rect x="5" y="2" width="3" height="16" rx="1.5" class="iv-wave-bar iv-wave-bar-2"/>
          <rect x="10" y="0" width="3" height="20" rx="1.5" class="iv-wave-bar iv-wave-bar-3"/>
          <rect x="15" y="4" width="3" height="12" rx="1.5" class="iv-wave-bar iv-wave-bar-4"/>
          <rect x="20" y="7" width="3" height="6" rx="1.5" class="iv-wave-bar iv-wave-bar-5"/>
          <rect x="25" y="9" width="3" height="2" rx="1" class="iv-wave-bar iv-wave-bar-6"/>
        </svg>
        <!-- Spinner (uploading/thinking) -->
        <span v-else class="iv-btn-spin" />
      </button>
    </div>

    <!-- Recording timer -->
    <div v-if="isRecording" class="iv-rec-timer">
      <span class="iv-rec-dot" />
      <span class="iv-rec-time">{{ formatDuration(elapsedSec) }}</span>
      <span class="iv-rec-sep">/</span>
      <span class="iv-rec-max">{{ formatDuration(maxSec) }}</span>
    </div>

    <!-- Action hint -->
    <p class="iv-hint">
      <span v-if="isRecording">{{ t('interview.stage.stop_btn') }}</span>
      <span v-else-if="canRecord">{{ t('interview.stage.start_btn') }}</span>
    </p>

  </div>
</template>

<style scoped>
.iv-recorder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 28px 16px 24px;
  background: #090c11;
}

.iv-status-text {
  font-size: 13px;
  color: #475569;
  min-height: 20px;
  transition: color 0.2s;
  font-weight: 500;
  letter-spacing: 0.2px;
}
.iv-status-text--rec { color: #f87171; }
.iv-status-text--err { color: #ef4444; }
.iv-status-text--ai  { color: #f59e0b; }

.iv-btn-wrap {
  position: relative;
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.iv-ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid rgba(239,68,68,0.25);
  animation: iv-ring-expand 1.6s ease-out infinite;
}
.iv-ring-1 { width: 96px; height: 96px; }
.iv-ring-2 { width: 96px; height: 96px; animation-delay: 0.8s; }

@keyframes iv-ring-expand {
  0%   { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.2); opacity: 0; }
}

.iv-mic-btn {
  position: relative;
  z-index: 1;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
  color: white;
  box-shadow:
    0 0 0 1px rgba(99,102,241,0.3),
    0 8px 24px rgba(99,102,241,0.35);
}

.iv-mic-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow:
    0 0 0 1px rgba(99,102,241,0.4),
    0 12px 32px rgba(99,102,241,0.45);
}

.iv-mic-btn--rec {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow:
    0 0 0 1px rgba(239,68,68,0.3),
    0 8px 24px rgba(239,68,68,0.35);
}

.iv-mic-btn--rec:hover:not(:disabled) {
  box-shadow:
    0 0 0 1px rgba(239,68,68,0.4),
    0 12px 32px rgba(239,68,68,0.45);
}

.iv-mic-btn--busy,
.iv-mic-btn:disabled {
  background: #1e2a3a;
  color: #334155;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.iv-mic-btn--speak {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  box-shadow:
    0 0 0 1px rgba(217,119,6,0.3),
    0 8px 24px rgba(217,119,6,0.3);
  cursor: default;
}

.iv-btn-spin {
  width: 22px;
  height: 22px;
  border: 2.5px solid rgba(255,255,255,0.15);
  border-top-color: rgba(255,255,255,0.5);
  border-radius: 50%;
  animation: iv-spin 0.8s linear infinite;
}

@keyframes iv-spin { to { transform: rotate(360deg); } }

.iv-wave-icon { opacity: 0.9; }

.iv-wave-bar {
  transform-origin: center bottom;
  animation: iv-wave 1.2s ease-in-out infinite;
}
.iv-wave-bar-1 { animation-delay: 0s; }
.iv-wave-bar-2 { animation-delay: 0.1s; }
.iv-wave-bar-3 { animation-delay: 0.2s; }
.iv-wave-bar-4 { animation-delay: 0.3s; }
.iv-wave-bar-5 { animation-delay: 0.4s; }
.iv-wave-bar-6 { animation-delay: 0.5s; }

@keyframes iv-wave {
  0%, 100% { transform: scaleY(0.5); opacity: 0.5; }
  50%       { transform: scaleY(1);   opacity: 1; }
}

.iv-rec-timer {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

.iv-rec-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ef4444;
  animation: iv-blink 1s ease-in-out infinite;
}

@keyframes iv-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.2; }
}

.iv-rec-time { color: #fca5a5; font-weight: 600; }
.iv-rec-sep  { color: #334155; }
.iv-rec-max  { color: #475569; }

.iv-hint {
  font-size: 11px;
  color: #334155;
  min-height: 16px;
  letter-spacing: 0.5px;
}
</style>
