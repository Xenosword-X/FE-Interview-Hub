# Auth + Bookmarks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 整合 Supabase Google OAuth 登入與題目收藏功能，讓會員可以收藏題目並在「我的收藏」頁面查閱。

**Architecture:** `@nuxtjs/supabase` 模組提供 session cookie、`useSupabaseUser()`、`useSupabaseClient()`；公開頁面維持 SSG，`/bookmarks` 改 SSR；`useState` 讓 `bookmarkedSlugs` 跨元件共享同一實例；點擊 BookmarkButton 未登入時直接觸發 Google OAuth。

**Tech Stack:** @nuxtjs/supabase、Supabase PostgreSQL + Auth（Google OAuth）、Nuxt hybrid 渲染、TypeScript

---

## File Map

```
.env                                    — SUPABASE_URL + SUPABASE_KEY（不進版本控制）
nuxt.config.ts                          — 加入 @nuxtjs/supabase 模組與設定（修改）
app.vue                                 — watch user 登入狀態，觸發 fetchBookmarks（修改）

middleware/
  auth.ts                               — 未登入導向首頁（新建）

pages/
  auth/
    callback.vue                        — Google OAuth callback（新建）
  bookmarks/
    index.vue                           — 我的收藏頁，SSR，Protected（新建）

components/
  auth/
    LoginButton.vue                     — Google OAuth 登入按鈕（新建）
    UserMenu.vue                        — 登入後頭像 + dropdown（新建）
  bookmark/
    BookmarkButton.vue                  — 收藏/取消按鈕，含 loading 狀態（新建）
    BookmarkCard.vue                    — 收藏頁卡片，含移除 + optimistic update（新建）

composables/
  useBookmarks.ts                       — 收藏 CRUD，useState 共享狀態（新建）

components/layout/AppNavbar.vue         — 替換登入按鈕為 LoginButton/UserMenu（修改）
pages/questions/[slug].vue              — 替換收藏佔位按鈕為 BookmarkButton（修改）

i18n/zh.json                            — 新增 auth + bookmark 字串（修改）
i18n/en.json                            — 新增 auth + bookmark 字串（修改）
i18n/i18n/zh.json                       — 同步更新（修改）
i18n/i18n/en.json                       — 同步更新（修改）

tests/
  components/BookmarkButton.test.ts     — BookmarkButton 狀態測試（新建）
```

---

## Task 0: Supabase 手動初始化（Dashboard 操作）

這個 Task 是手動操作，不寫程式碼，但必須完成才能繼續後續 Tasks。

- [ ] **Step 1: 建立 Supabase 專案**

前往 https://supabase.com → New project → 填入名稱與密碼 → 等待初始化完成（約 1 分鐘）

- [ ] **Step 2: 取得環境變數**

進入 Project Settings → API：
- 複製 **Project URL**（形如 `https://xxxx.supabase.co`）
- 複製 **anon public key**（`eyJ...` 開頭的長字串）

在專案根目錄建立 `.env`：
```bash
SUPABASE_URL=https://你的project-id.supabase.co
SUPABASE_KEY=eyJ...你的anon-key...
```

確認 `.gitignore` 已有 `.env`（Foundation 階段已加入，確認即可）：
```bash
grep "\.env" .gitignore
# 預期輸出：.env
```

- [ ] **Step 3: 設定 Google OAuth Provider**

