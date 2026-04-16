<!-- components/layout/AppSidebar.vue -->
<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { categories } = useCategories()

const activeCategory = computed(() => (route.query.tag as string) ?? '')
</script>

<template>
  <aside class="hidden lg:block w-[220px] shrink-0 border-r border-[--color-border] bg-white self-start sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
    <div class="py-6 px-0">
      <p class="text-[11px] font-semibold text-[--color-text-muted] uppercase tracking-wider px-4 mb-3">
        {{ t('questions.all_categories') }}
      </p>
      <NuxtLink
        :to="localePath('/questions')"
        :class="[
          'flex items-center gap-2 text-sm px-4 py-2.5 border-l-2 transition-colors duration-150 mx-2 rounded-r-lg',
          !activeCategory
            ? 'border-[--color-primary] bg-[--color-primary-light] text-[--color-primary] font-semibold'
            : 'border-transparent text-[--color-text-secondary] hover:bg-slate-50 hover:text-[--color-text-primary]'
        ]"
      >
        {{ t('questions.all_categories') }}
        <span class="ml-auto text-xs font-medium text-[--color-text-muted]">
          {{ categories.reduce((s, c) => s + c.count, 0) }}
        </span>
      </NuxtLink>

      <NuxtLink
        v-for="cat in categories"
        :key="cat.key"
        :to="`${localePath('/questions')}?tag=${cat.key}`"
        :class="[
          'flex items-center gap-2 text-sm px-4 py-2.5 border-l-2 transition-colors duration-150 mx-2 rounded-r-lg',
          activeCategory === cat.key
            ? 'border-[--color-primary] bg-[--color-primary-light] text-[--color-primary] font-semibold'
            : 'border-transparent text-[--color-text-secondary] hover:bg-slate-50 hover:text-[--color-text-primary]'
        ]"
      >
        {{ t(`categories.${cat.key}`) }}
        <span class="ml-auto text-xs font-medium text-[--color-text-muted]">{{ cat.count }}</span>
      </NuxtLink>
    </div>
  </aside>
</template>
