# Foundation Design Spec
**AI-Powered Frontend Interview Hub — Sub-project 1: Foundation**
Date: 2026-04-16
Status: Approved

---

## 1. 範圍與目標

本 spec 涵蓋整個平台的**基礎建設階段**，不包含 Supabase Auth、收藏系統、AI 面試、後台管理（各為獨立子專案）。

**目標：**
- 建立可完全靜態部署（SSG）的前台，包含首頁、題目列表、題目詳情頁
- 支援中英雙語路由（`/zh/`、`/en/`）
- 達成 PRD 的 SEO 與效能指標（LCP < 2.5s、CLS < 0.1）
- 建立 Markdown 題庫內容結構，為後續遷移 Supabase 鋪路

---

## 2. 技術棧

| 層 | 技術 | 說明 |
|---|---|---|
| Framework | Nuxt 4 + Vue 3 + TypeScript | 全端架構，Nitro server |
| 內容管理 | @nuxt/content v3 | Markdown 解析、程式碼高亮、frontmatter |
| i18n | @nuxtjs/i18n（strategy: `prefix`） | 全語系前綴路由 |
| 樣式 | Tailwind CSS v4 + SCSS | Utility-first，8dp spacing rhythm |
| 字體 | Inter（內文）+ JetBrains Mono（程式碼） | Google Fonts，`font-display: swap` |
| 程式碼高亮 | Shiki（Nuxt Content 內建） | `github-light` 主題，支援 VS Code 主題切換 |
| 靜態生成 | `nuxi generate` | 完全 SSG，零 DB 依賴 |
| 圖示 | Heroicons SVG | 統一 stroke-width 1.5，不使用 emoji 作為功能圖示 |

---

## 3. 設計系統（ui-ux-pro-max）

### 3.1 視覺風格
**Clean Minimalism** — 白底、Indigo 主色、Slate 文字，適合長時間閱讀的學習平台。

### 3.2 色彩 Token

| Token | 值 | 用途 |
|---|---|---|
| `--color-primary` | `#6366f1`（Indigo-500） | 主要互動元素、連結、CTA |
| `--color-primary-light` | `#eff6ff` | Tag 背景、Hover 狀態 |
| `--color-primary-border` | `#e0e7ff` | 主色相關邊框 |
| `--color-surface` | `#ffffff` | 卡片、Panel 背景 |
| `--color-bg` | `#fafafa` | 頁面背景、Sidebar |
| `--color-text-primary` | `#0f172a`（Slate-900） | 標題、主要文字 |
| `--color-text-secondary` | `#475569`（Slate-600） | 內文、說明文字 |
| `--color-text-muted` | `#94a3b8`（Slate-400） | 輔助資訊、Placeholder |
| `--color-border` | `#e2e8f0`（Slate-200） | 預設邊框 |
| `--color-border-hover` | `#c7d2fe` | Hover 邊框 |

所有前景/背景組合對比度 ≥ 4.5:1（WCAG AA）。

### 3.3 Typography Scale

| 用途 | 大小 | Weight | Line-height |
|---|---|---|---|
| 頁面主標題（h1） | 32px | 700 | 1.2 |
| 題目標題（h2） | 22px | 700 | 1.3 |
| 區塊標題（h3） | 16px | 700 | 1.4 |
| 小節標題（h4） | 14px | 600 | 1.4 |
| 內文（body） | 14–16px | 400 | 1.75 |
| 輔助文字 | 12px | 400–500 | 1.5 |
| 標籤/Badge | 10–11px | 500–600 | — |
| 程式碼 | 12px | 400 | 1.7（JetBrains Mono） |

手機 body 最小 14px，避免 iOS 自動縮放。

### 3.4 Spacing System
基於 **8dp rhythm**：4 / 8 / 12 / 16 / 24 / 32 / 48px。

### 3.5 元件規範
- **Touch target**：最小 44×44px（符合 Apple HIG / Material Design）
- **Border radius**：卡片 8–10px，按鈕 7px，Badge 4–5px
- **Transition**：150–300ms `ease-out`，`transform` / `opacity` only（不 animate `width`/`height`）
- **Focus ring**：2px `ring-indigo-500`，outline-offset 2px（鍵盤導覽可見）
- **圖示**：Heroicons，stroke-width 1.5，統一尺寸 16px（inline）/ 20px（standalone）

