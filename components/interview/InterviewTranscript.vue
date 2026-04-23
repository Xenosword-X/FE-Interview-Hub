<!-- components/interview/InterviewTranscript.vue -->
<script setup lang="ts">
const props = defineProps<{
  turns: Array<{ role: 'assistant' | 'user'; content: string; turnIndex: number }>
}>()

const scrollEl = ref<HTMLElement | null>(null)

watch(() => props.turns.length, async () => {
  await nextTick()
  scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight, behavior: 'smooth' })
})
</script>

<template>
  <div ref="scrollEl" class="flex-1 overflow-y-auto px-4 py-4 space-y-1">
    <InterviewTurnCard
      v-for="turn in turns"
      :key="turn.turnIndex"
      :role="turn.role"
      :content="turn.content"
      :turn-index="turn.turnIndex"
    />
  </div>
</template>
