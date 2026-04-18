<!-- pages/questions/index.vue -->
<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()

const { filtered, activeTag } = useQuestions()
const { categories } = useCategories()

const siteUrl = useSiteUrl()

useSeoMeta({
  title: `${t('questions.page_title')} | FE Interview Hub`,
  description: t('home.seo_description'),
  ogTitle: `${t('questions.page_title')} | FE Interview Hub`,
  ogDescription: t('home.seo_description'),
  ogUrl: `${siteUrl}/${locale.value}/questions`,
  ogType: 'website',
  ogImage: `${siteUrl}/og-image.png`,
  twitterCard: 'summary_large_image',
})

// canonical excludes ?tag= to avoid duplicate indexing
useHead({
  link: [
    { rel: 'canonical', href: `${siteUrl}/${locale.value}/questions` },
    { rel: 'alternate', hreflang: 'zh-TW', href: `${siteUrl}/zh/questions` },
    { rel: 'alternate', hreflang: 'en-US', href: `${siteUrl}/en/questions` },
  ]
})
</script>

<template>
  <div class="flex flex-col lg:flex-row min-h-full">
    <!-- Mobile Tag Bar (horizontal scroll) -->
    <div class="lg:hidden overflow-x-auto border-b border-[--color-border] bg-white">
      <div class="flex gap-2 px-4 py-2.5 min-w-max">
        <NuxtLink
          :to="localePath('/questions')"
          :class="[
            'text-[11px] font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors',
            !activeTag
              ? 'bg-[--color-primary-light] text-[--color-primary] border-[--color-primary-border]'
              : 'border-[--color-border] text-[--color-text-secondary] bg-white'
          ]"
        >
          {{ t('questions.all_categories') }}
        </NuxtLink>
        <NuxtLink
          v-for="cat in categories"
          :key="cat.key"
          :to="`${localePath('/questions')}?tag=${cat.key}`"
          :class="[
            'text-[11px] font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors',
            activeTag === cat.key
              ? 'bg-[--color-primary-light] text-[--color-primary] border-[--color-primary-border]'
              : 'border-[--color-border] text-[--color-text-secondary] bg-white'
          ]"
        >
          {{ t(`categories.${cat.key}`) }}
        </NuxtLink>
      </div>
    </div>

    <!-- Question List -->
    <div class="flex-1 px-4 lg:px-8 py-6 max-w-2xl">
      <h1 class="text-lg font-bold text-[--color-text-primary] mb-4">
        {{ activeTag ? t(`categories.${activeTag}`) : t('questions.page_title') }}
        <span class="text-sm font-normal text-[--color-text-muted] ml-2">{{ filtered.length }}</span>
      </h1>

      <p v-if="filtered.length === 0" class="text-sm text-[--color-text-muted]">
        {{ t('questions.no_results') }}
      </p>

      <div class="grid gap-3">
        <QuestionCard v-for="q in filtered" :key="q.slug" :question="q" />
      </div>
    </div>
  </div>
</template>
