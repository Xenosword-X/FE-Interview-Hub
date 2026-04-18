# 部署計畫 — Cloudflare Pages

> 目標：把 FE Interview Hub 上到 Cloudflare Pages，使用 `*.pages.dev` 暫時域名，未來再掛自訂域名。
>
> 估計時間：**首次部署約 60-90 分鐘**（含所有外部服務設定），之後 push to main 自動部署。

---

## Phase 0｜Pre-flight — 部署前安全檢查（約 15 分鐘）

> ⚠️ 這個 phase 的任一項沒過，**都不要部署**。部署前多花 15 分鐘比事後救火容易太多。

### ✅ 0.1 確認 .gitignore 無漏網之魚
（已確認 `.env`、`client_secret_*.json`、`.superpowers/` 都已排除，git 目前沒有追蹤任何密鑰）

```bash
git ls-files | grep -iE "\.env$|client_secret|credentials"
# 預期輸出：空
```

### ✅ 0.2 強化後台密碼（重要）

現在的 `BACKEND_PASSWORD` 是 `word+數字` 模式，部署前**必須**換成 20+ 字元亂數：

```bash
# 產生新密碼（macOS / Linux / Git Bash）
openssl rand -base64 24
```

**產生的新密碼要記下來，稍後要填到 Cloudflare 環境變數。**

### ✅ 0.3 確認 SESSION_SECRET 夠長
至少 32 bytes。如果現在的不夠，重新產生：

```bash
openssl rand -hex 32
```

### ✅ 0.4 git status 清乾淨

```bash
git status          # 應該 clean
git log --oneline -5  # 確認最新 commit
```

若有未提交的變更，先 commit。

---

## Phase 1｜新增 Nitro preset（約 5 分鐘，必要程式碼變更）

Nuxt 預設輸出到 `.output/`，但 Cloudflare Pages 需要 `cloudflare-pages` preset，輸出到 `dist/` 並產生 `_worker.js`。

### 1.1 修改 `nuxt.config.ts`

在 `export default defineNuxtConfig({ ... })` 中加入：

```ts
  nitro: {
    preset: 'cloudflare-pages',
  },
```

位置建議：放在 `modules` 後、`components` 前，保持設定分組有邏輯。

### 1.2 本機 build 驗證

```bash
npm run build
```

**預期輸出**：
- `dist/` 目錄產生
- `dist/_worker.js/` 存在
- `dist/_routes.json` 存在
- 無 error（warning 可以接受）

若失敗：檢查錯誤訊息，通常是依賴版本問題。

### 1.3 commit 並 push

```bash
git add nuxt.config.ts
git commit -m "feat(deploy): add cloudflare-pages nitro preset"
git push origin master
```

---

## Phase 2｜Cloudflare Pages 專案建立（約 10 分鐘）

### 2.1 建立 Pages 專案

1. 登入 https://dash.cloudflare.com
2. 左側選單 **Workers & Pages** → **Create application** → **Pages** tab → **Connect to Git**
3. 授權 GitHub，選擇 `AI-Powered Frontend Interview` 這個 repo
4. Production branch：`master`（或 `main`，看你習慣）

### 2.2 Build settings

| 欄位 | 值 |
|------|-----|
| Framework preset | **Nuxt.js**（或 None，下方手動填） |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/`（預設） |

### 2.3 Environment variables（Production 環境）

在 **Settings** → **Environment variables** → **Production** 新增下列（一個一個貼，**不要分享螢幕**）：

| Key | Value 來源 |
|-----|-----------|
| `NUXT_PUBLIC_SUPABASE_URL` | 從本機 `.env` 複製 |
| `NUXT_PUBLIC_SUPABASE_KEY` | 從本機 `.env` 複製（anon key） |
| `SUPABASE_SERVICE_KEY` | 從本機 `.env` 複製（service role，**標記為 encrypted**） |
| `OPENAI_API_KEY` | 從本機 `.env` 複製（標記為 encrypted） |
| `DAILY_AI_LIMIT` | `10` |
| `BYPASS_EMAILS` | 你的 email |
| `BACKEND_ACCOUNT` | 你的後台帳號（可沿用本機） |
| `BACKEND_PASSWORD` | **Phase 0.2 產生的新密碼**（標記為 encrypted） |
| `SESSION_SECRET` | 從本機 `.env` 複製或 Phase 0.3 新產生（標記為 encrypted） |
| `NUXT_PUBLIC_SITE_URL` | 先填 `https://<你猜的專案名>.pages.dev`，部署後確認實際 URL 再修正 |
| `NODE_VERSION` | `20` |

**重要**：所有標記為 encrypted 的變數，存檔後就看不到原值了，要自己在別的地方留副本。

### 2.4 Compatibility flags

**Settings** → **Functions** → **Compatibility flags**：

- Production：`nodejs_compat`
- Preview：`nodejs_compat`