1. 前往 [Google Cloud Console](https://console.cloud.google.com) → 建立或選擇專案
2. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
3. Application type: Web application
4. Authorized redirect URIs 加入：`https://你的project-id.supabase.co/auth/v1/callback`
5. 複製 Client ID 和 Client Secret

回到 Supabase Dashboard：
- Authentication → Sign In / Up → Google → 貼上 Client ID 和 Client Secret → Save

- [ ] **Step 4: 設定 Redirect URL**

Supabase Dashboard → Authentication → URL Configuration：
- Site URL: `http://localhost:3000`
- Redirect URLs 加入：`http://localhost:3000/auth/callback`

- [ ] **Step 5: 建立 bookmarks 資料表**

Supabase Dashboard → SQL Editor → New query → 貼入以下 SQL → Run：

```sql
create table public.bookmarks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  question_slug text not null,
  created_at    timestamptz default now()
);

create unique index bookmarks_user_question_idx
  on public.bookmarks (user_id, question_slug);

alter table public.bookmarks enable row level security;

create policy "Users can read own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can insert own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);
```

預期：Table Editor 中出現 `bookmarks` 表，RLS 為 enabled。

---

## Task 1: 安裝 @nuxtjs/supabase + nuxt.config 更新

**Files:**
- Modify: `nuxt.config.ts`

- [ ] **Step 1: 安裝套件**

```bash
npm install @nuxtjs/supabase
```

預期輸出包含：`added @nuxtjs/supabase` 與 `@supabase/supabase-js`

- [ ] **Step 2: 更新 `nuxt.config.ts`**

讀取 `nuxt.config.ts`，在 `modules` 陣列最前面加入 `'@nuxtjs/supabase'`，並在設定最後加入 `supabase` 區塊：

```ts
// nuxt.config.ts
import tailwindcss from '@tailwindcss/vite'

const SITE_URL = process.env.NUXT_PUBLIC_SITE_URL ?? 'https://fe-interview-hub.example.com'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  future: { compatibilityVersion: 4 },

  modules: [
    '@nuxtjs/supabase',   // 新增：必須在其他模組之前
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

  supabase: {
    redirectOptions: {
      login:    '/auth/callback',
      callback: '/auth/callback',
      // 不設定 include/exclude：用自訂 middleware 保護 /bookmarks
      exclude:  ['/*'],   // 預設不強制任何頁面登入
    },
  },

  runtimeConfig: {
    public: {
      siteUrl: SITE_URL,
    },
  },

  app: {
    head: {
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
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
```

- [ ] **Step 3: 確認 nuxt prepare 無錯誤**

```bash
npx nuxt prepare
```

預期：`Types generated in .nuxt` 無錯誤

- [ ] **Step 4: Commit**

```bash
git add nuxt.config.ts package.json package-lock.json
git commit -m "feat: add @nuxtjs/supabase module"
```

---

## Task 2: i18n 字串更新

**Files:**
- Modify: `i18n/zh.json`
- Modify: `i18n/en.json`
- Modify: `i18n/i18n/zh.json`
- Modify: `i18n/i18n/en.json`

- [ ] **Step 1: 在 `i18n/zh.json` 末尾（`}` 前）加入 auth + bookmark 區段**

在 `"bottom_nav"` 區段後、最後的 `}` 前加入：

```json
  ,
  "auth": {
    "sign_in_google": "使用 Google 登入",
    "sign_out": "登出",
    "my_bookmarks": "我的收藏"
  },
  "bookmark": {
    "add": "收藏",
    "added": "已收藏",
    "remove": "移除",
    "login_to_bookmark": "登入後即可收藏題目",
    "page_title": "我的收藏",
    "empty_title": "還沒有收藏的題目",
    "empty_desc": "收藏感興趣的題目，方便之後複習",
    "browse": "瀏覽題庫",
    "remove_failed": "移除收藏失敗，請再試一次"
  }
```

- [ ] **Step 2: 在 `i18n/en.json` 加入對應英文字串**

```json
  ,
  "auth": {
    "sign_in_google": "Sign in with Google",
    "sign_out": "Sign out",
    "my_bookmarks": "My Bookmarks"
  },
  "bookmark": {
    "add": "Bookmark",
    "added": "Bookmarked",
    "remove": "Remove",
    "login_to_bookmark": "Sign in to bookmark questions",
    "page_title": "My Bookmarks",
    "empty_title": "No bookmarks yet",
    "empty_desc": "Bookmark questions you want to revisit later",
    "browse": "Browse Questions",
    "remove_failed": "Failed to remove bookmark, please try again"
  }
```

- [ ] **Step 3: 同步 `i18n/i18n/` 副本**

```bash
cp i18n/zh.json i18n/i18n/zh.json
cp i18n/en.json i18n/i18n/en.json
```

- [ ] **Step 4: Commit**

```bash
git add i18n/
git commit -m "feat: add auth and bookmark i18n strings"
```

---

## Task 3: useBookmarks composable + app.vue 整合

**Files:**
- Create: `composables/useBookmarks.ts`
- Modify: `app.vue`
- Test: `tests/composables/useBookmarks.test.ts`

- [ ] **Step 1: 撰寫 useBookmarks 測試**

```ts
// tests/composables/useBookmarks.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// 模擬 useSupabaseUser 和 useSupabaseClient
vi.mock('#imports', () => ({
  useSupabaseUser: vi.fn(() => ref({ id: 'user-123' })),
  useSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn((cb: any) => Promise.resolve(cb({ data: [], error: null }))),
    })),
  })),
  useState: vi.fn((key: string, init: () => any) => ref(init())),
}))

describe('useBookmarks - isBookmarked', () => {
  it('returns false when slug is not in set', () => {
    const { bookmarkedSlugs, isBookmarked } = useBookmarks()
    bookmarkedSlugs.value = new Set(['closure'])
    expect(isBookmarked('event-loop')).toBe(false)
  })

  it('returns true when slug is in set', () => {
    const { bookmarkedSlugs, isBookmarked } = useBookmarks()
    bookmarkedSlugs.value = new Set(['event-loop'])
    expect(isBookmarked('event-loop')).toBe(true)
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

```bash
npx vitest run tests/composables/useBookmarks.test.ts
```

預期：FAIL（useBookmarks 尚未建立）

- [ ] **Step 3: 建立 `composables/useBookmarks.ts`**

```ts
// composables/useBookmarks.ts

export function useBookmarks() {
  const client = useSupabaseClient()
  const user   = useSupabaseUser()

  // useState 讓 bookmarkedSlugs 跨元件共享同一實例
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
    try {
      if (isBookmarked(slug)) {
        await client.from('bookmarks')
          .delete()
          .eq('user_id', user.value.id)
          .eq('question_slug', slug)
        bookmarkedSlugs.value = new Set(
          [...bookmarkedSlugs.value].filter(s => s !== slug)
        )
      } else {
        await client.from('bookmarks')
          .insert({ user_id: user.value.id, question_slug: slug })
        bookmarkedSlugs.value = new Set([...bookmarkedSlugs.value, slug])
      }
    } finally {
      pending.value = false
    }
  }

  return { bookmarkedSlugs, pending, fetchBookmarks, toggleBookmark, isBookmarked }
}
```

**注意：** `useState` 取代 `ref` 讓收藏狀態全域共享。Set mutation 改為重新建立 Set（保持 Vue 的響應性）。

- [ ] **Step 4: 執行測試確認通過**

```bash
npx vitest run tests/composables/useBookmarks.test.ts
```

預期：PASS

- [ ] **Step 5: 更新 `app.vue`，登入後自動載入收藏**

```vue
<!-- app.vue -->
<script setup lang="ts">
const user    = useSupabaseUser()
const { fetchBookmarks } = useBookmarks()

