<!-- pages/interview/[id].vue -->
<script setup lang="ts">
import type { InterviewSession, InterviewSummary, InterviewTurn } from '~/server/utils/interview/types'

definePageMeta({ layout: 'home' })

const route = useRoute()
const { t } = useI18n()
const localePath = useLocalePath()
const sessionId = route.params.id as string

const user = useSupabaseUser()

const { data, pending, error } = await useFetch<{
  session: InterviewSession
  turns: InterviewTurn[]
  summary: InterviewSummary | null
}>(`/api/interview/${sessionId}`, { immediate: !!user.value })

const view = computed(() => {
  if (!data.value) return 'loading'
  const s = data.value.session
  if (s.status === 'completed') return 'summary'
  if (s.status === 'error') return 'error'
  if (s.status === 'aborted') return 'aborted'
  return 'active'
})

const initialAiText = computed(() => data.value?.turns?.[0]?.content ?? '')
const initialAudioBase64 = ref('')

const localSummary = ref<InterviewSummary | null>(null)

onMounted(() => {
  const stored = sessionStorage.getItem(`interview_init_${sessionId}`)
  if (stored) {
    const { aiAudioBase64 } = JSON.parse(stored)
    initialAudioBase64.value = aiAudioBase64
    sessionStorage.removeItem(`interview_init_${sessionId}`)
  }
})

function handleCompleted(s: InterviewSummary) {
  localSummary.value = s
}

const displaySummary = computed(() => localSummary.value ?? data.value?.summary ?? null)
</script>

<template>
  <div>
    <!-- Not logged in -->
    <div v-if="!user" class="iv-id-shell">
      <div class="iv-id-card">
        <span class="iv-id-eyebrow">AI POWERED</span>
        <h1 class="iv-id-title">{{ t('interview.setup.title') }}</h1>
        <p class="iv-id-desc">{{ t('auth.login_required') }}</p>
        <ClientOnly>
          <LoginButton />
        </ClientOnly>
      </div>
    </div>

    <!-- Loading -->
    <div v-else-if="pending" class="iv-id-loading">
      <span class="iv-id-spin" />
      <span>{{ t('interview.loading') }}</span>
    </div>

    <!-- Error / not found -->
    <div v-else-if="error || !data" class="iv-id-shell">
      <div class="iv-id-card">
        <p class="iv-id-err-text">{{ t('interview.errors.not_found') }}</p>
        <NuxtLink :to="localePath('/interview')" class="iv-id-back-link">
          {{ t('interview.errors.back_to_setup') }}
        </NuxtLink>
      </div>
    </div>

    <!-- Active interview -->
    <InterviewStage
      v-else-if="view === 'active'"
      :session-id="sessionId"
      :initial-ai-text="initialAiText"
      :initial-audio-base64="initialAudioBase64"
      @completed="handleCompleted"
    />

    <!-- Summary -->
    <InterviewSummary
      v-else-if="view === 'summary' || localSummary !== null"
      :summary="displaySummary!"
      :session="data!.session"
    />

    <!-- Aborted / error -->
    <InterviewAborted
      v-else-if="view === 'aborted' || view === 'error'"
      :status="data!.session.status"
    />
  </div>
</template>

<style scoped>
.iv-id-shell {
  min-height: calc(100vh - 3.5rem);
  background: #090c11;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.iv-id-card {
  max-width: 380px;
  width: 100%;
  background: #111827;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  padding: 2.5rem 2rem;
  text-align: center;
  box-shadow: 0 24px 64px rgba(0,0,0,0.5);
}

.iv-id-eyebrow {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 2.5px;
  color: #f59e0b;
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.2);
  border-radius: 4px;
  padding: 2px 10px;
  margin-bottom: 14px;
}

.iv-id-title {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 1.5rem;
  color: #f1f5f9;
  margin-bottom: 10px;
}

.iv-id-desc {
  font-size: 13px;
  color: #475569;
  margin-bottom: 24px;
}

.iv-id-err-text {
  font-size: 14px;
  color: #f87171;
  margin-bottom: 16px;
}

.iv-id-back-link {
  font-size: 13px;
  color: #818cf8;
  text-decoration: underline;
}

.iv-id-loading {
  min-height: calc(100vh - 3.5rem);
  background: #090c11;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 13px;
  color: #334155;
}

.iv-id-spin {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.08);
  border-top-color: #475569;
  border-radius: 50%;
  animation: iv-spin 0.7s linear infinite;
}

@keyframes iv-spin { to { transform: rotate(360deg); } }
</style>
