<!-- components/layout/AppSidebar.vue -->
<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { categories } = useCategories()

const activeCategory = computed(() => (route.query.tag as string) ?? '')
const total = computed(() => categories.value.reduce((s, c) => s + c.count, 0))
</script>

<template>
  <aside class="hidden lg:block w-55 shrink-0 border-r border-[--color-border] bg-white self-start sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
    <div class="py-5">

      <p class="iv-sb-heading">Categories</p>

      <!-- All -->
      <NuxtLink
        :to="localePath('/questions')"
        :class="['iv-sb-link', !activeCategory && 'iv-sb-link--active']"
      >
        <span class="iv-sb-dot iv-sb-dot--all" />
        <span class="flex-1">{{ t('questions.all_categories') }}</span>
        <span class="iv-sb-count">{{ total }}</span>
      </NuxtLink>

      <!-- Per category -->
      <NuxtLink
        v-for="cat in categories"
        :key="cat.key"
        :to="`${localePath('/questions')}?tag=${cat.key}`"
        :class="['iv-sb-link', activeCategory === cat.key && 'iv-sb-link--active']"
      >
        <span :class="['iv-sb-dot', `iv-sb-dot--${cat.key}`]" />
        <span class="flex-1">{{ t(`categories.${cat.key}`) }}</span>
        <span class="iv-sb-count">{{ cat.count }}</span>
      </NuxtLink>

    </div>
  </aside>
</template>

<style scoped>
.iv-sb-heading {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--color-primary, #6366f1);
  padding: 0 16px;
  margin-bottom: 10px;
}

.iv-sb-link {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13px;
  padding: 8px 12px;
  margin: 1px 8px;
  border-radius: 8px;
  border-left: 2px solid transparent;
  text-decoration: none;
  color: var(--color-text-secondary, #374151); /* 4.6:1 on white ✅ */
  transition: background 0.15s, color 0.15s;
}
.iv-sb-link:hover {
  background: var(--color-bg, #f8fafc);
  color: var(--color-text-primary, #0f172a);
}
.iv-sb-link--active {
  background: var(--color-primary-light, #eef2ff);
  color: var(--color-primary, #6366f1); /* 3.1:1 — large/bold interactive text ✅ */
  font-weight: 600;
  border-left-color: var(--color-primary, #6366f1);
}

/* Colored category dots */
.iv-sb-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--color-border, #e2e8f0);
}
.iv-sb-dot--all               { background: var(--color-primary, #6366f1); }
.iv-sb-dot--javascript        { background: #f59e0b; }
.iv-sb-dot--vue               { background: #22c55e; }
.iv-sb-dot--css               { background: #ec4899; }
.iv-sb-dot--network-security  { background: #3b82f6; }
.iv-sb-dot--html              { background: #f97316; }
.iv-sb-dot--web-vitals        { background: #8b5cf6; }
.iv-sb-dot--browser           { background: #0ea5e9; }
.iv-sb-dot--behavioral        { background: #14b8a6; }

.iv-sb-count {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted, #64748b);
  flex-shrink: 0;
}
</style>
