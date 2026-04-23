<!-- components/interview/InterviewSummary.vue -->
<script setup lang="ts">
import type { InterviewSession, InterviewSummary } from '~/server/utils/interview/types'

const props = defineProps<{ summary: InterviewSummary; session: InterviewSession }>()
const { t } = useI18n()
const localePath = useLocalePath()

const expandedQuestions = ref<Set<number>>(new Set())
function toggleQuestion(idx: number) {
  expandedQuestions.value.has(idx) ? expandedQuestions.value.delete(idx) : expandedQuestions.value.add(idx)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <!-- Meta -->
    <div class="text-xs text-[--color-text-muted] mb-6 flex flex-wrap gap-2">
      <span>{{ formatDate(session.started_at) }}</span>
      <span>·</span>
      <span>{{ t(`interview.setup.role_${session.target_role.split('-')[1]}`) }}</span>
      <span>·</span>
      <span>{{ session.target_categories.join(', ') }}</span>
    </div>

    <!-- Overall -->
    <section class="mb-6">
      <h2 class="text-sm font-semibold text-[--color-text-primary] mb-2">📝 {{ t('interview.summary.overall') }}</h2>
      <p class="text-sm text-[--color-text-secondary] bg-[--color-surface] rounded-lg p-4 border border-[--color-border]">
        {{ summary.overall }}
      </p>
    </section>

    <!-- Strengths -->
    <section class="mb-6">
      <h2 class="text-sm font-semibold text-[--color-text-primary] mb-2">✨ {{ t('interview.summary.strengths') }}</h2>
      <ul class="space-y-1">
        <li v-for="(item, i) in summary.strengths" :key="i" class="text-sm text-[--color-text-secondary] flex gap-2">
          <span class="text-green-500 shrink-0">•</span>{{ item }}
        </li>
      </ul>
    </section>

    <!-- Improvements -->
    <section class="mb-6">
      <h2 class="text-sm font-semibold text-[--color-text-primary] mb-2">⚠️ {{ t('interview.summary.improvements') }}</h2>
      <ul class="space-y-1">
        <li v-for="(item, i) in summary.improvements" :key="i" class="text-sm text-[--color-text-secondary] flex gap-2">
          <span class="text-amber-500 shrink-0">•</span>{{ item }}
        </li>
      </ul>
    </section>

    <!-- Study Areas -->
    <section class="mb-6">
      <h2 class="text-sm font-semibold text-[--color-text-primary] mb-2">📚 {{ t('interview.summary.study_areas') }}</h2>
      <ul class="space-y-1">
        <li v-for="(item, i) in summary.studyAreas" :key="i" class="text-sm text-[--color-text-secondary] flex gap-2">
          <span class="text-blue-500 shrink-0">•</span>{{ item }}
        </li>
      </ul>
    </section>

    <!-- Per Question -->
    <section class="mb-8">
      <h2 class="text-sm font-semibold text-[--color-text-primary] mb-3">🎤 {{ t('interview.summary.per_question') }}</h2>
      <div class="space-y-2">
        <div
          v-for="(q, i) in summary.perQuestion"
          :key="i"
          class="border border-[--color-border] rounded-lg overflow-hidden"
        >
          <button
            @click="toggleQuestion(i)"
            class="w-full text-left px-4 py-3 flex items-center gap-2 text-sm text-[--color-text-primary] hover:bg-[--color-surface] transition-colors"
          >
            <span class="text-[--color-text-muted] shrink-0">{{ expandedQuestions.has(i) ? '▼' : '▸' }}</span>
            <span class="font-medium">Q{{ i + 1 }}：{{ q.question }}</span>
          </button>
          <div v-if="expandedQuestions.has(i)" class="px-4 pb-4 pt-1 text-xs text-[--color-text-secondary] space-y-2 border-t border-[--color-border]">
            <div v-if="q.keyPoints.length">
              <p class="font-medium mb-1">{{ t('interview.summary.key_points') }}：</p>
              <ul class="list-disc list-inside space-y-0.5">
                <li v-for="(pt, j) in q.keyPoints" :key="j">{{ pt }}</li>
              </ul>
            </div>
            <p><span class="font-medium">{{ t('interview.summary.feedback') }}：</span>{{ q.feedback }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Actions -->
    <div class="flex gap-3">
      <NuxtLink :to="localePath('/interview')" class="flex-1">
        <AppButton class="w-full" variant="secondary">{{ t('interview.summary.back_to_setup') }}</AppButton>
      </NuxtLink>
      <NuxtLink :to="localePath('/interview/history')" class="flex-1">
        <AppButton class="w-full" variant="secondary">{{ t('interview.summary.view_history') }}</AppButton>
      </NuxtLink>
    </div>
  </div>
</template>
