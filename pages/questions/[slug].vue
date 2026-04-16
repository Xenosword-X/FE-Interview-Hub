<!-- pages/questions/[slug].vue -->
<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const slug = route.params.slug as string

// Fetch current question
const { data: question } = await useAsyncData(
  `question-${locale.value}-${slug}`,
  async () => {
    const all = await queryCollection('questions').all()
    return all.find(q => q.path?.includes(`/${locale.value}/`) && q.slug === slug) ?? null
  }
)

if (!question.value) {
  throw createError({ statusCode: 404, statusMessage: 'Question not found' })
}

// Fetch all questions for prev/next navigation
const { data: allQuestions } = await useAsyncData(
  `all-questions-nav-${locale.value}`,
  async () => {
    const all = await queryCollection('questions').all()
    return all.filter(q => q.path?.includes(`/${locale.value}/`))
  }
)

const currentIndex = computed(() =>
  allQuestions.value?.findIndex(q => q.slug === slug) ?? -1
)
const prevQuestion = computed(() =>
  currentIndex.value > 0 ? (allQuestions.value?.[currentIndex.value - 1] ?? null) : null
)
const nextQuestion = computed(() =>
  currentIndex.value < (allQuestions.value?.length ?? 0) - 1
    ? (allQuestions.value?.[currentIndex.value + 1] ?? null)
    : null
)

// TOC links from content body
const tocLinks = computed(() => {
  const toc = (question.value as any)?.body?.toc?.links
  return Array.isArray(toc) ? toc as Array<{ id: string; text: string; depth: number }> : []
})

// SEO
const siteUrl = 'https://fe-interview-hub.example.com'

useSeoMeta({
  title: `${question.value?.title} | FE Interview Hub`,
  description: question.value?.title,
  ogTitle: question.value?.title,
  ogUrl: `${siteUrl}/${locale.value}/questions/${slug}`,
  twitterCard: 'summary',
})

useHead({
  link: [
    { rel: 'canonical', href: `${siteUrl}/${locale.value}/questions/${slug}` },
    { rel: 'alternate', hreflang: 'zh-TW', href: `${siteUrl}/zh/questions/${slug}` },
    { rel: 'alternate', hreflang: 'en-US', href: `${siteUrl}/en/questions/${slug}` },
  ],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      name: question.value?.title,
      inLanguage: locale.value === 'zh' ? 'zh-TW' : 'en-US',
      url: `${siteUrl}/${locale.value}/questions/${slug}`,
    })
  }]
})
</script>

<template>
  <div class="flex">
    <!-- Center: article -->
    <article class="flex-1 min-w-0 px-6 lg:px-10 py-6 max-w-[720px]">

      <!-- Breadcrumb -->
      <nav class="flex items-center gap-1.5 text-xs text-[--color-text-muted] mb-5" aria-label="Breadcrumb">
        <NuxtLink :to="localePath('/')" class="hover:text-[--color-primary]">{{ t('detail.home') }}</NuxtLink>
        <span>›</span>
        <NuxtLink :to="`${localePath('/questions')}?tag=${question!.category}`" class="hover:text-[--color-primary]">
          {{ t(`categories.${question!.category}`) }}
        </NuxtLink>
        <span>›</span>
        <span class="text-[--color-text-secondary] font-medium truncate max-w-[200px]">{{ question!.title }}</span>
      </nav>

      <!-- Question header -->
      <header class="mb-6 pb-6 border-b border-[--color-border]">
        <div class="flex items-center gap-2 mb-3">
          <TagBadge :category="question!.category" />
          <DifficultyBadge :difficulty="question!.difficulty" />
        </div>
        <h1 class="text-[22px] font-bold text-[--color-text-primary] leading-snug mb-4">
          {{ question!.title }}
        </h1>
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Bookmark (placeholder) -->
          <button
            class="flex items-center gap-1.5 text-xs text-[--color-text-secondary] px-3 py-2 border border-[--color-border] rounded-[7px] hover:border-[--color-border-hover] hover:text-[--color-primary] transition-colors min-h-[44px]"
            :aria-label="t('detail.bookmark')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
            {{ t('detail.bookmark') }}
          </button>
          <!-- Share -->
          <button
            class="flex items-center gap-1.5 text-xs text-[--color-text-secondary] px-3 py-2 border border-[--color-border] rounded-[7px] hover:border-[--color-border-hover] transition-colors min-h-[44px]"
            :aria-label="t('detail.share')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            {{ t('detail.share') }}
          </button>
          <!-- AI practice CTA -->
          <a
            href="#ai-practice"
            class="ml-auto flex items-center gap-1.5 text-xs font-semibold text-white bg-[--color-primary] px-4 py-2 rounded-[7px] hover:bg-indigo-600 transition-colors min-h-[44px]"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-300" aria-hidden="true" />
            {{ t('detail.ai_practice') }}
          </a>
        </div>
      </header>

      <!-- Markdown content -->
      <div class="
        prose prose-slate max-w-none
        prose-headings:font-bold prose-headings:text-[--color-text-primary]
        prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-2.5
        prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2
        prose-p:text-base prose-p:text-[--color-text-secondary] prose-p:leading-relaxed
        prose-li:text-base prose-li:text-[--color-text-secondary]
        prose-code:text-[11px] prose-code:font-mono prose-code:bg-slate-100 prose-code:text-indigo-700 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
        prose-pre:bg-slate-50 prose-pre:border prose-pre:border-[--color-border] prose-pre:rounded-lg prose-pre:text-[12px]
        prose-table:text-sm prose-th:text-[--color-text-primary] prose-td:text-[--color-text-secondary]
      ">
        <ContentRenderer
          v-if="question"
          :value="question"
          :components="{ callout: resolveComponent('AppCallout') }"
        />
      </div>

      <!-- AI Practice section -->
      <div id="ai-practice">
        <AiPractice />
      </div>

      <!-- Mobile sticky AI input bar -->
      <div class="lg:hidden fixed bottom-14 inset-x-0 z-20 bg-white border-t border-[--color-border] px-4 py-2.5 flex gap-2">
        <input
          type="text"
          :placeholder="t('detail.ai_placeholder')"
          class="flex-1 text-sm bg-slate-50 border border-[--color-border] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[--color-primary] min-h-[44px]"
        />
        <a
          href="#ai-practice"
          class="w-11 h-11 bg-[--color-primary] rounded-lg flex items-center justify-center text-white shrink-0"
          :aria-label="t('detail.ai_practice')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
          </svg>
        </a>
      </div>

      <!-- Prev/Next -->
      <QuestionNav :prev="prevQuestion" :next="nextQuestion" />
    </article>

    <!-- Right TOC -->
    <QuestionToc :links="tocLinks" />
  </div>
</template>
