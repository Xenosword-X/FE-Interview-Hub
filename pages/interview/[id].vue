<!-- pages/interview/[id].vue -->
<script setup lang="ts">
import type { InterviewSession, InterviewSummary, InterviewTurn } from '~/server/utils/interview/types'

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
    <!-- 未登入：顯示登入提示 -->
    <div
      v-if="!user"
      class="max-w-md mx-auto mt-20 px-6 py-10 text-center border border-[--color-border] rounded-2xl bg-white shadow-sm"
    >
      <p class="text-lg font-semibold text-[--color-text-primary] mb-2">
        {{ t('interview.setup.title') }}
      </p>
      <p class="text-sm text-[--color-text-muted] mb-6">
        {{ t('auth.login_required') }}
      </p>
      <ClientOnly>
        <LoginButton />
      </ClientOnly>
    </div>

    <div v-else-if="pending" class="flex items-center justify-center h-64">
      <span class="text-[--color-text-muted] text-sm">{{ t('interview.loading') }}</span>
    </div>

    <div v-else-if="error || !data" class="p-8 text-center">
      <p class="text-sm text-red-500">{{ t('interview.errors.not_found') }}</p>
      <NuxtLink :to="localePath('/interview')" class="text-sm text-[--color-primary] underline mt-2 block">
        {{ t('interview.errors.back_to_setup') }}
      </NuxtLink>
    </div>

    <InterviewStage
      v-else-if="view === 'active'"
      :session-id="sessionId"
      :initial-ai-text="initialAiText"
      :initial-audio-base64="initialAudioBase64"
      @completed="handleCompleted"
    />

    <InterviewSummary
      v-else-if="view === 'summary' || localSummary !== null"
      :summary="displaySummary!"
      :session="data!.session"
    />

    <InterviewAborted
      v-else-if="view === 'aborted' || view === 'error'"
      :status="data!.session.status"
    />
  </div>
</template>
