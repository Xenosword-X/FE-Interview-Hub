# AI Interviewer Design Spec
**AI-Powered Frontend Interview Hub — Sub-project 3: AI Interviewer**
Date: 2026-04-16
Status: Approved

---

## 1. 範圍與目標

本 spec 涵蓋 AI 模擬面試功能，讓已登入的使用者可以輸入（或語音）答案，獲得結構化 AI 評分回饋，並保存練習歷史。

**目標：**
- 使用者可文字輸入或語音輸入答案
- GPT-4o-mini 分析答案，給出精準度分數、缺漏要點、優化範例
- Rate limiting：每用戶每日 10 次，開發者帳號豁免
- 練習歷史存入 Supabase `practice_logs`
- 語音輸入依當前語系（`zh-TW` / `en-US`）自動切換

---

## 2. 技術棧（新增部分）

| 層 | 技術 | 說明 |
|---|---|---|
| LLM API | OpenAI GPT-4o-mini | `response_format: { type: 'json_object' }` 強制 JSON 輸出 |
| 語音輸入 | Web Speech API | 瀏覽器原生，零成本 |
| Server Route | Nitro（`server/api/ai/evaluate.post.ts`）| 與 Sub-project 2 bookmarks 相同模式 |
| DB | Supabase `practice_logs`（jsonb 儲存評分）| 手動 SQL 建立 |

---

## 3. 環境變數

```bash
# .env 新增
OPENAI_API_KEY=sk-...
DAILY_AI_LIMIT=10                              # 每用戶每日限制（可調整）
BYPASS_EMAILS=swordsgod790626@gmail.com        # 豁免 rate limit 的開發者帳號，逗號分隔
```

---

## 4. 資料庫 Schema

### `practice_logs` 資料表

```sql
create table public.practice_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  question_slug text not null,
  question_text text not null,      -- 題目原文快照（避免 Markdown 修改影響歷史）
  user_answer   text not null,
  ai_feedback   jsonb not null,     -- 結構化評分 JSON
  locale        text not null,      -- 'zh' | 'en'
  created_at    timestamptz default now()
);

create index practice_logs_user_date_idx
  on public.practice_logs (user_id, created_at);

alter table public.practice_logs enable row level security;

create policy "Users can read own practice logs"
  on public.practice_logs for select
  using (auth.uid() = user_id);
-- Server route 用 service role 寫入，不需要 INSERT policy
```

### `ai_feedback` JSON 結構（TypeScript 型別）

```ts
interface AiFeedback {
  accuracy: {
    score: number       // 0–100
    summary: string     // 一句話評語，30字以內
  }
  gaps: string[]        // 缺漏要點，2–4 項
  example: string       // 優化後完整建議答案
}
```

---

## 5. Server Route：`server/api/ai/evaluate.post.ts`

### 流程

```
POST /api/ai/evaluate
  body: { slug: string, questionText: string, answer: string }

1. serverSupabaseUser(event) → 未登入 → 401
2. 查詢今日 practice_logs 次數
   - 超過 DAILY_AI_LIMIT → 429 Too Many Requests
   - user.email 在 BYPASS_EMAILS 名單 → 跳過限制
3. OpenAI chat.completions.create（見第 6 節）
4. 解析 JSON 回應 → AiFeedback
5. INSERT practice_logs（service role）
6. 返回 { feedback: AiFeedback, remainingToday: number }
```

### Rate Limit 查詢

```ts
const today = new Date()
today.setHours(0, 0, 0, 0)

const { count } = await client
  .from('practice_logs')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId)
  .gte('created_at', today.toISOString())
```

### 錯誤處理

| 情境 | HTTP 狀態 | 前端處理 |
|---|---|---|
| 未登入 | 401 | 顯示「請登入後使用」 |
| 超過每日限制 | 429 | 顯示「今日次數已用完（10/10）」 |
| OpenAI 超時 | 504 | 顯示「評分服務暫時無法使用，請稍後再試」 |
| JSON 解析失敗 | 500 | 重試一次，失敗再顯示錯誤 |

---

## 6. Prompt 設計

### System Prompt

```
你是一位資深前端工程師面試官。
請針對以下前端面試題，評估應試者的回答品質。

請以 JSON 格式回應，格式如下：
{
  "accuracy": {
    "score": <0-100 整數>,
    "summary": "<一句話評語，30字以內>"
  },
  "gaps": ["<缺漏要點1>", "<缺漏要點2>"],
  "example": "<優化後的完整建議答案>"
}

評分標準：
- 80-100：核心概念正確，有具體細節
- 60-79：基本正確但缺乏深度
- 40-59：部分正確，有明顯錯誤
- 0-39：回答方向有誤或過於簡略

語言：回答語言與題目語言相同（繁體中文或英文）。
只回傳 JSON，不要有任何額外說明文字。
```