// 用戶登入後立即載入收藏清單
watch(user, (u) => {
  if (u) fetchBookmarks()
}, { immediate: true })
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

- [ ] **Step 6: Commit**

```bash
git add composables/useBookmarks.ts app.vue tests/composables/useBookmarks.test.ts
git commit -m "feat: add useBookmarks composable with global useState"
```

---

## Task 4: Auth middleware + callback 頁面

**Files:**
- Create: `middleware/auth.ts`
- Create: `pages/auth/callback.vue`

- [ ] **Step 1: 建立 `middleware/auth.ts`**

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo(useLocalePath()('/'))
  }
})
```

- [ ] **Step 2: 建立 `pages/auth/callback.vue`**

`@nuxtjs/supabase` 會自動處理 token 交換，這個頁面只需顯示 loading 狀態。

```vue
<!-- pages/auth/callback.vue -->
<script setup lang="ts">
// @nuxtjs/supabase 的 callback middleware 自動處理 OAuth token 交換
// 無需手動呼叫任何方法，模組會自動完成 session 建立後導向
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
```

- [ ] **Step 3: 確認 `pages/auth/` 路由存在**

```bash
npx nuxt prepare
```

預期：無錯誤，`.nuxt/` 型別包含 `/auth/callback` 路由

- [ ] **Step 4: Commit**

```bash
git add middleware/auth.ts pages/auth/callback.vue
git commit -m "feat: add auth middleware and OAuth callback page"
```

---

## Task 5: LoginButton + UserMenu 元件

**Files:**
- Create: `components/auth/LoginButton.vue`
- Create: `components/auth/UserMenu.vue`
- Modify: `components/layout/AppNavbar.vue`

- [ ] **Step 1: 建立 `components/auth/LoginButton.vue`**

```vue
<!-- components/auth/LoginButton.vue -->
<script setup lang="ts">
const { t } = useI18n()
const client = useSupabaseClient()
const localePath = useLocalePath()

