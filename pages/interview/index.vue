<!-- pages/interview/index.vue -->
<script setup lang="ts">
const router = useRouter()
const localePath = useLocalePath()
const { t } = useI18n()

useHead({ title: t('interview.setup.title') })

const user = useSupabaseUser()

async function handleStart(payload: { locale: string; targetRole: string; targetCategories: string[] }) {
  try {
    const result = await $fetch<{ sessionId: string; aiText: string; aiAudioBase64: string; phase: string; resumed: boolean }>('/api/interview/start', {
      method: 'POST',
      body: payload,
    })
    // Store initial audio for [id].vue to play on mount
    if (process.client) {
      sessionStorage.setItem(`interview_init_${result.sessionId}`, JSON.stringify({
        aiText: result.aiText,
        aiAudioBase64: result.aiAudioBase64,
      }))
    }
    router.push(localePath(`/interview/${result.sessionId}`))
  } catch (e: any) {
    if (e?.statusCode === 429) {
      alert(t('interview.errors.quota_exceeded'))
    } else {
      alert(t('interview.errors.start_failed'))
    }
  }
}
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

    <!-- 已登入：顯示 SetupForm -->
    <template v-else>
      <SetupForm @start="handleStart" />
      <div class="text-center mt-4">
        <NuxtLink :to="localePath('/interview/history')" class="text-sm text-[--color-primary] hover:underline">
          {{ t('interview.setup.view_history') }} →
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
