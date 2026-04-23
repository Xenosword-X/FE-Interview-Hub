<!-- components/interview/SetupForm.vue -->
<script setup lang="ts">
const emit = defineEmits<{ start: [payload: { locale: string; targetRole: string; targetCategories: string[] }] }>()
const { locale, t } = useI18n()

const targetRole = ref('frontend-mid')
const targetCategories = ref<string[]>(['react', 'javascript'])
const isLoading = ref(false)

const roles = [
  { value: 'frontend-junior', label: t('interview.setup.role_junior'), icon: '🌱', sub: '初階' },
  { value: 'frontend-mid',    label: t('interview.setup.role_mid'),    icon: '⚡', sub: '中階' },
  { value: 'frontend-senior', label: t('interview.setup.role_senior'), icon: '🎯', sub: '資深' },
]

const categories = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'react',      label: 'React' },
  { value: 'vue',        label: 'Vue 3' },
  { value: 'css',        label: 'CSS' },
  { value: 'browser',    label: t('categories.browser') },
  { value: 'web-vitals', label: 'Web Vitals' },
]

function toggleCategory(val: string) {
  const idx = targetCategories.value.indexOf(val)
  if (idx >= 0) {
    if (targetCategories.value.length > 1) targetCategories.value.splice(idx, 1)
  } else {
    targetCategories.value.push(val)
  }
}

async function handleStart() {
  isLoading.value = true
  emit('start', { locale: locale.value, targetRole: targetRole.value, targetCategories: targetCategories.value })
}
</script>

<template>
  <div class="iv-shell">
    <div class="iv-card">

      <!-- Header -->
      <div class="iv-card-header">
        <span class="iv-eyebrow">AI POWERED</span>
        <h1 class="iv-title">{{ t('interview.setup.title') }}</h1>
        <p class="iv-subtitle">{{ t('interview.setup.subtitle') }}</p>
      </div>

      <div class="iv-divider" />

      <!-- Role -->
      <div class="iv-section">
        <p class="iv-section-label">{{ t('interview.setup.role_label') }}</p>
        <div class="iv-roles">
          <button
            v-for="r in roles"
            :key="r.value"
            @click="targetRole = r.value"
            :class="['iv-role', targetRole === r.value && 'iv-role--on']"
          >
            <span class="iv-role-icon">{{ r.icon }}</span>
            <span class="iv-role-name">前端工程師</span>
            <span class="iv-role-sub">{{ r.sub }}</span>
          </button>
        </div>
      </div>

      <!-- Categories -->
      <div class="iv-section">
        <p class="iv-section-label">{{ t('interview.setup.categories_label') }}</p>
        <div class="iv-tags">
          <button
            v-for="c in categories"
            :key="c.value"
            @click="toggleCategory(c.value)"
            :class="['iv-tag', targetCategories.includes(c.value) && 'iv-tag--on']"
          >
            {{ c.label }}
          </button>
        </div>
      </div>

      <!-- Notice -->
      <p class="iv-notice">{{ t('interview.setup.privacy_notice') }}</p>

      <!-- CTA -->
      <button :disabled="isLoading" @click="handleStart" class="iv-cta">
        <span v-if="isLoading" class="iv-spin" />
        <svg v-else class="iv-cta-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"/>
          <path d="M19 11a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.94V22h2v-2.06A9 9 0 0 0 21 11h-2z"/>
        </svg>
        {{ t('interview.setup.start_btn') }}
      </button>

    </div>
  </div>
</template>

<style scoped>
.iv-shell {
  min-height: calc(100vh - 3.5rem);
  background: var(--color-bg, #f8fafc);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.iv-card {
  width: 100%;
  max-width: 480px;
  background: #ffffff;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(99,102,241,0.07);
}

.iv-card-header { text-align: center; margin-bottom: 1.5rem; }

.iv-eyebrow {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--color-primary, #6366f1);
  background: var(--color-primary-light, #eef2ff);
  border: 1px solid var(--color-primary-border, #c7d2fe);
  border-radius: 4px;
  padding: 2px 10px;
  margin-bottom: 12px;
}

.iv-title {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 1.875rem;
  color: var(--color-text-primary, #0f172a);
  line-height: 1.2;
  margin-bottom: 8px;
}

.iv-subtitle {
  font-size: 0.8125rem;
  color: var(--color-text-muted, #64748b);
  line-height: 1.6;
  max-width: 360px;
  margin: 0 auto;
}

.iv-divider {
  height: 1px;
  background: var(--color-border, #e2e8f0);
  margin: 1.5rem 0;
}

.iv-section { margin-bottom: 1.5rem; }

.iv-section-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--color-text-muted, #64748b);
  margin-bottom: 10px;
}

.iv-roles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.iv-role {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 8px;
  border-radius: 12px;
  border: 1.5px solid var(--color-border, #e2e8f0);
  background: var(--color-bg, #f8fafc);
  color: var(--color-text-muted, #64748b);
  cursor: pointer;
  transition: all 0.15s ease;
}

.iv-role:hover {
  border-color: var(--color-border-hover, #a5b4fc);
  color: var(--color-text-primary, #0f172a);
}

.iv-role--on {
  border-color: var(--color-primary, #6366f1);
  background: var(--color-primary-light, #eef2ff);
  color: var(--color-primary, #6366f1);
}

.iv-role-icon { font-size: 1.25rem; line-height: 1; }

.iv-role-name {
  font-size: 11px;
  font-weight: 600;
  color: inherit;
  line-height: 1.2;
}

.iv-role-sub {
  font-size: 10px;
  opacity: 0.7;
}

.iv-tags { display: flex; flex-wrap: wrap; gap: 8px; }

.iv-tag {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 100px;
  border: 1.5px solid var(--color-border, #e2e8f0);
  background: #ffffff;
  color: var(--color-text-secondary, #374151);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.iv-tag:hover {
  border-color: var(--color-border-hover, #a5b4fc);
  color: var(--color-primary, #6366f1);
}

.iv-tag--on {
  border-color: var(--color-primary, #6366f1);
  background: var(--color-primary, #6366f1);
  color: #ffffff;
}

.iv-notice {
  font-size: 11px;
  color: var(--color-text-muted, #64748b);
  line-height: 1.6;
  padding: 10px 12px;
  background: var(--color-bg, #f8fafc);
  border-radius: 8px;
  border: 1px solid var(--color-border, #e2e8f0);
  margin-bottom: 1.5rem;
}

.iv-cta {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px;
  border-radius: 12px;
  background: var(--color-primary, #6366f1);
  color: white;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 12px rgba(99,102,241,0.25);
  letter-spacing: 0.3px;
}

.iv-cta:hover:not(:disabled) {
  background: #4f46e5;
  box-shadow: 0 4px 18px rgba(99,102,241,0.35);
  transform: translateY(-1px);
}

.iv-cta:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

.iv-cta-icon { width: 18px; height: 18px; flex-shrink: 0; }

.iv-spin {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: iv-spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes iv-spin { to { transform: rotate(360deg); } }
</style>
