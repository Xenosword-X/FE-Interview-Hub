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

      <!-- Divider -->
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
            <span v-if="targetCategories.includes(c.value)" class="iv-tag-check">✓</span>
            {{ c.label }}
          </button>
        </div>
      </div>

      <!-- Privacy notice -->
      <p class="iv-notice">{{ t('interview.setup.privacy_notice') }}</p>

      <!-- CTA -->
      <button :disabled="isLoading" @click="handleStart" class="iv-cta">
        <span v-if="isLoading" class="iv-spin" />
        <svg v-else class="iv-cta-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"/>
          <path d="M19 11a7 7 0 0 1-14 0H3a9 9 0 0 0 18 0h-2z"/>
        </svg>
        {{ t('interview.setup.start_btn') }}
      </button>

    </div>
  </div>
</template>

<style scoped>
.iv-shell {
  min-height: calc(100vh - 3.5rem);
  background: #090c11;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.iv-card {
  width: 100%;
  max-width: 480px;
  background: #111827;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 20px;
  padding: 2rem;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.02),
    0 32px 80px rgba(0,0,0,0.6),
    0 8px 24px rgba(0,0,0,0.3);
}

.iv-card-header { text-align: center; margin-bottom: 1.5rem; }

.iv-eyebrow {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 2.5px;
  color: #f59e0b;
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.2);
  border-radius: 4px;
  padding: 2px 10px;
  margin-bottom: 12px;
}

.iv-title {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 1.875rem;
  color: #f1f5f9;
  line-height: 1.2;
  margin-bottom: 8px;
}

.iv-subtitle {
  font-size: 0.8125rem;
  color: #475569;
  line-height: 1.6;
  max-width: 360px;
  margin: 0 auto;
}

.iv-divider {
  height: 1px;
  background: rgba(255,255,255,0.05);
  margin: 1.5rem 0;
}

.iv-section { margin-bottom: 1.5rem; }

.iv-section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #475569;
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
  border: 1px solid rgba(255,255,255,0.07);
  background: #0d1117;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
}

.iv-role:hover {
  border-color: rgba(255,255,255,0.14);
  color: #94a3b8;
}

.iv-role--on {
  border-color: rgba(245,158,11,0.5);
  background: rgba(245,158,11,0.07);
  color: #fbbf24;
  box-shadow: 0 0 16px rgba(245,158,11,0.1);
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
  opacity: 0.6;
}

.iv-tags { display: flex; flex-wrap: wrap; gap: 8px; }

.iv-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 100px;
  border: 1px solid rgba(255,255,255,0.07);
  background: #0d1117;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.iv-tag:hover {
  border-color: rgba(255,255,255,0.14);
  color: #94a3b8;
}

.iv-tag--on {
  border-color: rgba(99,102,241,0.5);
  background: rgba(99,102,241,0.1);
  color: #a5b4fc;
}

.iv-tag-check {
  font-size: 10px;
  color: #818cf8;
  font-weight: 700;
}

.iv-notice {
  font-size: 11px;
  color: #334155;
  line-height: 1.6;
  padding: 10px 12px;
  background: rgba(0,0,0,0.3);
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.04);
  margin-bottom: 1.5rem;
}

.iv-cta {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
  color: white;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 20px rgba(99,102,241,0.3);
  letter-spacing: 0.3px;
}

.iv-cta:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 28px rgba(99,102,241,0.4);
}

.iv-cta:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

.iv-cta-icon { width: 18px; height: 18px; flex-shrink: 0; }

.iv-spin {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.25);
  border-top-color: white;
  border-radius: 50%;
  animation: iv-spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes iv-spin { to { transform: rotate(360deg); } }
</style>
