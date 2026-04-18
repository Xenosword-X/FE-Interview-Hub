<!-- pages/index.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'home' })

const { t, locale } = useI18n()
const localePath = useLocalePath()

const { categories } = useCategories()

import type { QuestionMeta } from '~/composables/useQuestions'

const { data: allQuestions } = await useAsyncData(
  `all-questions-${locale.value}`,
  () => $fetch<QuestionMeta[]>('/api/questions', { query: { locale: locale.value } })
)

const hotQuestions = computed(() => allQuestions.value?.slice(0, 5) ?? [])

const siteUrl = useSiteUrl()
useSeoMeta({
  title: t('home.seo_title'),
  description: t('home.seo_description'),
  ogTitle: t('home.seo_title'),
  ogDescription: t('home.seo_description'),
  ogUrl: `${siteUrl}/${locale.value}/`,
  ogType: 'website',
  ogImage: `${siteUrl}/og-image.png`,
  twitterCard: 'summary_large_image',
  twitterTitle: t('home.seo_title'),
  twitterDescription: t('home.seo_description'),
})

useHead({
  link: [
    { rel: 'canonical', href: `${siteUrl}/${locale.value}/` },
    { rel: 'alternate', hreflang: 'zh-TW', href: `${siteUrl}/zh/` },
    { rel: 'alternate', hreflang: 'en-US', href: `${siteUrl}/en/` },
    { rel: 'alternate', hreflang: 'x-default', href: `${siteUrl}/zh/` },
  ],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'FE Interview Hub',
      url: `${siteUrl}/${locale.value}/`,
      description: t('home.seo_description'),
      inLanguage: locale.value === 'zh' ? 'zh-TW' : 'en-US',
    })
  }]
})
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="py-12 px-6 text-center bg-gradient-to-b from-slate-50 to-white border-b border-[--color-border]">
      <span class="inline-flex items-center gap-1.5 bg-[--color-primary-light] text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-[--color-primary-border]">
        <span class="w-1.5 h-1.5 rounded-full bg-indigo-500" aria-hidden="true" />
        {{ t('home.badge') }}
      </span>
      <h1 class="text-[32px] font-bold text-[--color-text-primary] leading-tight mb-3">
        {{ t('home.title') }}<br>
        <span class="text-[--color-primary]">{{ t('home.title_accent') }}</span>
      </h1>
      <img src="~/assets/img/LOGO.png" alt="FE Interview Hub" class="h-100 w-auto mx-auto mb-4" />
      <p class="text-[15px] text-[--color-text-secondary] leading-relaxed max-w-md mx-auto mb-7">
        {{ t('home.description') }}
      </p>
      <div class="flex justify-center gap-8">
        <div class="text-center">
          <p class="text-[22px] font-bold text-[--color-text-primary]">50+</p>
          <p class="text-xs text-[--color-text-muted] mt-0.5">{{ t('home.stat_questions') }}</p>
        </div>
        <div class="text-center">
          <p class="text-[22px] font-bold text-[--color-text-primary]">8</p>
          <p class="text-xs text-[--color-text-muted] mt-0.5">{{ t('home.stat_categories') }}</p>
        </div>
        <div class="text-center">
          <p class="text-[22px] font-bold text-[--color-primary]">AI</p>
          <p class="text-xs text-[--color-text-muted] mt-0.5">{{ t('home.stat_ai') }}</p>
        </div>
      </div>
    </section>

    <div class="max-w-360 mx-auto px-4 lg:px-6">
      <!-- Category Grid -->
      <section class="py-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-bold text-[--color-text-primary]">{{ t('home.section_categories') }}</h2>
          <NuxtLink :to="localePath('/questions')" class="text-xs text-[--color-primary] font-medium hover:underline">
            {{ t('home.view_all') }}
          </NuxtLink>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <CategoryCard v-for="cat in categories" :key="cat.key" :category="cat" />
        </div>
      </section>

      <hr class="border-[--color-border]">

      <!-- Hot Questions -->
      <section class="py-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-bold text-[--color-text-primary]">{{ t('home.section_hot') }}</h2>
          <NuxtLink :to="localePath('/questions')" class="text-xs text-[--color-primary] font-medium hover:underline">
            {{ t('home.view_all') }}
          </NuxtLink>
        </div>
        <div class="divide-y divide-[--color-border]">
          <NuxtLink
            v-for="(q, idx) in hotQuestions"
            :key="q.slug"
            :to="localePath(`/questions/${q.slug}`)"
            class="flex items-center gap-3 py-3.5 hover:bg-indigo-50/50 -mx-3 px-3 rounded-lg transition-colors duration-150 group"
          >
            <span class="text-xs font-bold text-indigo-400 min-w-[24px]">{{ String(idx + 1).padStart(2, '0') }}</span>
            <div class="flex-1 min-w-0">
              <p class="text-base font-medium text-[--color-text-primary] group-hover:text-[--color-primary] truncate">{{ q.title }}</p>
              <div class="flex gap-1.5 mt-1">
                <TagBadge :category="q.category" />
                <DifficultyBadge :difficulty="q.difficulty" />
              </div>
            </div>
            <svg class="w-4 h-4 text-[--color-text-muted] shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </NuxtLink>
        </div>
      </section>
    </div>

    <!-- AI CTA Banner -->
    <div class="max-w-360 mx-auto px-4 lg:px-6 mb-8">
    <section class="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
      <div class="flex-1">
        <h2 class="text-base font-bold text-white mb-1">{{ t('home.cta_title') }}</h2>
        <p class="text-sm text-white/75 leading-relaxed">{{ t('home.cta_desc') }}</p>
      </div>
      <NuxtLink
        :to="localePath('/questions/event-loop')"
        class="shrink-0 bg-white text-[--color-primary] text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-50 transition-colors focus-visible:ring-2 focus-visible:ring-white"
      >
        {{ t('home.cta_btn') }}
      </NuxtLink>
    </section>
    </div>
  </div>
</template>
