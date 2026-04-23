<!-- components/interview/InterviewAborted.vue -->
<script setup lang="ts">
defineProps<{ status: 'aborted' | 'error' | string }>()
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <div class="max-w-md mx-auto px-4 py-16 text-center">
    <p class="text-4xl mb-4">{{ status === 'error' ? '⚠️' : '🔚' }}</p>
    <h2 class="text-lg font-semibold text-[--color-text-primary] mb-2">
      {{ status === 'error' ? t('interview.errors.session_error_title') : t('interview.errors.session_aborted_title') }}
    </h2>
    <p class="text-sm text-[--color-text-secondary] mb-6">
      {{ status === 'error' ? t('interview.errors.session_error_desc') : t('interview.errors.session_aborted_desc') }}
    </p>
    <NuxtLink :to="localePath('/interview')">
      <AppButton>{{ t('interview.errors.back_to_setup') }}</AppButton>
    </NuxtLink>
  </div>
</template>