async function signIn() {
  await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}${localePath('/auth/callback')}`,
    },
  })
}
</script>

<template>
  <button
    @click="signIn"
    class="inline-flex items-center gap-2 text-sm font-medium text-[--color-text-primary] px-3 py-2 border border-[--color-border] rounded-[7px] hover:border-[--color-border-hover] hover:bg-slate-50 transition-colors min-h-11 lg:min-h-9 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
  >
    <!-- Google Logo SVG -->
    <svg class="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
    {{ t('auth.sign_in_google') }}
  </button>
</template>
```

- [ ] **Step 2: 建立 `components/auth/UserMenu.vue`**

```vue
<!-- components/auth/UserMenu.vue -->
<script setup lang="ts">
const { t } = useI18n()
const client = useSupabaseClient()
const user   = useSupabaseUser()
const localePath = useLocalePath()
const route  = useRoute()

const isOpen  = ref(false)
const menuRef = ref<HTMLElement | null>(null)

// 頭像首字（email 第一個字大寫）
const initials = computed(() => {
  const email = user.value?.email ?? ''
  return email.charAt(0).toUpperCase()
})

// 點選外部關閉 dropdown
function onClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}
onMounted(()  => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

async function signOut() {
  await client.auth.signOut()
  isOpen.value = false
  // 若在 bookmarks 頁則導回首頁
  if (route.path.includes('/bookmarks')) {
    navigateTo(localePath('/'))
  }
}
</script>

<template>
  <div ref="menuRef" class="relative">
    <!-- 頭像按鈕 -->
    <button
      @click="isOpen = !isOpen"
      class="w-8 h-8 rounded-full bg-indigo-500 text-white text-sm font-semibold flex items-center justify-center hover:bg-indigo-600 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
      :aria-label="user?.email ?? 'User menu'"
    >
      {{ initials }}
    </button>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 top-10 w-52 bg-white border border-[--color-border] rounded-xl shadow-lg shadow-slate-200/60 py-1 z-50"
      >
        <!-- Email -->
        <div class="px-4 py-2.5 border-b border-[--color-border]">
          <p class="text-xs text-[--color-text-muted] truncate">{{ user?.email }}</p>
        </div>

        <!-- My Bookmarks -->
        <NuxtLink
          :to="localePath('/bookmarks')"
          @click="isOpen = false"
          class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[--color-text-secondary] hover:bg-slate-50 hover:text-[--color-text-primary] transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
          {{ t('auth.my_bookmarks') }}
        </NuxtLink>

        <div class="border-t border-[--color-border] my-1" />

        <!-- Sign out -->
        <button
          @click="signOut"
          class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[--color-text-secondary] hover:bg-slate-50 hover:text-red-600 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          {{ t('auth.sign_out') }}
        </button>
      </div>
    </Transition>
  </div>
</template>
```

- [ ] **Step 3: 更新 `components/layout/AppNavbar.vue`**

將原本的靜態「登入」按鈕替換為條件渲染：

找到這一段：
```vue
    <!-- Desktop login -->
    <AppButton variant="primary" size="sm" class="hidden lg:inline-flex">
      {{ t('nav.login') }}
    </AppButton>
```

替換為：
```vue
    <!-- Desktop auth (conditional) -->
    <UserMenu v-if="user" class="hidden lg:flex" />
    <LoginButton v-else class="hidden lg:inline-flex" />
```