（OpenAI SDK、Supabase SDK 都會用到 `node:async_hooks` 等 Node 內建模組，必要。）

---

## Phase 3｜外部服務 URL 更新（約 15 分鐘）

### 3.1 先做一次首發部署取得實際 URL

回到 CF Pages 專案首頁 → **Deployments** → 等第一次自動部署完成（或手動 trigger）。

**⚠️ 此次部署預期會失敗或部分功能壞掉**，因為 Supabase OAuth 還沒加入新 URL。這是正常的，繼續往下做。

部署完成後，記下實際的 URL（例如 `https://fe-interview-hub.pages.dev`）。

### 3.2 回 Cloudflare 環境變數修正 `NUXT_PUBLIC_SITE_URL`

把 Phase 2.3 先填的假 URL 改成實際的 `*.pages.dev`，**觸發一次 redeploy**。

### 3.3 更新 Supabase Auth 允許的 redirect URL

1. Supabase Dashboard → 你的專案 → **Authentication** → **URL Configuration**
2. **Site URL** 改為 `https://<project>.pages.dev`
3. **Redirect URLs** 新增以下兩個（若未存在）：
   - `https://<project>.pages.dev/auth/callback`
   - `https://<project>.pages.dev/**`（Supabase 建議 wildcard）
4. 儲存

### 3.4 更新 Google Cloud Console OAuth 憑證

1. https://console.cloud.google.com → **APIs & Services** → **Credentials**
2. 找到原本在用的 OAuth 2.0 Client ID（名稱可能是 `fe-interview-hub-oauth` 之類）
3. 在 **Authorized redirect URIs** 新增：
   - `https://<your-supabase-project>.supabase.co/auth/v1/callback`
     （這個其實初次設定 Supabase Google Auth 時已加過，**不要刪**）
4. **Authorized JavaScript origins** 新增：
   - `https://<project>.pages.dev`
5. 儲存（Google 改動通常幾秒內生效）

---

## Phase 4｜首次完整驗收 Smoke Test（約 15 分鐘）

依序測試下列流程，每項打勾才算通過：

### 4.1 公開頁面
- [ ] 首頁 `https://<project>.pages.dev` 能載入，中文正確顯示
- [ ] 切換語系：點右上「EN」切換到 `/en/`
- [ ] 題目列表 `/zh/questions` 顯示 8+ 題
- [ ] 點任一題進入詳解頁，Markdown、TOC、麵包屑、上下題按鈕都正常
- [ ] 查看網頁原始碼，確認 `<meta description>` 有題目摘要（不是單純的 title）
- [ ] 查看原始碼搜尋 `"@type":"QAPage"` 有出現

### 4.2 使用者登入 + 收藏
- [ ] `/zh/questions/event-loop`（任一題）右上的 Google 登入按鈕能開啟 OAuth 視窗
- [ ] 登入成功回到原題目頁，header 顯示 email
- [ ] 點「收藏」按鈕，狀態切換成已收藏
- [ ] 前往 `/zh/bookmarks`，剛收藏的題目有出現
- [ ] 重新整理 `/zh/bookmarks`，資料不消失

### 4.3 AI 評分 + 語音
- [ ] 題目詳解頁下方，輸入測試答案 → 按「送出給 AI 評分」
- [ ] 約 5-15 秒後顯示分數、缺漏要點、優化答案
- [ ] 再送一次，確認「今日 X / 10」計數有遞增
- [ ] 點「語音輸入」→ 錄音 → 停止 → 文字應出現在答題框（此步需麥克風權限）

### 4.4 後台
- [ ] `/admin` 被 302 redirect 到 `/admin/login`
- [ ] 用 Phase 0.2 的新密碼登入
- [ ] 成功進入 `/admin/questions`，列表顯示所有題目
- [ ] 點「新增題目」可填表並儲存
- [ ] 編輯剛新增的題目 → 修改 → 存檔 → 回列表看到改動
- [ ] 刪除剛新增的題目（按兩次「刪除」→「確定」）
- [ ] 登出 → 再次訪問 `/admin` → 被導回登入頁

### 4.5 SEO 檔案
- [ ] 直接訪問 `https://<project>.pages.dev/robots.txt`，看到 Disallow: /admin 等規則
- [ ] 直接訪問 `https://<project>.pages.dev/sitemap.xml`，看到所有題目 URL
- [ ] `https://<project>.pages.dev/og-image.png` 能正常顯示

### 🚨 常見問題排查

| 症狀 | 原因 | 解法 |
|------|------|------|
| 500 Error on /api/ai/evaluate | CF Compatibility flag 漏掉 | Phase 2.4 的 `nodejs_compat` 要開 |
| Google OAuth 失敗「redirect_uri_mismatch」 | Google 憑證未加新網域 | Phase 3.4 |
| Google OAuth 後回到 localhost | Supabase Site URL 未改 | Phase 3.3 |
| 後台登入 401 但帳密都對 | SESSION_SECRET 沒設，或 cookie secure flag 在非 https 阻擋 | 確認 env var 與 `NUXT_PUBLIC_SITE_URL` 是 https |
| 題目頁 404 | Supabase questions 表是空的 | 本機跑 `npx tsx scripts/migrate-questions.ts` 或直接在 Supabase UI 新增 |

