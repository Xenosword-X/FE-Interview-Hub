<!-- components/bookmark/BookmarkButton.vue -->
<script setup lang="ts">
const props = defineProps<{ slug: string }>()
const { t } = useI18n()
const client = useSupabaseClient()
const user   = useSupabaseUser()
const { isBookmarked, toggleBookmark, pending } = useBookmarks()

const bookmarked = computed(() => !!user.value && isBookmarked(props.slug))

async function handleClick() {
  if (!user.value) {
    // Not logged in — trigger Google OAuth directly
    await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return
  }
  await toggleBookmark(props.slug)
}
</script>

<template>
  <button
    @click="handleClick"
    :disabled="pending"
    :class="[
      'flex items-center gap-1.5 text-xs px-3 py-2 border rounded-[7px] transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none',
      bookmarked
        ? 'bg-indigo-500 text-white border-indigo-500 hover:bg-indigo-600'
        : 'text-[--color-text-secondary] border-[--color-border] hover:border-[--color-border-hover] hover:text-[--color-primary]',
      pending ? 'opacity-60 cursor-not-allowed' : '',
    ]"
    :aria-label="bookmarked ? t('bookmark.added') : t('bookmark.add')"
    :aria-pressed="bookmarked"
  >
    <!-- Loading spinner -->
    <svg v-if="pending" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
    <!-- Bookmark icon: filled if bookmarked, outline if not -->
    <svg v-else class="w-4 h-4" :fill="bookmarked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
    {{ bookmarked ? t('bookmark.added') : t('bookmark.add') }}
  </button>
</template>
