// nuxt.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  future: { compatibilityVersion: 4 },

  modules: [
    '@nuxt/content',
    '@nuxtjs/i18n',
    '@nuxtjs/sitemap',
  ],

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
        { property: 'og:image', content: 'https://fe-interview-hub.example.com/og-image.png' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
    },
  },

  site: {
    url: 'https://fe-interview-hub.example.com',
    name: 'FE Interview Hub',
  },

  sitemap: {},
})
