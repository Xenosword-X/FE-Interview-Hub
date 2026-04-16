// nuxt.config.ts
import tailwindcss from '@tailwindcss/vite'

const SITE_URL = process.env.NUXT_PUBLIC_SITE_URL ?? 'https://fe-interview-hub.example.com'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  future: { compatibilityVersion: 4 },

  runtimeConfig: {
    public: {
      siteUrl: SITE_URL,
    },
  },

  modules: [
    '@nuxt/content',
    '@nuxtjs/i18n',
    '@nuxtjs/sitemap',
  ],

  components: {
    dirs: [{ path: '~/components', pathPrefix: false }],
  },

  vite: {
    plugins: [tailwindcss()],
  },

  css: ['~/assets/css/main.css'],

  i18n: {
    strategy: 'prefix',
    defaultLocale: 'zh',
    locales: [
      { code: 'zh', language: 'zh-TW', name: '繁體中文', file: 'zh.json' },
      { code: 'en', language: 'en-US', name: 'English',   file: 'en.json' },
    ],
    langDir: 'i18n/',
    detectBrowserLanguage: false,
  },

  content: {
    build: {
      markdown: {
        highlight: {
          theme: 'github-light',
          langs: ['javascript', 'typescript', 'vue', 'css', 'html', 'bash', 'json'],
        },
      },
    },
  },

  app: {
    head: {
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        // og:image: set per-page via useSeoMeta when a real image is available
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
    },
  },

  site: {
    url: SITE_URL,
    name: 'FE Interview Hub',
  },

  sitemap: {},
})