---

## Phase 5｜SEO 正式收錄（約 10 分鐘 + 持續觀察）

### 5.1 Google Search Console

1. https://search.google.com/search-console → **新增資源** → **網址前置** → 貼 `https://<project>.pages.dev/`
2. 驗證方式選 **HTML 標記**，複製那行 `<meta name="google-site-verification" ...>`
3. 在 `nuxt.config.ts` 的 `app.head.meta` 陣列加上：
   ```ts
   { name: 'google-site-verification', content: '<那一長串>' }
   ```
4. commit → push → 等 CF 自動部署完成
5. 回 Search Console 按「驗證」
6. 驗證通過後，左側 **Sitemaps** → 貼 `sitemap.xml` → 提交

### 5.2 驗證結構化資料

- [Rich Results Test](https://search.google.com/test/rich-results)：貼任一題目頁 URL，應該偵測到 `QAPage`
- [Schema Markup Validator](https://validator.schema.org/)：另一個交叉驗證工具

若有 error，通常是 JSON-LD 欄位型別錯。

### 5.3 社群預覽驗證

- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)：貼首頁 + 任一題目頁，確認 OG 圖片正確
- [X Card Validator](https://cards-dev.twitter.com/validator)：同上
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)：同上

### 5.4 （選配）Bing Webmaster Tools

https://www.bing.com/webmasters — 同樣流程，提交 sitemap。Bing 雖然市佔低，但是 ChatGPT / Duck Duck Go 會用 Bing 結果，值得花 5 分鐘。

---

## Phase 6｜部署後監控（持續）

### 6.1 立刻要看的

- **Cloudflare Pages** → **Deployments**：每次 push 後確認 build 綠燈
- **Cloudflare Pages** → **Analytics**：流量、錯誤率
- **Supabase Dashboard** → **Logs**：看有沒有非預期的 query error
- **OpenAI Usage Dashboard**：https://platform.openai.com/usage — 確認花費在預期內

### 6.2 一週後要看的

- **Search Console → 涵蓋範圍**：題目頁都被索引了嗎？
- **Search Console → 體驗 → Core Web Vitals**：有綠燈嗎？
- **Search Console → 查詢**：哪些關鍵字帶流量進來？（早期可能完全沒有，正常）

### 6.3 預警線

設定心裡的 red line，超過就停用：

| 指標 | 紅線 | 動作 |
|------|------|------|
| OpenAI 每月花費 | > $10 USD | 降低 `DAILY_AI_LIMIT` 或暫停服務 |
| Supabase DB 大小 | > 400MB（免費層 500MB） | 清理 `practice_logs` 舊資料 |
| CF Pages requests/day | > 10 萬 | 確認不是被爬蟲打 |

---

## Phase 7｜（未來）換自訂域名時

> 等你買域名後再做。暫時保留 `*.pages.dev`。

### 7.1 域名採購建議

- **.com / .io / .dev**：信用度高
- **.tw**：若目標讀者主要在台灣，有在地感
- 推薦：**Cloudflare Registrar**（無附加費用，已有 CF 帳號省事）

### 7.2 切換步驟

1. CF Pages 專案 → **Custom domains** → **Set up a custom domain**
2. 輸入域名，CF 自動處理 DNS（若是 CF Registrar 買的）
3. **更新 `NUXT_PUBLIC_SITE_URL` 環境變數**為新域名
4. **Supabase Auth URL Configuration** 同步更新 Site URL / Redirect URLs
5. **Google Cloud OAuth** 同步新增授權網域
6. **Google Search Console** 重新新增新域名的資源、提交新 sitemap
7. 在舊 `*.pages.dev` 保留 301 redirect 到新域名（CF Pages 後台可設定 redirect rule）

---

## 🎯 部署完成的定義

✅ Phase 0-4 全部打勾
✅ Google Search Console 已提交 sitemap
✅ OG 圖在 FB Debugger 上正常顯示
✅ 能在搜尋引擎用 `site:<project>.pages.dev` 查到自己的頁面（這步需等 1-7 天 Google 索引）

---

## 📎 附錄：Rollback 計畫

若部署後發現嚴重 bug：

1. **立即 rollback**：CF Pages → **Deployments** → 找上一個綠燈 deployment → **Rollback to this deployment**（一鍵完成）
2. **重現 bug**：本機切到同 commit，`npm run dev` 復現
3. **修完再 push**，CF 自動部署新版

若是資料問題（誤刪題目等）：
- Supabase Pro 版有 PITR，免費層沒有 point-in-time recovery
- 建議每週手動備份：`Supabase Dashboard → Database → Backups`（或用 `pg_dump`）
