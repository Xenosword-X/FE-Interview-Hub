<!-- components/question/AiPractice.vue -->
<script setup lang="ts">
const { t } = useI18n()
const answer = ref('')

function handleSubmit() {
  // Foundation phase: no LLM API — show login hint
  alert(t('detail.ai_login_hint'))
}
</script>

<template>
  <div class="mt-8 border border-[--color-primary-border] rounded-xl overflow-hidden bg-indigo-50/30">
    <div class="px-5 py-3.5 bg-gradient-to-r from-indigo-500 to-violet-500">
      <p class="text-sm font-bold text-white">✦ {{ t('detail.ai_section_title') }}</p>
      <p class="text-xs text-white/75 mt-0.5">{{ t('detail.ai_section_desc') }}</p>
    </div>
    <textarea
      v-model="answer"
      :placeholder="t('detail.ai_placeholder')"
      rows="4"
      class="w-full px-5 py-4 text-sm text-[--color-text-secondary] bg-white border-b border-[--color-primary-border] focus:outline-none focus:ring-2 focus:ring-[--color-primary] focus:ring-inset placeholder:text-[--color-text-muted] resize-none"
    />
    <div class="flex items-center justify-between px-5 py-3">
      <p class="text-xs text-[--color-text-muted]">{{ t('detail.ai_login_hint') }}</p>
      <button
        @click="handleSubmit"
        class="text-sm font-semibold text-white bg-indigo-500 px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors min-h-11 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
      >
        {{ t('detail.ai_submit') }}
      </button>
    </div>
  </div>
</template>
