<!-- components/interview/InterviewAborted.vue -->
<script setup lang="ts">
defineProps<{ status: 'aborted' | 'error' | string }>()
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <div class="iv-abort-shell">
    <div class="iv-abort-card">

      <div :class="['iv-abort-icon-wrap', status === 'error' && 'iv-abort-icon-wrap--err']">
        <svg v-if="status === 'error'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 15.75h.007v.008H12v-.008z"/>
        </svg>
        <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9z"/>
        </svg>
      </div>

      <h2 class="iv-abort-title">
        {{ status === 'error' ? t('interview.errors.session_error_title') : t('interview.errors.session_aborted_title') }}
      </h2>

      <p class="iv-abort-desc">
        {{ status === 'error' ? t('interview.errors.session_error_desc') : t('interview.errors.session_aborted_desc') }}
      </p>

      <NuxtLink :to="localePath('/interview')" class="iv-abort-btn">
        {{ t('interview.errors.back_to_setup') }}
      </NuxtLink>

    </div>
  </div>
</template>

<style scoped>
.iv-abort-shell {
  min-height: calc(100vh - 3.5rem);
  background: #090c11;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.iv-abort-card {
  max-width: 380px;
  width: 100%;
  background: #111827;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  padding: 2.5rem 2rem;
  text-align: center;
  box-shadow: 0 24px 64px rgba(0,0,0,0.5);
}

.iv-abort-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: #64748b;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
}

.iv-abort-icon-wrap--err {
  color: #fbbf24;
  background: rgba(245,158,11,0.07);
  border-color: rgba(245,158,11,0.15);
}

.iv-abort-title {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 1.375rem;
  color: #e2e8f0;
  margin-bottom: 10px;
}

.iv-abort-desc {
  font-size: 13px;
  color: #475569;
  line-height: 1.7;
  margin-bottom: 28px;
}

.iv-abort-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 11px 28px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
  color: white;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 4px 16px rgba(99,102,241,0.25);
  transition: all 0.2s ease;
}

.iv-abort-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99,102,241,0.35);
}
</style>
