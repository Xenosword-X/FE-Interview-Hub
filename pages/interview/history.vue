<!-- pages/interview/history.vue -->
<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const localePath = useLocalePath()

useHead({ title: t('interview.history.title') })

const { data, pending, refresh } = await useFetch<{
  items: Array<{
    id: string; startedAt: string; endedAt: string | null; status: string
    targetRole: string; targetCategories: string[]; totalTurns: number; hasSummary: boolean
  }>
  nextCursor: string | null
}>('/api/interview/history')

const deletingId = ref<string | null>(null)
const confirmDeleteId = ref<string | null>(null)

async function deleteSession(id: string) {
  deletingId.value = id
  try {
    await $fetch(`/api/interview/${id}`, { method: 'DELETE' })
    await refresh()
  } finally {
    deletingId.value = null
    confirmDeleteId.value = null
  }
}

function statusIcon(status: string) {
  if (status === 'completed') return '✅'
  if (status === 'error') return '⚠️'
  return '🔚'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString()
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-[--color-text-primary]">{{ t('interview.history.title') }}</h1>
      <NuxtLink :to="localePath('/interview')" class="text-sm text-[--color-primary] hover:underline">
        + {{ t('interview.history.new_session') }}
      </NuxtLink>
    </div>

    <div v-if="pending" class="text-sm text-[--color-text-muted] text-center py-12">
      {{ t('interview.loading') }}
    </div>

    <div v-else-if="!data?.items?.length" class="text-sm text-[--color-text-muted] text-center py-12">
      {{ t('interview.history.empty') }}
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="item in data.items"
        :key="item.id"
        class="border border-[--color-border] rounded-xl p-4 bg-white"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-lg shrink-0">{{ statusIcon(item.status) }}</span>
            <div class="min-w-0">
              <p class="text-sm font-medium text-[--color-text-primary] truncate">
                {{ t(`interview.setup.role_${item.targetRole.split('-')[1]}`) }}
                · {{ item.targetCategories.join(', ') }}
              </p>
              <p class="text-xs text-[--color-text-muted]">{{ formatDate(item.startedAt) }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <NuxtLink
              v-if="item.hasSummary"
              :to="localePath(`/interview/${item.id}`)"
              class="text-xs text-[--color-primary] hover:underline"
            >
              {{ t('interview.history.view_report') }} →
            </NuxtLink>
            <button
              @click="confirmDeleteId = item.id"
              :disabled="deletingId === item.id"
              class="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              {{ t('interview.history.delete') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete confirm dialog -->
    <div v-if="confirmDeleteId" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div class="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
        <p class="text-sm mb-4">{{ t('interview.history.delete_confirm') }}</p>
        <div class="flex gap-3">
          <AppButton class="flex-1" @click="deleteSession(confirmDeleteId!)">
            {{ t('interview.history.confirm_delete') }}
          </AppButton>
          <button @click="confirmDeleteId = null" class="flex-1 text-sm border border-[--color-border] rounded-lg py-2">
            {{ t('interview.stage.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