---

## 4. 頁面架構

### 4.1 路由表

| URL | 頁面檔案 | 渲染策略 |
|---|---|---|
| `/zh/` | `pages/[locale]/index.vue` | SSG |
| `/en/` | `pages/[locale]/index.vue` | SSG |
| `/zh/questions` | `pages/[locale]/questions/index.vue` | SSG |
| `/en/questions` | `pages/[locale]/questions/index.vue` | SSG |
| `/zh/questions/[slug]` | `pages/[locale]/questions/[slug].vue` | SSG |
| `/en/questions/[slug]` | `pages/[locale]/questions/[slug].vue` | SSG |

Tag 篩選（`?tag=javascript`）在 SSG 頁面上以**前端 computed filter**實作，不需額外路由。

### 4.2 目錄結構

```
content/
  zh/
    questions/
      javascript/
        event-loop.md
        closure.md
        prototype-chain.md
      vue/
        composition-api.md
      css/
        box-model.md
      typescript/
      web-vitals/
      browser/
      http/
  en/
    questions/
      javascript/
        event-loop.md   ← 相同 slug，對應中文版
      ...

pages/
  [locale]/
    index.vue
    questions/
      index.vue
      [slug].vue

components/
  layout/
    AppNavbar.vue
    AppSidebar.vue
    AppFooter.vue
  question/
    QuestionCard.vue
    QuestionDetail.vue
    CategoryCard.vue
    TagBadge.vue
    DifficultyBadge.vue
  ui/
    AppButton.vue
    AppCodeBlock.vue
    AppCallout.vue

i18n/
  zh.json    ← UI 字串翻譯（非題目內容）
  en.json
```

### 4.3 Markdown Frontmatter 格式

```yaml
---
slug: event-loop
title: 什麼是 Event Loop？請說明 Call Stack 與 Task Queue 的關係
category: javascript
tags: [javascript, async, event-loop]
difficulty: advanced   # basic | intermediate | advanced
---
```

---

## 5. 頁面設計

### 5.1 首頁（Homepage `/zh/`）

**佈局：**
1. **Navbar**：Logo + 題庫/AI面試導覽連結 + 語系切換（`ZH ⇌ EN`）+ 登入按鈕（佔位，Auth 留後續子專案）
2. **Hero**：平台名稱 + 一句話描述 + 統計數字（題目數、分類數、AI 評分標籤）
3. **分類卡片矩陣**：8 個技術領域的卡片，含圖示（Heroicons SVG）+ 題目數量
4. **高頻題目列表**：5 道精選高頻題預覽，帶 Tag + 難度標籤
5. **AI CTA Banner**：Indigo 漸層背景，引導試用 AI 面試功能（連結至詳情頁 AI 區塊）
6. **Footer**：版權 + GitHub 連結

**SEO：**
- `<title>`、`<meta name="description">` 依語系注入
- JSON-LD `WebSite` 結構化資料
- Canonical URL 指向當前語系版本
- `hreflang` 標籤交叉指向另一語系

### 5.2 題目列表頁（`/zh/questions`）

**佈局：**
- 左側欄（220px）：固定分類導覽，含題目數量 badge，點選 active 項目高亮
- 主內容區：搜尋框 + QuestionCard 列表
- QuestionCard：題目標題 + 摘要 + Tag + 難度標籤

**前端 Tag Filter：**
- 使用 `useRoute().query.tag` 讀取 URL query
- Computed property 過濾 `questions` 陣列，無需重新請求

**SEO：**
- 每個分類頁有獨立 title/description
- `<link rel="canonical">` 不含 `?tag=` query（避免重複索引）

### 5.3 題目詳情頁（`/zh/questions/[slug]`）

**佈局（三欄）：**
- 左側欄（220px）：分類導覽（同列表頁，保持視覺一致性）
- 中央內容區（max-width 720px）：
  - Breadcrumb（首頁 › 分類 › 題目）
  - 題目標題 + Tag + 難度標籤
  - 操作列：收藏按鈕（佔位）+ 分享按鈕 + AI 練習 CTA
  - Markdown 渲染內容（含程式碼高亮、Callout 區塊）
  - AI 練習區（詳見下方）
  - 上下題導覽（Prev/Next）
- 右側欄（180px）：TOC（目錄），用 `IntersectionObserver` 同步高亮

