<!-- components/layout/AppNavbar.vue -->
<script setup lang="ts">
const { locale, locales, setLocale, t } = useI18n()
const localePath = useLocalePath()
const isDrawerOpen = ref(false)
const user = useSupabaseUser()

const otherLocale = computed(() =>
  locales.value.find(l => l.code !== locale.value)
)

function toggleLocale() {
  const next = otherLocale.value?.code
  if (next) setLocale(next as 'zh' | 'en')
}
</script>

<template>
  <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[--color-border] shadow-[0_1px_4px_rgba(0,0,0,0.06)] h-14">
    <div class="max-w-360 mx-auto h-full flex items-center px-4 lg:px-6 gap-3">
    <!-- Logo -->
    <NuxtLink :to="localePath('/')" class="flex items-center gap-2 shrink-0">
      <img src="~/assets/img/LOGO.png" alt="FE Interview Hub" class="h-8 w-auto" />
      <span class="text-sm font-bold text-[--color-text-primary] hidden sm:block">FE Interview Hub</span>
    </NuxtLink>

    <div class="flex-1" />

    <!-- Desktop nav links -->
    <nav class="hidden lg:flex items-center gap-1">
      <NuxtLink
        :to="localePath('/questions')"
        class="text-sm text-[--color-text-secondary] px-3 py-2 rounded-md hover:bg-slate-100 transition-colors"
      >
        {{ t('nav.questions') }}
      </NuxtLink>
      <NuxtLink
        :to="localePath('/interview')"
        class="text-sm text-[--color-text-secondary] px-3 py-2 rounded-md hover:bg-slate-100 transition-colors"
      >
        {{ t('nav.ai_interview') }}
      </NuxtLink>
    </nav>

    <div class="hidden lg:block w-px h-5 bg-[--color-border]" aria-hidden="true" />

    <!-- Language toggle -->
    <button
      @click="toggleLocale"
      class="text-xs font-semibold text-[--color-primary] px-2.5 py-1.5 border border-[--color-primary-border] rounded-md bg-[--color-primary-light] hover:bg-indigo-100 transition-colors min-h-[44px] lg:min-h-[36px]"
      :aria-label="`Switch to ${otherLocale?.name}`"
    >
      {{ t('nav.toggle_lang') }}
    </button>

    <!-- Desktop auth (conditional) -->
    <UserMenu v-if="user" class="hidden lg:flex" />
    <LoginButton v-else class="hidden lg:inline-flex" />

    <!-- Mobile hamburger -->
    <button
      @click="isDrawerOpen = true"
      class="lg:hidden p-2 rounded-md text-[--color-text-secondary] hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
      aria-label="Open menu"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
      </svg>
    </button>
    </div>
  </header>

  <!-- Mobile Drawer -->
  <AppDrawer :open="isDrawerOpen" @close="isDrawerOpen = false" />
</template>
