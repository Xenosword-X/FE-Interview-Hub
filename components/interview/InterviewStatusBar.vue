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

const phases: Phase[] = ['intro', 'behavioral', 'technical', 'wrapup']

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function phaseIndex(p: Phase) {
  return phases.indexOf(p)
}
</script>

<template>
  <div class="iv-bar">
    <!-- Phase breadcrumb -->
    <div class="iv-phases">
      <template v-for="(ph, i) in phases" :key="ph">
        <div :class="['iv-phase-item', phaseIndex(phase) === i && 'iv-phase-item--active', phaseIndex(phase) > i && 'iv-phase-item--done']">
          <span class="iv-phase-dot" />
          <span class="iv-phase-name">{{ t(`interview.phase.${ph}`) }}</span>
        </div>
        <span v-if="i < phases.length - 1" class="iv-phase-sep" />
      </template>
    </div>

    <!-- Right side: progress + timer + end -->
    <div class="iv-bar-right">
      <span class="iv-q-count">
        <span class="iv-q-num">{{ progress.current }}</span>
        <span class="iv-q-sep">/</span>
        <span class="iv-q-total">{{ progress.totalInPhase }}</span>
      </span>
      <span class="iv-timer">{{ formatTime(elapsedSec) }}</span>
      <button @click="emit('end')" class="iv-end-btn">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <rect x="4" y="4" width="16" height="16" rx="2"/>
        </svg>
        {{ t('interview.stage.end_btn') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.iv-bar {
  position: sticky;
  top: 3.5rem;
  z-index: 30;
  background: #0d1117;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding: 0 1rem;
  height: 48px;
  display: flex;
  align-items: center;
  gap: 12px;
  backdrop-filter: blur(8px);
}

.iv-phases {
  display: flex;
  align-items: center;
  gap: 0;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.iv-phase-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #334155;
  transition: color 0.2s;
  min-width: 0;
}

.iv-phase-item--done { color: #475569; }
.iv-phase-item--active { color: #f59e0b; }

.iv-phase-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.iv-phase-name {
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 480px) {
  .iv-phase-item:not(.iv-phase-item--active) .iv-phase-name { display: none; }
}

.iv-phase-sep {
  width: 16px;
  height: 1px;
  background: rgba(255,255,255,0.08);
  flex-shrink: 0;
  margin: 0 4px;
}

.iv-bar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.iv-q-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}
.iv-q-num { color: #e2e8f0; font-weight: 600; }
.iv-q-sep { color: #334155; margin: 0 1px; }
.iv-q-total { color: #475569; }

.iv-timer {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: #475569;
  letter-spacing: 0.5px;
}

.iv-end-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: #ef4444;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  letter-spacing: 0.3px;
}

.iv-end-btn:hover {
  background: rgba(239,68,68,0.15);
  border-color: rgba(239,68,68,0.4);
}
</style>
