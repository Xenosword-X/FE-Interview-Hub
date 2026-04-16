<!-- components/question/TagBadge.vue -->
<script setup lang="ts">
const props = defineProps<{ category: string }>()

const colourMap: Record<string, string> = {
  javascript:  'bg-yellow-100 text-yellow-800',
  vue:         'bg-green-100  text-green-800',
  css:         'bg-pink-100   text-pink-800',
  typescript:  'bg-blue-100   text-blue-800',
  react:       'bg-sky-100    text-sky-800',
  'web-vitals':'bg-purple-100 text-purple-800',
  browser:     'bg-orange-100 text-orange-800',
  http:        'bg-cyan-100   text-cyan-800',
}

const colour = computed(() =>
  colourMap[props.category] ?? 'bg-slate-100 text-slate-700'
)
</script>

<template>
  <span
    :class="['inline-block text-[10px] font-semibold px-2 py-0.5 rounded', colour]"
  >
    {{ $t(`categories.${category}`) }}
  </span>
</template>
