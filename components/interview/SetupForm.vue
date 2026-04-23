<!-- components/interview/SetupForm.vue -->
<script setup lang="ts">
const emit = defineEmits<{ start: [payload: { locale: string; targetRole: string; targetCategories: string[] }] }>()
const { locale } = useI18n()
const { t } = useI18n()

const targetRole = ref('frontend-mid')
const targetCategories = ref<string[]>(['react', 'javascript'])
const isLoading = ref(false)

const roles = [
  { value: 'frontend-junior', label: t('interview.setup.role_junior') },
  { value: 'frontend-mid',    label: t('interview.setup.role_mid') },
  { value: 'frontend-senior', label: t('interview.setup.role_senior') },
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
  <div class="max-w-lg mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-[--color-text-primary] mb-2">{{ t('interview.setup.title') }}</h1>
    <p class="text-[--color-text-secondary] mb-6">{{ t('interview.setup.subtitle') }}</p>

    <!-- Role selection -->
    <div class="mb-6">
      <p class="text-sm font-semibold text-[--color-text-primary] mb-2">{{ t('interview.setup.role_label') }}</p>
      <div class="flex flex-col gap-2">
        <label v-for="r in roles" :key="r.value" class="flex items-center gap-2 cursor-pointer">
          <input type="radio" :value="r.value" v-model="targetRole" class="accent-[--color-primary]" />
          <span class="text-sm">{{ r.label }}</span>
        </label>
      </div>
    </div>

    <!-- Category selection -->
    <div class="mb-6">
      <p class="text-sm font-semibold text-[--color-text-primary] mb-2">{{ t('interview.setup.categories_label') }}</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="c in categories"
          :key="c.value"
          @click="toggleCategory(c.value)"
          :class="[
            'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
            targetCategories.includes(c.value)
              ? 'bg-[--color-primary] text-white border-[--color-primary]'
              : 'bg-white text-[--color-text-secondary] border-[--color-border] hover:border-[--color-primary]'
          ]"
        >
          {{ c.label }}
        </button>
      </div>
    </div>

    <!-- Notice -->
    <p class="text-xs text-[--color-text-muted] mb-6">{{ t('interview.setup.privacy_notice') }}</p>

    <AppButton :loading="isLoading" :disabled="isLoading" @click="handleStart" class="w-full">
      🎙️ {{ t('interview.setup.start_btn') }}
    </AppButton>
  </div>
</template>