### User Prompt

```
面試題目：{questionText}

應試者回答：{answer}
```

### OpenAI 呼叫設定

```ts
{
  model: 'gpt-4o-mini',
  temperature: 0.3,
  max_tokens: 800,
  response_format: { type: 'json_object' },
}
```

---

## 7. 新增 Composable：`composables/useVoiceInput.ts`

### 功能

- Web Speech API 封裝，client-side only（SSR 安全）
- `locale` 決定辨識語言：`zh-TW` / `en-US`
- 返回 `{ isRecording, transcript, start, stop, isSupported }`
- Firefox 不支援 → `isSupported = false` → 隱藏語音按鈕

### 介面

```ts
export function useVoiceInput(onResult: (text: string) => void) {
  const isRecording  = ref(false)
  const isSupported  = ref(false)
  const { locale }   = useI18n()

  // 只在 client 端初始化
  onMounted(() => {
    isSupported.value = 'SpeechRecognition' in window
      || 'webkitSpeechRecognition' in window
  })

  function start() { /* 啟動辨識，lang = locale === 'zh' ? 'zh-TW' : 'en-US' */ }
  function stop()  { /* 停止辨識 */ }

  return { isRecording, isSupported, start, stop }
}
```

---

## 8. AiPractice.vue 重寫

### Props

```ts
defineProps<{
  slug: string
  questionText: string
}>()
```

### 三個顯示狀態

| 狀態 | 觸發條件 | 顯示內容 |
|---|---|---|
| `idle` | 初始 / 重新作答 | Textarea + 語音按鈕 + 送出 |
| `loading` | 送出後等待 API | Spinner + 「AI 正在分析…」 |
| `result` | API 返回成功 | 評分卡（分數 + 缺漏 + 範例）|

### 評分卡分數 badge 顏色邏輯

```ts
const scoreColor = computed(() => {
  if (feedback.accuracy.score >= 80) return 'high'  // 綠色
  if (feedback.accuracy.score >= 60) return 'mid'   // 黃色
  return 'low'                                       // 紅色
})
```

### 語音輸入整合

- `isSupported = false`（Firefox）→ 隱藏麥克風按鈕，不影響文字輸入
- 錄音中 → 送出按鈕 disabled
- 語音結果 → 覆蓋 textarea 現有內容（或 append，使用者可自行編輯）

### 未登入狀態

- 未登入 → 顯示「登入後即可使用 AI 評分」+ LoginButton（與 BookmarkButton 相同模式）

---

## 9. i18n 新增字串

### zh.json

```json
"ai_evaluate": {
  "title": "AI 模擬面試",
  "subtitle": "輸入你的答案，AI 即時分析精準度與改進空間",
  "placeholder": "請用自己的話作答...",
  "submit": "送出評分",
  "voice_start": "語音輸入",
  "voice_recording": "錄音中… 點擊停止",
  "voice_processing": "辨識中…",
  "loading": "AI 正在分析你的答案…",
  "result_title": "AI 評分結果",
  "score_label": "精準度",
  "gaps_title": "缺漏要點",
  "example_title": "優化後範例答案",
  "retry": "重新作答",
  "remaining": "今日第 {used} / {total} 次",
  "limit_reached": "今日次數已用完（{total} / {total}），明天再來！",
  "login_prompt": "登入後即可使用 AI 評分",
  "error_timeout": "評分服務暫時無法使用，請稍後再試",
  "error_generic": "評分失敗，請重試"
}
```

---

## 10. nuxt.config.ts 變更

```ts
runtimeConfig: {
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  dailyAiLimit: parseInt(process.env.DAILY_AI_LIMIT ?? '10'),
  bypassEmails: process.env.BYPASS_EMAILS ?? '',
  public: {
    siteUrl: SITE_URL,
  },
},
```

注意：`openaiApiKey`、`dailyAiLimit`、`bypassEmails` 放在 `runtimeConfig`（非 `public`），只在 server 端可存取，不暴露給 client。

---

## 11. 頁面整合

`pages/questions/[slug].vue` 的 `<AiPractice>` 元件從無 props 改為：

```vue
<AiPractice :slug="slug" :question-text="question.title" />
```

---

## 12. 驗收標準

- [ ] 已登入使用者可輸入答案並獲得 AI 評分（3 個欄位都顯示）
- [ ] 語音輸入可辨識中文和英文（依語系切換）
- [ ] Firefox 不顯示語音按鈕，文字輸入正常
- [ ] 每日超過 10 次顯示限制提示
- [ ] BYPASS_EMAILS 帳號不受限制
- [ ] practice_logs 有正確儲存評分歷史
- [ ] 未登入顯示「登入後才能使用」
- [ ] OpenAI API key 不暴露在 client 端（DevTools Network 檢查）
