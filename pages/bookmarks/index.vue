<!-- pages/bookmarks/index.vue -->
<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { t, locale } = useI18n()
const localePath = useLocalePath()
const client = useSupabaseClient()
const { toggleBookmark } = useBookmarks()
const siteUrl = useSiteUrl()

// Server-side: fetch ordered bookmark slugs
const { data: bookmarkSlugs, refresh } = await useAsyncData(
  'my-bookmarks',
  async () => {
    const { data } = await client
      .from('bookmarks')
      .select('question_slug')
      .order('created_at', { ascending: false })
    return (data as { question_slug: string }[] | null)?.map(b => b.question_slug) ?? []
  }
)

// Fetch question metadata from Markdown content
const { data: allQuestions } = await useAsyncData(
  `questions-${locale.value}`,
  async () => {
    const all = await queryCollection('questions').all()
    return all.filter(q => q.path?.includes(`/${locale.value}/`))
  }
)

// Ordered list of bookmarked questions
const bookmarkedQuestions = computed(() =>
  (bookmarkSlugs.value ?? [])
    .map(slug => allQuestions.value?.find(q => q.slug === slug))
    .filter((q): q is NonNullable<typeof q> => q != null)
)

// Optimistic remove
async function handleRemove(slug: string) {
  // Remove from local list immediately (optimistic)
  bookmarkSlugs.value = bookmarkSlugs.value?.filter(s => s !== slug) ?? []
  try {
    await toggleBookmark(slug)
  } catch {
    // Restore list on failure
    await refresh()
    alert(t('bookmark.remove_failed'))
  }
}

// SEO
useSeoMeta({
  title: `${t('bookmark.page_title')} | FE Interview Hub`,
  ogUrl: `${siteUrl}/${locale.value}/bookmarks`,
})
useHead({
  link: [{ rel: 'canonical', href: `${siteUrl}/${locale.value}/bookmarks` }],
})
</script>

<template>
  <div class="px-6 lg:px-10 py-8 max-w-2xl">
    <!-- Page header -->
    <h1 class="text-2xl font-bold text-[--color-text-primary] mb-6">
      {{ t('bookmark.page_title') }}
      <span class="text-base font-normal text-[--color-text-muted] ml-2">
        {{ bookmarkedQuestions.length }}
      </span>
    </h1>

    <!-- Empty state -->
    <div
      v-if="bookmarkedQuestions.length === 0"
      class="flex flex-col items-center py-16 text-center"
    >
      <svg class="w-16 h-16 text-slate-200 mb-4" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
      </svg>
      <p class="text-lg font-semibold text-[--color-text-primary] mb-2">{{ t('bookmark.empty_title') }}</p>
      <p class="text-sm text-[--color-text-muted] mb-6">{{ t('bookmark.empty_desc') }}</p>
      <AppButton :href="localePath('/questions')" variant="secondary">
        {{ t('bookmark.browse') }}
      </AppButton>
    </div>

    <!-- Bookmark list -->
    <div v-else class="grid gap-3">
      <BookmarkCard
        v-for="q in bookmarkedQuestions"
        :key="q.slug"
        :question="q"
        @remove="handleRemove"
      />
    </div>
  </div>
</template>