**AI 練習區（佔位）：**
- Textarea + 送出按鈕 UI 元件
- Foundation 階段不接 LLM API，點擊後顯示「登入後即可使用」提示
- 實際 AI 串接留給 AI 子專案

**SEO：**
- `<title>` 為題目標題
- `<meta name="description">` 取 Markdown 前 150 字
- JSON-LD `Article` 結構化資料（name、description、inLanguage）
- `hreflang` 指向對應語系版本
- `<link rel="canonical">`

---

## 6. 響應式設計

### 6.1 斷點

| 名稱 | 範圍 | Tailwind prefix |
|---|---|---|
| Mobile | 0–767px | （default） |
| Tablet | 768–1023px | `md:` |
| Desktop | ≥1024px | `lg:` |

### 6.2 各元素響應行為

| 元素 | Mobile | Tablet | Desktop |
|---|---|---|---|
| Navbar | Hamburger + 抽屜選單 | Hamburger + 抽屜選單 | 完整橫向 Navbar |
| Bottom Navigation | 顯示（4 Tab） | 隱藏 | 隱藏 |
| 左側分類欄 | 橫向滑動 Tag Bar | 可折疊側欄 | 固定側欄 220px |
| 分類卡片格柵 | 2 欄 | 3 欄 | 4 欄 |
| 右側 TOC | 隱藏（文章頂部折疊式目錄） | 隱藏 | 固定右側欄 180px |
| AI 輸入框 | Sticky bottom bar | 嵌入文章底部 | 嵌入文章底部 |

### 6.3 Mobile 關鍵規範
- 所有可點擊元素 touch target ≥ 44×44px
- 橫向不出現 scroll bar（`overflow-x: hidden`）
- Bottom Nav 最多 4 個 Tab（符合 ui-ux-pro-max `bottom-nav-limit`）
- Viewport meta：`width=device-width, initial-scale=1`（不禁用縮放）
- Safe area padding：`env(safe-area-inset-bottom)` 處理 iOS Home indicator

---

## 7. SEO 與效能

### 7.1 Core Web Vitals 目標

| 指標 | 目標 | 實作手段 |
|---|---|---|
| LCP | < 2.5s | SSG + CDN，字體 `font-display: swap`，圖片 WebP + `width/height` 屬性 |
| CLS | < 0.1 | 圖片預留尺寸，字體空間預留，無動態插入元素 |
| FID/INP | < 200ms | 無重 JS bundle，lazy-load 非關鍵元件 |

### 7.2 SEO 技術清單
- `nuxt-simple-sitemap`：自動生成中英語系的 sitemap.xml
- JSON-LD：首頁 `WebSite`，題目頁 `Article`
- `<link rel="alternate" hreflang>` 每頁交叉標記
- Open Graph + Twitter Card meta 標籤

---

## 8. 錯誤處理

| 情境 | 處理方式 |
|---|---|
| 不存在的題目 slug | Nuxt `error.vue`，顯示 404 並推薦分類入口 |
| 不存在的語系前綴 | @nuxtjs/i18n 自動 redirect 到預設語系 |
| i18n 缺少翻譯 key | fallback 到 `zh`，console warn |

---

## 9. 未涵蓋範圍（留給後續子專案）

| 功能 | 子專案 |
|---|---|
| Supabase Auth（Google/Email 登入） | Sub-project 2: Auth + Bookmarks |
| 收藏按鈕實際功能 | Sub-project 2: Auth + Bookmarks |
| AI 評分 API 串接 | Sub-project 3: AI Interviewer |
| 後台管理介面 | Sub-project 4: Admin Dashboard |
| 搜尋功能（全文搜尋） | Roadmap |
| 題目留言討論 | Roadmap |

---

## 10. 驗收標準

- [ ] `nuxi generate` 無錯誤，所有頁面靜態輸出
- [ ] Lighthouse SEO score ≥ 90（中英各跑一次）
- [ ] LCP < 2.5s，CLS < 0.1（Lighthouse Desktop + Mobile）
- [ ] 手機（375px）無橫向 scroll，所有 touch target ≥ 44px
- [ ] 語系切換正確（`/zh/` ↔ `/en/`），hreflang 設定正確
- [ ] 程式碼區塊 Shiki 高亮正確渲染
- [ ] Sitemap.xml 包含所有中英題目頁 URL
