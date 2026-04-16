# Auth + Bookmarks Design Spec
**AI-Powered Frontend Interview Hub — Sub-project 2: Auth + Bookmarks**
Date: 2026-04-16
Status: Approved

---

## 1. 範圍與目標

本 spec 涵蓋第二階段：**Supabase 帳號系統 + 收藏功能**，不包含 AI 模擬面試 API、後台管理（各為獨立子專案）。

**目標：**
- 讓訪客可透過 Google OAuth 登入成為會員
- 登入後可收藏／取消收藏題目，狀態雲端同步
- 提供「我的收藏」頁面瀏覽個人收藏清單
- 維持原有 SSG 頁面效能，只有 `/bookmarks` 改為 SSR

---

## 2. 技術棧（新增部分）

| 層 | 技術 | 說明 |
|---|---|---|
| Auth & DB | Supabase（PostgreSQL + Auth） | 免費方案，Google OAuth Provider |
| Nuxt 模組 | `@nuxtjs/supabase` | 自動處理 session cookie、middleware、token refresh |
| 渲染 | Nuxt hybrid（SSG + SSR） | 公開頁保持 SSG，`/bookmarks` 改 SSR |

**不安裝 Pinia**：`@nuxtjs/supabase` 提供的 `useSupabaseUser()` composable 已足夠，Pinia 留給後續需要共享複雜狀態的 AI 子專案。

---

## 3. 環境變數

```bash
# .env（不進版本控制）
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJ...（anon key，公開安全）
```

`@nuxtjs/supabase` 自動讀取這兩個變數，無需額外設定。

---

## 4. Supabase 專案初始化（手動操作）

以下步驟在 Supabase Dashboard 操作，**不在程式碼範圍**，但列入實作計劃的 Task 0：

