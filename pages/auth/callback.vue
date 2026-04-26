<!-- pages/auth/callback.vue -->
<script setup lang="ts">
// @nuxtjs/supabase processes the OAuth code automatically.
// Once the session is established, redirect to home.
const user = useSupabaseUser()
const localePath = useLocalePath()

watchEffect(() => {
  if (user.value) {
    const dest = sessionStorage.getItem('auth_redirect') ?? localePath('/')
    sessionStorage.removeItem('auth_redirect')
    navigateTo(dest)
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="flex flex-col items-center gap-4">
      <svg class="w-8 h-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      <p class="text-sm text-[--color-text-muted]">正在登入...</p>
    </div>
  </div>
</template>