並在 `<script setup>` 中加入：
```ts
const user = useSupabaseUser()
```

- [ ] **Step 4: 確認開發伺服器無錯誤**

```bash
npm run dev
```

訪問 `http://localhost:3000/zh/`，確認 Navbar 右側顯示「使用 Google 登入」按鈕（未登入狀態）。

- [ ] **Step 5: Commit**

```bash
git add components/auth/ components/layout/AppNavbar.vue
git commit -m "feat: add LoginButton, UserMenu, update Navbar for auth state"
```

---

## Task 6: BookmarkButton + 詳情頁整合

**Files:**
- Create: `components/bookmark/BookmarkButton.vue`
- Modify: `pages/questions/[slug].vue`
- Test: `tests/components/BookmarkButton.test.ts`

- [ ] **Step 1: 撰寫 BookmarkButton 測試**

```ts
// tests/components/BookmarkButton.test.ts
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect, vi } from 'vitest'
import BookmarkButton from '~/components/bookmark/BookmarkButton.vue'

// 模擬 useBookmarks
vi.mock('~/composables/useBookmarks', () => ({
  useBookmarks: () => ({
    isBookmarked: (slug: string) => slug === 'event-loop',
    toggleBookmark: vi.fn(),
    pending: { value: false },
  }),
}))

describe('BookmarkButton', () => {
  it('shows bookmarked state when slug is bookmarked', async () => {
    const wrapper = await mountSuspended(BookmarkButton, {
      props: { slug: 'event-loop' },
      global: { mocks: { $t: (k: string) => k, useSupabaseUser: () => ({ value: { id: '1' } }) } }
    })
    expect(wrapper.classes().join(' ')).toMatch(/indigo|bookmarked/)
  })

  it('shows unbookmarked state when slug is not bookmarked', async () => {
    const wrapper = await mountSuspended(BookmarkButton, {
      props: { slug: 'closure' },
      global: { mocks: { $t: (k: string) => k, useSupabaseUser: () => ({ value: { id: '1' } }) } }
    })
    expect(wrapper.text()).toContain('bookmark.add')
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

```bash
npx vitest run tests/components/BookmarkButton.test.ts
```

預期：FAIL

- [ ] **Step 3: 建立 `components/bookmark/BookmarkButton.vue`**

```vue
<!-- components/bookmark/BookmarkButton.vue -->
<script setup lang="ts">
const props = defineProps<{ slug: string }>()
const { t } = useI18n()
const client = useSupabaseClient()
const user   = useSupabaseUser()
const { isBookmarked, toggleBookmark, pending } = useBookmarks()

const bookmarked = computed(() => user.value && isBookmarked(props.slug))

