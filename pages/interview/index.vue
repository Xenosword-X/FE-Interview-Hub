<!-- pages/interview/index.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'home' })

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
    <!-- Not logged in -->
    <div v-if="!user" class="iv-index-login">
      <div class="iv-index-login-card">
        <span class="iv-index-eyebrow">AI POWERED</span>
        <h1 class="iv-index-title">{{ t('interview.setup.title') }}</h1>
        <p class="iv-index-desc">{{ t('auth.login_required') }}</p>
        <ClientOnly>
          <LoginButton />
        </ClientOnly>
      </div>
    </div>

    <!-- Logged in: SetupForm handles the dark shell itself -->
    <template v-else>
      <SetupForm @start="handleStart" />
      <div class="iv-index-hist-link">
        <NuxtLink :to="localePath('/interview/history')" class="iv-index-hist-btn">
          {{ t('interview.setup.view_history') }} →
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.iv-index-login {
  min-height: calc(100vh - 3.5rem);
  background: var(--color-bg, #f8fafc);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.iv-index-login-card {
  max-width: 400px;
  width: 100%;
  background: #ffffff;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 20px;
  padding: 2.5rem 2rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(99,102,241,0.07);
}

.iv-index-eyebrow {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--color-primary, #6366f1);
  background: var(--color-primary-light, #eef2ff);
  border: 1px solid var(--color-primary-border, #c7d2fe);
  border-radius: 4px;
  padding: 2px 10px;
  margin-bottom: 14px;
}

.iv-index-title {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 1.75rem;
  color: var(--color-text-primary, #0f172a);
  margin-bottom: 10px;
}

.iv-index-desc {
  font-size: 13px;
  color: var(--color-text-muted, #64748b);
  margin-bottom: 24px;
  line-height: 1.6;
}

.iv-index-hist-link {
  background: var(--color-bg, #f8fafc);
  text-align: center;
  padding-bottom: 2rem;
  margin-top: -1px;
}

.iv-index-hist-btn {
  font-size: 12px;
  color: var(--color-text-muted, #64748b);
  text-decoration: none;
  transition: color 0.15s;
}

.iv-index-hist-btn:hover { color: var(--color-primary, #6366f1); }
</style>
