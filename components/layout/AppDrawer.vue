<!-- components/layout/AppDrawer.vue -->
<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <Teleport to="body">
    <!-- Overlay -->
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-black/40 lg:hidden"
        @click="emit('close')"
        aria-hidden="true"
      />
    </Transition>

    <!-- Drawer panel -->
    <Transition name="slide-right">
      <div
        v-if="open"
        class="fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-xl lg:hidden flex flex-col"
        role="dialog"
        aria-label="Navigation menu"
      >
        <div class="flex items-center justify-between px-5 h-14 border-b border-[--color-border]">
          <span class="font-bold text-sm text-[--color-text-primary]">FE Interview Hub</span>
          <button
            @click="emit('close')"
            class="p-2 rounded-md text-[--color-text-secondary] hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav class="flex-1 px-4 py-6 flex flex-col gap-1">
          <NuxtLink
            :to="localePath('/questions')"
            @click="emit('close')"
            class="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-[--color-text-secondary] hover:bg-slate-100 hover:text-[--color-text-primary]"
          >
            {{ t('nav.questions') }}
          </NuxtLink>
          <NuxtLink
            :to="localePath('/')"
            @click="emit('close')"
            class="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-[--color-text-secondary] hover:bg-slate-100 hover:text-[--color-text-primary]"
          >
            {{ t('nav.ai_interview') }}
          </NuxtLink>
        </nav>
        <div class="px-4 pb-8" style="padding-bottom: calc(2rem + env(safe-area-inset-bottom))">
          <AppButton variant="primary" class="w-full justify-center">
            {{ t('nav.login') }}
          </AppButton>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.25s ease-out; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
</style>