async function handleClick() {
  if (!user.value) {
    // 未登入 → 觸發 Google OAuth
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
      pending ? 'opacity-60 cursor-not-allowed' : ''
    ]"
    :aria-label="bookmarked ? t('bookmark.added') : t('bookmark.add')"
    :aria-pressed="!!bookmarked"
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
```

- [ ] **Step 4: 執行測試確認通過**

```bash
npx vitest run tests/components/BookmarkButton.test.ts
```

預期：PASS

- [ ] **Step 5: 更新 `pages/questions/[slug].vue` — 替換收藏佔位按鈕**

找到：
```vue
          <!-- Bookmark (placeholder) -->
          <button
            class="flex items-center gap-1.5 text-xs text-[--color-text-secondary] px-3 py-2 border border-[--color-border] rounded-[7px] hover:border-[--color-border-hover] hover:text-[--color-primary] transition-colors min-h-[44px]"
            :aria-label="t('detail.bookmark')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
            {{ t('detail.bookmark') }}
          </button>
```

替換為：
```vue
          <!-- Bookmark (functional) -->
          <BookmarkButton :slug="slug" />
```

- [ ] **Step 6: Commit**

```bash
git add components/bookmark/BookmarkButton.vue pages/questions/[slug].vue tests/components/BookmarkButton.test.ts
git commit -m "feat: add BookmarkButton, wire into question detail page"
```

---

## Task 7: BookmarkCard 元件

**Files:**
- Create: `components/bookmark/BookmarkCard.vue`

- [ ] **Step 1: 建立 `components/bookmark/BookmarkCard.vue`**

```vue
<!-- components/bookmark/BookmarkCard.vue -->
<script setup lang="ts">
import type { QuestionMeta } from '~/composables/useQuestions'

const props = defineProps<{
  question: QuestionMeta
}>()
const emit = defineEmits<{ remove: [slug: string] }>()

const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <div class="relative group border border-[--color-border] rounded-xl p-4 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:border-[--color-border-hover] hover:shadow-[0_4px_14px_rgba(99,102,241,0.10)] transition-all duration-200">
    <!-- Remove button (top-right) -->
    <button
      @click="emit('remove', question.slug)"
      class="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-md text-[--color-text-muted] hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
      :aria-label="t('bookmark.remove')"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- Card content (clickable link) -->
    <NuxtLink :to="localePath(`/questions/${question.slug}`)">
      <h3 class="text-base font-semibold text-[--color-text-primary] leading-snug mb-2 pr-8 hover:text-[--color-primary] transition-colors">
        {{ question.title }}
      </h3>
      <div class="flex items-center gap-1.5 flex-wrap">
        <TagBadge :category="question.category" />
        <DifficultyBadge :difficulty="question.difficulty" />
      </div>
    </NuxtLink>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add components/bookmark/BookmarkCard.vue
git commit -m "feat: add BookmarkCard component"
```

---

## Task 8: 我的收藏頁面

**Files:**
- Create: `pages/bookmarks/index.vue`

- [ ] **Step 1: 建立 `pages/bookmarks/index.vue`**

```vue
<!-- pages/bookmarks/index.vue -->
<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { t, locale } = useI18n()
const localePath = useLocalePath()
const client = useSupabaseClient()
const user   = useSupabaseUser()
const siteUrl = useSiteUrl()
const { toggleBookmark } = useBookmarks()

// Server 端取收藏 slug 清單（按新增時間倒序）
const { data: bookmarkSlugs, refresh } = await useAsyncData(
  'my-bookmarks',
  async () => {
    const { data } = await client
      .from('bookmarks')
      .select('question_slug')
      .order('created_at', { ascending: false })
    return (data as { question_slug: string }[] | null)?.map(b => b.question_slug) ?? []
  }
)

// 從 Markdown content 取題目 metadata
const { data: allQuestions } = await useAsyncData(
  `questions-${locale.value}`,
  async () => {
    const all = await queryCollection('questions').all()
    return all.filter(q => q.path?.includes(`/${locale.value}/`))
  }
)

// 依照收藏順序排列題目
const bookmarkedQuestions = computed(() =>
  (bookmarkSlugs.value ?? [])
    .map(slug => allQuestions.value?.find(q => q.slug === slug))
    .filter((q): q is NonNullable<typeof q> => q != null)
)

// Optimistic remove
async function handleRemove(slug: string) {
  // 先從本地清單移除
  bookmarkSlugs.value = bookmarkSlugs.value?.filter(s => s !== slug) ?? []
  try {
    await toggleBookmark(slug)  // 呼叫 Supabase delete
  } catch {
    // 失敗時還原（重新 fetch）
    await refresh()
    alert(t('bookmark.remove_failed'))
  }
}

// SEO
useSeoMeta({
  title: `${t('bookmark.page_title')} | FE Interview Hub`,
  ogUrl: `${siteUrl}/${locale.value}/bookmarks`,
})
useHead({
  link: [{ rel: 'canonical', href: `${siteUrl}/${locale.value}/bookmarks` }],
})
</script>

<template>
  <div class="px-6 lg:px-10 py-8 max-w-2xl">
    <!-- Header -->
    <h1 class="text-2xl font-bold text-[--color-text-primary] mb-6">
      {{ t('bookmark.page_title') }}
      <span class="text-base font-normal text-[--color-text-muted] ml-2">
        {{ bookmarkedQuestions.length }}
      </span>
    </h1>

    <!-- Empty state -->
    <div
      v-if="bookmarkedQuestions.length === 0"
      class="flex flex-col items-center py-16 text-center"
    >
      <svg class="w-16 h-16 text-slate-200 mb-4" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
      </svg>
      <p class="text-lg font-semibold text-[--color-text-primary] mb-2">{{ t('bookmark.empty_title') }}</p>
      <p class="text-sm text-[--color-text-muted] mb-6">{{ t('bookmark.empty_desc') }}</p>
      <AppButton :href="localePath('/questions')" variant="secondary">
        {{ t('bookmark.browse') }}
      </AppButton>
    </div>

    <!-- Bookmark list -->
    <div v-else class="grid gap-3">
      <BookmarkCard
        v-for="q in bookmarkedQuestions"
        :key="q.slug"
        :question="q"
        @remove="handleRemove"
      />
    </div>
  </div>
</template>
```

- [ ] **Step 2: 確認頁面在 dev 中可訪問**

```bash
npm run dev
```

已登入狀態下訪問 `http://localhost:3000/zh/bookmarks`，確認：
- 已登入 → 顯示頁面（空狀態或收藏清單）
- 未登入 → 自動導向首頁（middleware 運作正常）

- [ ] **Step 3: Commit**

```bash
git add pages/bookmarks/index.vue
git commit -m "feat: add bookmarks page with optimistic remove"
```

---

## Task 9: 整合驗收 + 最終 Build

- [ ] **Step 1: 執行所有測試**

```bash
npx vitest run
```

預期：所有測試 PASS（TagBadge × 2、useBookmarks × 2、BookmarkButton × 2）

- [ ] **Step 2: 驗收清單手動確認**

在 `npm run dev` 下逐項確認：

```
[ ] 點「使用 Google 登入」→ 跳轉 Google 授權頁 → 登入後回到原頁
[ ] 登入後 Navbar 顯示用戶頭像 + dropdown
[ ] dropdown 中「我的收藏」→ 導向 /zh/bookmarks
[ ] 訪問詳情頁，收藏按鈕顯示 outline（未收藏）
[ ] 點收藏 → 按鈕變 filled indigo（已收藏），無需重整
[ ] 再點一次 → 取消收藏，按鈕回 outline
[ ] 訪問 /zh/bookmarks → 顯示剛才收藏的題目
[ ] 點 ✕ 移除 → 題目立即從清單消失（optimistic）
[ ] 登出 → 頭像消失，顯示「使用 Google 登入」
[ ] 登出後訪問 /zh/bookmarks → 自動導向首頁
[ ] 頁面重整後登入狀態維持
```

- [ ] **Step 3: 確認 .env 不進版本控制**

```bash
git status --short | grep ".env"
# 預期輸出：空（.env 已在 .gitignore 中）
```

- [ ] **Step 4: 最終 commit**

```bash
git add .
git commit -m "feat: auth + bookmarks complete — Google OAuth, bookmark CRUD, My Bookmarks page"
```

---

## Self-Review

**Spec coverage check:**

| Spec 需求 | 對應 Task |
|---|---|
| Supabase 專案初始化（手動）| Task 0 |
| `@nuxtjs/supabase` 安裝 + nuxt.config | Task 1 |
| `bookmarks` 資料表 + RLS | Task 0 Step 5 |
| `SUPABASE_URL` + `SUPABASE_KEY` 環境變數 | Task 0 Step 2 |
| i18n auth + bookmark 字串 | Task 2 |
| `useBookmarks` composable（useState 共享）| Task 3 |
| `app.vue` watch user + fetchBookmarks | Task 3 Step 5 |
| `middleware/auth.ts` | Task 4 |
| `pages/auth/callback.vue` | Task 4 |
| `LoginButton.vue` | Task 5 |
| `UserMenu.vue` + dropdown | Task 5 |
| `AppNavbar.vue` 條件渲染 | Task 5 |
| `BookmarkButton.vue`（4 狀態）| Task 6 |
| `[slug].vue` 替換佔位按鈕 | Task 6 Step 5 |
| `BookmarkCard.vue` + optimistic remove | Task 7 |
| `pages/bookmarks/index.vue` SSR + Protected | Task 8 |
| 驗收標準 | Task 9 |

**無未涵蓋需求。**
