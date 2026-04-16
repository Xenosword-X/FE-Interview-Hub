<!-- components/layout/AppBottomNav.vue -->
<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const user  = useSupabaseUser()
const client = useSupabaseClient()

// "我的" navigates to /bookmarks (logged in) or triggers login (guest)
async function handleProfile() {
  if (user.value) {
    navigateTo(localePath('/bookmarks'))
  } else {
    await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${localePath('/auth/callback')}` },
    })
  }
}

// Use startsWith so /questions/* stays highlighted on question detail pages
function isActive(path: string) {
  const resolved = localePath(path)
  if (path === '/') return route.path === resolved
  return route.path.startsWith(resolved)
}

const isProfileActive = computed(() =>
  route.path.startsWith(localePath('/bookmarks'))
)
</script>

<template>
  <nav
    class="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[--color-border] flex items-center justify-around h-14"
    :style="{ paddingBottom: 'env(safe-area-inset-bottom)' }"
    aria-label="Bottom navigation"
  >
    <!-- Home -->
    <NuxtLink
      :to="localePath('/')"
      :class="['flex flex-col items-center gap-0.5 py-2 px-4 min-w-11', isActive('/') ? 'text-indigo-500' : 'text-[--color-text-muted]']"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
      <span class="text-[9px] font-medium">{{ t('bottom_nav.home') }}</span>
    </NuxtLink>

    <!-- Questions -->
    <NuxtLink
      :to="localePath('/questions')"
      :class="['flex flex-col items-center gap-0.5 py-2 px-4 min-w-11', isActive('/questions') ? 'text-indigo-500' : 'text-[--color-text-muted]']"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
      <span class="text-[9px] font-medium">{{ t('bottom_nav.questions') }}</span>
    </NuxtLink>

    <!-- AI (placeholder, not implemented yet) -->
    <NuxtLink
      :to="localePath('/')"
      :class="['flex flex-col items-center gap-0.5 py-2 px-4 min-w-11', 'text-[--color-text-muted]']"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
      <span class="text-[9px] font-medium">{{ t('bottom_nav.ai') }}</span>
    </NuxtLink>

    <!-- Profile → /bookmarks (logged in) or login (guest) -->
    <button
      @click="handleProfile"
      :class="['flex flex-col items-center gap-0.5 py-2 px-4 min-w-11', isProfileActive ? 'text-indigo-500' : 'text-[--color-text-muted]']"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
      <span class="text-[9px] font-medium">{{ t('bottom_nav.profile') }}</span>
    </button>
  </nav>
</template>
