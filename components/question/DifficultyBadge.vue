<!-- components/question/DifficultyBadge.vue -->
<script setup lang="ts">
defineProps<{ difficulty: 'basic' | 'intermediate' | 'advanced' }>()

const colourMap = {
  basic:        'bg-slate-100  text-slate-600',
  intermediate: 'bg-indigo-50  text-indigo-700',
  advanced:     'bg-violet-100 text-violet-800',
}
</script>

<template>
  <span
    :class="['inline-block text-[10px] font-semibold px-2 py-0.5 rounded', colourMap[difficulty]]"
  >
    {{ $t(`difficulty.${difficulty}`) }}
  </span>
</template>
