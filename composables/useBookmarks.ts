// composables/useBookmarks.ts

export function useBookmarks() {
  const client = useSupabaseClient()
  const user   = useSupabaseUser()

  // useState lets bookmarkedSlugs be shared across all component instances
  const bookmarkedSlugs = useState<Set<string>>('bookmarks:slugs', () => new Set())
  const pending = ref(false)

  async function fetchBookmarks(): Promise<void> {
    if (!user.value) return
    const { data } = await client
      .from('bookmarks')
      .select('question_slug')
    bookmarkedSlugs.value = new Set(
      (data as { question_slug: string }[] | null)?.map(b => b.question_slug) ?? []
    )
  }

  function isBookmarked(slug: string): boolean {
    return bookmarkedSlugs.value.has(slug)
  }

  async function toggleBookmark(slug: string): Promise<void> {
    if (!user.value || pending.value) return
    pending.value = true

    if (isBookmarked(slug)) {
      // Optimistic remove
      bookmarkedSlugs.value = new Set([...bookmarkedSlugs.value].filter(s => s !== slug))
      const { error } = await client.from('bookmarks')
        .delete()
        .eq('user_id', user.value.id)
        .eq('question_slug', slug)
      if (error) {
        // Revert on failure
        bookmarkedSlugs.value = new Set([...bookmarkedSlugs.value, slug])
        console.error('[useBookmarks] delete failed:', error.message)
      }
    } else {
      // Optimistic add
      bookmarkedSlugs.value = new Set([...bookmarkedSlugs.value, slug])
      const { error } = await client.from('bookmarks')
        .insert({ user_id: user.value.id, question_slug: slug })
      if (error) {
        // Revert on failure
        bookmarkedSlugs.value = new Set([...bookmarkedSlugs.value].filter(s => s !== slug))
        console.error('[useBookmarks] insert failed:', error.message)
      }
    }

    pending.value = false
  }

  return { bookmarkedSlugs, pending, fetchBookmarks, toggleBookmark, isBookmarked }
}
