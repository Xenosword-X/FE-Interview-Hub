// vitest.config.ts
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        rootDir: '.',
      },
    },
    env: {
      NUXT_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
      NUXT_PUBLIC_SUPABASE_KEY: 'placeholder-anon-key',
    },
  },
})