1. 前往 [supabase.com](https://supabase.com) 建立新專案
2. **Authentication → Providers → Google**：填入 Google Cloud Console 的 `Client ID` 和 `Client Secret`
3. **Authentication → URL Configuration**：
   - Redirect URLs 加入 `http://localhost:3000/auth/callback`（開發）
   - 正式部署後再加入正式網域
4. **SQL Editor** 執行 Schema SQL（見第 5 節）
5. 複製 Project URL 和 anon key 填入 `.env`

---

## 5. 資料庫 Schema

只需一張表，問題資料仍在 Markdown 檔案中，不遷移至 Supabase。

```sql
-- 收藏表
create table public.bookmarks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  question_slug text not null,
  created_at    timestamptz default now()
);

-- 同一用戶不能重複收藏同一題
create unique index bookmarks_user_question_idx
  on public.bookmarks (user_id, question_slug);

-- 啟用 RLS
alter table public.bookmarks enable row level security;

-- 使用者只能讀取自己的收藏
create policy "Users can read own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

-- 使用者只能新增自己的收藏
create policy "Users can insert own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

-- 使用者只能刪除自己的收藏
create policy "Users can delete own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);
```

**設計決策：** `question_slug` 用 `text` 而非 FK——問題資料在 Markdown，沒有資料庫 ID，用 slug 直接對應，遷移 Supabase 後只需把 slug 對應到新 ID。

---

## 6. 路由與頁面架構

### 6.1 新增路由

| URL | 頁面檔案 | 渲染策略 | 說明 |
|---|---|---|---|
| `/zh/auth/callback` | `pages/auth/callback.vue` | CSR | Google OAuth redirect 接收頁 |
| `/zh/bookmarks` | `pages/bookmarks/index.vue` | **SSR** | 需驗證 session，Protected |

### 6.2 目錄結構（新增部分）

```
middleware/
  auth.ts                       — 未登入則導向首頁

pages/
  auth/
    callback.vue                — OAuth callback handler
  bookmarks/
    index.vue                   — 我的收藏頁（Protected）

components/
  auth/
    LoginButton.vue             — 替換 Navbar 的登入佔位按鈕
    UserMenu.vue                — 登入後的用戶頭像 + dropdown
  bookmark/
    BookmarkButton.vue          — 詳情頁收藏/取消按鈕
    BookmarkCard.vue            — 收藏頁的題目卡片（含移除）

composables/
  useBookmarks.ts               — 收藏 CRUD + isBookmarked 查詢
```

---

## 7. nuxt.config.ts 變更

```ts
// 新增 @nuxtjs/supabase 模組與設定
modules: [
  '@nuxtjs/supabase',   // 加入此行
  '@nuxt/content',
  '@nuxtjs/i18n',
  '@nuxtjs/sitemap',
],

supabase: {
  redirectOptions: {
    login:    '/auth/callback',
    callback: '/auth/callback',
    exclude:  ['/', '/questions', '/questions/*'],  // 這些頁面不強制登入
  },
},
```

---

## 8. Auth 流程

### 8.1 登入

```
LoginButton 點擊
  → supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: '/auth/callback' })
  → 跳轉 Google 授權頁
  → Google 回傳 code，瀏覽器導向 /auth/callback
  → @nuxtjs/supabase 自動交換 token、寫入 cookie
  → 導向回原頁（或首頁）
```

### 8.2 登出

```
UserMenu「登出」點擊
  → supabase.auth.signOut()
  → session 清除
  → 若當前在 /bookmarks → 導向首頁
  → 否則停在當前頁（guest 狀態）
```

### 8.3 Session 持久性

`@nuxtjs/supabase` 透過 cookie 維持 session，頁面重整後自動恢復登入狀態。`useSupabaseUser()` 返回 reactive ref，全域可用。

---

## 9. 元件設計

### 9.1 `LoginButton.vue`

替換 `AppNavbar.vue` 中的「登入」佔位按鈕。呼叫 Google OAuth，顯示 Google logo + 「使用 Google 登入」文字。

### 9.2 `UserMenu.vue`

只在 `useSupabaseUser()` 有值時顯示，替換 `LoginButton`。

**Dropdown 結構：**
```
[ 用戶頭像（Google 頭像或 email 首字） ]
  ↓ 點擊展開
  ┌─────────────────────────┐
  │  user@gmail.com         │
  │  ─────────────────────  │
  │  📚 我的收藏            │
  │  ─────────────────────  │
  │  登出                   │
  └─────────────────────────┘
```

實作：`v-if="user"` / `v-else` 控制顯示 `UserMenu` 或 `LoginButton`。

### 9.3 `BookmarkButton.vue`

Props: `{ slug: string }`

狀態機：
| 狀態 | 條件 | 外觀 |
|---|---|---|
| `unauthenticated` | `!user` | outline 按鈕，點擊 → toast 提示「登入後才能收藏」 |
| `unbookmarked` | `user && !isBookmarked(slug)` | outline 書籤 icon |
| `bookmarked` | `user && isBookmarked(slug)` | filled 書籤 icon + Indigo 背景 |
| `loading` | 操作進行中 | disabled + spinner |

**注意：** 替換 `pages/questions/[slug].vue` 中現有的「收藏」佔位按鈕。

### 9.4 `BookmarkCard.vue`

類似 `QuestionCard.vue`，多一個右上角 ✕ 移除按鈕（icon only，min 44×44px touch target）。

移除時 **optimistic update**：
1. 立即從 UI 移除（避免等待感）
2. 呼叫 Supabase `delete`
3. 失敗時還原並顯示錯誤 toast

---

## 10. `composables/useBookmarks.ts`

```ts
export function useBookmarks() {
  const client          = useSupabaseClient()
  const user            = useSupabaseUser()
  const bookmarkedSlugs = ref<Set<string>>(new Set())
  const pending         = ref(false)

  async function fetchBookmarks(): Promise<void> {
    if (!user.value) return
    const { data } = await client
      .from('bookmarks')
      .select('question_slug')
    bookmarkedSlugs.value = new Set(data?.map(b => b.question_slug) ?? [])
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
        bookmarkedSlugs.value.delete(slug)
      } else {
        await client.from('bookmarks')
          .insert({ user_id: user.value.id, question_slug: slug })
        bookmarkedSlugs.value.add(slug)
      }
    } finally {
      pending.value = false
    }
  }

  return { bookmarkedSlugs, pending, fetchBookmarks, toggleBookmark, isBookmarked }
}
```

`bookmarkedSlugs` 用 `Set<string>`，`isBookmarked` 是 O(1) 查詢，不會隨題目數量增長而變慢。

---

## 11. `pages/bookmarks/index.vue`

```ts
definePageMeta({ middleware: 'auth' })  // 未登入自動導向首頁

// Server 端先取收藏 slug 清單
const client = useSupabaseClient()
const { data: slugs } = await useAsyncData('my-bookmarks', async () => {
  const { data } = await client.from('bookmarks')
    .select('question_slug')
    .order('created_at', { ascending: false })
  return data?.map(b => b.question_slug) ?? []
})

// 從 Markdown content 撈題目 metadata（複用現有邏輯）
const { data: allQuestions } = await useAsyncData(`questions-${locale.value}`, ...)

const bookmarkedQuestions = computed(() =>
  slugs.value
    ?.map(slug => allQuestions.value?.find(q => q.slug === slug))
    .filter(Boolean) ?? []
)
```

**空狀態：** 若 `bookmarkedQuestions.length === 0`，顯示插圖 + 「還沒有收藏的題目」+ 「瀏覽題庫」按鈕。

---

## 12. 安全性

- **API Key 安全**：`SUPABASE_KEY` 是 anon key，設計上就是公開安全的，RLS 保護資料存取
- **RLS**：`bookmarks` 表強制開啟 RLS，使用者只能存取自己的資料，即使 anon key 外洩也無法跨用戶存取
- **Session**：`@nuxtjs/supabase` 使用 HttpOnly cookie，防止 XSS 竊取 token
- **Redirect URI 驗證**：Supabase Dashboard 只允許設定的 redirect URL，防止 OAuth redirect 攻擊

---

## 13. 錯誤處理

| 情境 | 處理方式 |
|---|---|
| 網路錯誤（收藏 API 失敗）| optimistic update 還原 + toast 錯誤提示 |
| OAuth 取消（用戶在 Google 頁面按取消）| `/auth/callback` 接收到 error param，顯示提示並導回首頁 |
| Session 過期 | `@nuxtjs/supabase` 自動 refresh token；失敗則清除 session，下次操作要求重新登入 |
| 未登入存取 `/bookmarks` | `auth.ts` middleware 導向首頁 |

---

## 14. 未涵蓋範圍（留給後續子專案）

| 功能 | 子專案 |
|---|---|
| Email + Password 登入 | Roadmap（可在 Auth 子專案補）|
| 使用者個人資料頁 | Roadmap |
| AI 評分 API 串接 | Sub-project 3: AI Interviewer |
| 後台管理介面 | Sub-project 4: Admin Dashboard |

---

## 15. 驗收標準

- [ ] Google OAuth 登入成功，session 持久（頁面重整後維持登入狀態）
- [ ] 登出後 session 清除，`/bookmarks` 自動導回首頁
- [ ] 詳情頁收藏按鈕：未登入提示、已收藏 filled、未收藏 outline，狀態即時同步
- [ ] `/bookmarks` 頁面正確顯示當前用戶的收藏清單
- [ ] 移除收藏 optimistic update 正常運作（含失敗還原）
- [ ] RLS 設定正確（Supabase Dashboard 驗證）
- [ ] `.env` 不進 git（`.gitignore` 確認）
