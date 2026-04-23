<!-- components/interview/InterviewTurnCard.vue -->
<script setup lang="ts">
defineProps<{
  role: 'assistant' | 'user'
  content: string
  turnIndex: number
}>()
</script>

<template>
  <div :class="['iv-turn', role === 'user' && 'iv-turn--user']">

    <!-- Avatar -->
    <div :class="['iv-avatar', role === 'user' && 'iv-avatar--user']">
      <svg v-if="role === 'assistant'" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
      </svg>
      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
      </svg>
    </div>

    <!-- Bubble -->
    <div :class="['iv-bubble', role === 'user' && 'iv-bubble--user']">
      {{ content }}
    </div>

  </div>
</template>

<style scoped>
.iv-turn {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  animation: iv-turn-in 0.25s ease-out both;
}

.iv-turn--user {
  flex-direction: row-reverse;
}

@keyframes iv-turn-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.iv-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(245,158,11,0.12);
  color: #f59e0b;
  border: 1px solid rgba(245,158,11,0.2);
}

.iv-avatar--user {
  background: rgba(99,102,241,0.12);
  color: #818cf8;
  border-color: rgba(99,102,241,0.2);
}

.iv-bubble {
  max-width: min(75%, 520px);
  padding: 10px 14px;
  border-radius: 14px;
  border-bottom-left-radius: 4px;
  font-size: 13.5px;
  line-height: 1.65;
  color: #cbd5e1;
  background: #141d2b;
  border: 1px solid rgba(255,255,255,0.06);
  border-left: 2px solid rgba(245,158,11,0.35);
}

.iv-bubble--user {
  border-radius: 14px;
  border-bottom-right-radius: 4px;
  border-bottom-left-radius: 14px;
  background: rgba(99,102,241,0.12);
  border: 1px solid rgba(99,102,241,0.2);
  border-left: 1px solid rgba(99,102,241,0.2);
  color: #c7d2fe;
}
</style>
