# PRD: AI-Powered Frontend Interview Hub (v1.0)

## 1. 專案簡介
這是一個專為前端工程師設計的面試複習平台，結合 **Nuxt 4** 的全端架構與 **AI 模擬面試** 功能。目標是提供一個具備高性能 SEO、中英語言支援，且能透過 AI 給予答題回饋的互動式學習環境。
參考站: https://www.explainthis.io/zh-hant/swe-questions/frontend

---

## 2. 核心目標
- **技術展示**：展現 Nuxt 4, Supabase, i18n 與 AI 整合的實戰能力。
- **SEO 最佳化**：利用 SSG/SSR 混合渲染，確保面試題目能被搜尋引擎高效索引。
- **AI 賦能**：不只是看答案，還能透過 AI 診斷使用者的答題品質。

---

## 3. 使用者故事 (User Stories)

| 角色 | 需求描述 (I want to...) | 目的 (So that...) |
| :--- | :--- | :--- |
| **訪客** | 瀏覽按分類排列的前端面試題 | 針對特定技術領域進行複習 |
| **訪客** | 在中英文語系間切換 | 學習專業術語的正確英文表達方式 |
| **會員** | 收藏特定的題目 | 建立個人化的弱點複習清單 |
| **會員** | 輸入答案並獲得 AI 回饋 | 了解自己回答的完整度與改進空間 |
| **管理員**| 透過後台管理題目與翻譯 | 維持題庫內容的品質與即時性 |

---

## 4. 功能需求 (Functional Requirements)

### 4.1 前台展示 (Frontend)
- **多語系路由**：支援 `/zh/` 與 `/en/` 自動轉向與路由管理。
- **題目詳情**：支援 Markdown 渲染與程式碼高亮 (Syntax Highlighting)。
- **響應式 UI**：完美適配 Mobile 與 Desktop 端的閱讀體驗。

### 4.2 收藏系統 (Bookmark System)
- **身份驗證**：整合 Supabase Auth (Google/Email)。
- **同步機制**：使用者收藏狀態需與雲端資料庫即時同步。

### 4.3 AI 模擬面試 (AI Interviewer)
- **答題分析**：串接 LLM API (如 GPT-4o-mini)，針對使用者輸入提供評分。
- **建議生成**：AI 需給出：精準度、缺點補強、優化後建議範例。

### 4.4 管理後台 (Admin Dashboard)
- **題目編輯**：支援 Markdown 編輯器，可同時儲存中英文欄位。
- **分類管理**：定義 Tags (Vue, JS, CSS, Web Vitals 等)。

---

## 5. 技術規格 (Technical Specifications)

### 5.1 技術棧
- **Framework**: Nuxt 4 (Vue 3, Nitro)
- **Language**: TypeScript
- **Database/Auth**: Supabase (PostgreSQL)
- **i18n**: @nuxtjs/i18n
- **State**: Pinia
- **Styling**: Tailwind CSS + SCSS
- **AI Integration**: OpenAI / Claude API via Nitro Server Routes

### 5.2 資料庫 Schema 概覽 (Supabase)
- `questions`: 儲存題目主體與分類。
- `translations`: 儲存 `question_id` 對應的 `locale`, `title`, `content`。
- `bookmarks`: 儲存 `user_id` 與 `question_id` 的關聯。
- `practice_logs`: 紀錄 AI 評分歷史。

---

## 6. 非功能需求 (Non-functional Requirements)

- **SEO & 效能**：
  - LCP < 2.5s, CLS < 0.1。
  - 針對各語系題目頁面自動生成 JSON-LD 結構化資料。
  - 自動化 Sitemap 生成。
- **安全性**：
  - 使用 Supabase RLS (Row Level Security) 確保使用者只能存取自己的收藏數據。
  - AI API Key 必須嚴格保存在 Server-side (.env)，不可暴露於前端。
- **成本控制**：
  - 實施請求頻率限制 (Rate Limiting)，防止 AI API 被惡意刷取導致高額帳單。

---

## 7. 未來擴展 (Roadmap)
- [ ] 加入「社群討論區」，讓使用者針對題目留言交流。
- [ ] 加入「挑戰模式」，限時完成隨機抽取的面試題。
- [ ] 整合 PDF 導出功能，將收藏題目匯出成複習小抄。