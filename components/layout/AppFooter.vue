<!-- components/layout/AppFooter.vue -->
<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <footer class="border-t border-[--color-border]">
    <div class="max-w-7xl mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
    <p class="text-xs text-[--color-text-muted]">{{ t('footer.copyright') }}</p>
    <div class="flex gap-4">
      <a href="#" class="text-xs text-[--color-text-muted] hover:text-[--color-text-secondary]">{{ t('footer.about') }}</a>
      <a href="https://github.com" target="_blank" rel="noopener" class="text-xs text-[--color-text-muted] hover:text-[--color-text-secondary]">{{ t('footer.github') }}</a>
    </div>
    </div>
  </footer>
</template>
