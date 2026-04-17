# AI Interviewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 實作 AI 模擬面試功能：已登入會員可輸入（或語音）答案，GPT-4o-mini 返回結構化評分卡（精準度 + 缺漏 + 範例），並存入 practice_logs，每日限 10 次（開發者帳號豁免）。

**Architecture:** Nitro server route（`/api/ai/evaluate`）負責驗證、rate limit、OpenAI 呼叫與 DB 寫入；前端 `AiPractice.vue` 管理三個 UI 狀態（idle / loading / result）；`useVoiceInput` composable 封裝 Web Speech API。

**Tech Stack:** OpenAI SDK（`openai` npm）、Web Speech API（瀏覽器原生）、Supabase service role（與 bookmarks 相同模式）、Nuxt runtimeConfig（server-only secrets）

---

## File Map

```
.env                                          — 新增 OPENAI_API_KEY, DAILY_AI_LIMIT, BYPASS_EMAILS（手動）
nuxt.config.ts                               — 新增 openaiApiKey, dailyAiLimit, bypassEmails runtimeConfig（修改）
i18n/zh.json                                 — 新增 ai_evaluate 區段（修改）
i18n/en.json                                 — 新增 ai_evaluate 區段（修改）
i18n/i18n/zh.json                            — 同步（修改）
i18n/i18n/en.json                            — 同步（修改）

server/api/ai/
  evaluate.post.ts                           — 主 API：auth + rate limit + GPT + save logs（新建）

composables/
  useVoiceInput.ts                           — Web Speech API 封裝，locale 自動切換，SSR 安全（新建）

components/question/
  AiPractice.vue                             — 完整重寫：3 狀態 + 語音按鈕 + 評分卡（修改）

pages/questions/
  [slug].vue                                 — <AiPractice> 加上 slug + questionText props（修改）

tests/
  server/evaluate.test.ts                    — rate limit + bypass logic unit tests（新建）
  composables/useVoiceInput.test.ts          — isSupported + state tests（新建）
```

---

## Task 0: 手動設定（Dashboard + .env）

**不寫程式碼，但必須在 Task 1 之前完成。**

- [ ] **Step 1: Supabase SQL Editor — 建立 practice_logs 資料表**

```sql
create table public.practice_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  question_slug text not null,
  question_text text not null,
  user_answer   text not null,
  ai_feedback   jsonb not null,
  locale        text not null,
  created_at    timestamptz default now()
);

create index practice_logs_user_date_idx
  on public.practice_logs (user_id, created_at);

alter table public.practice_logs enable row level security;

create policy "Users can read own practice logs"
  on public.practice_logs for select
  using (auth.uid() = user_id);
```

預期：Table Editor 出現 `practice_logs` 表，RLS 為 enabled。

- [ ] **Step 2: 在 `.env` 加入三個變數**

```bash
# 在現有 .env 末尾加入
OPENAI_API_KEY=sk-proj-...你的key...
DAILY_AI_LIMIT=10
BYPASS_EMAILS=swordsgod790626@gmail.com
```

OpenAI API key 取得：https://platform.openai.com/api-keys → Create new secret key

---

## Task 1: 安裝 openai + nuxt.config + i18n 字串

**Files:**
- Modify: `nuxt.config.ts`
- Modify: `i18n/zh.json`
- Modify: `i18n/en.json`
- Modify: `i18n/i18n/zh.json`
- Modify: `i18n/i18n/en.json`

- [ ] **Step 1: 安裝 openai npm 套件**

```bash
npm install openai
```

預期輸出：`added openai` 及相關依賴

- [ ] **Step 2: 更新 `nuxt.config.ts` — 加入 runtimeConfig server secrets**

讀取 `nuxt.config.ts`，在 `runtimeConfig` 區塊中的 `public` 之前加入 server-only 欄位：

```ts
runtimeConfig: {
  openaiApiKey:  process.env.OPENAI_API_KEY  ?? '',
  dailyAiLimit:  process.env.DAILY_AI_LIMIT  ?? '10',
  bypassEmails:  process.env.BYPASS_EMAILS   ?? '',
  public: {
    siteUrl: SITE_URL,
  },
},
```

- [ ] **Step 3: 在 `i18n/zh.json` 末尾（`}` 前）加入 ai_evaluate 區段**

在最後一個 `}` 前加入：

```json
  ,
  "ai_evaluate": {
    "title": "AI 模擬面試",
    "subtitle": "輸入你的答案，AI 即時分析精準度與改進空間",
    "placeholder": "請用自己的話作答...",
    "submit": "送出評分",
    "voice_start": "語音輸入",
    "voice_recording": "錄音中… 點擊停止",
    "loading": "AI 正在分析你的答案…",
    "result_title": "AI 評分結果",
    "score_label": "精準度",
    "gaps_title": "缺漏要點",
    "example_title": "優化後範例答案",
    "retry": "重新作答",
    "remaining": "今日第 {used} / {total} 次",
    "remaining_unlimited": "開發者模式（無限次）",
    "limit_reached": "今日次數已用完，明天再來！",
    "login_prompt": "登入後即可使用 AI 評分",
    "error_timeout": "評分服務暫時無法使用，請稍後再試",
    "error_generic": "評分失敗，請重試"
  }
```

- [ ] **Step 4: 在 `i18n/en.json` 末尾加入對應英文字串**

```json
  ,
  "ai_evaluate": {
    "title": "AI Mock Interview",
    "subtitle": "Type your answer and get instant AI feedback",
    "placeholder": "Answer in your own words...",
    "submit": "Submit for Scoring",
    "voice_start": "Voice Input",
    "voice_recording": "Recording… Click to stop",
    "loading": "AI is analysing your answer…",
    "result_title": "AI Feedback",
    "score_label": "Accuracy",
    "gaps_title": "Missing Points",
    "example_title": "Improved Example Answer",
    "retry": "Try Again",
    "remaining": "Today: {used} / {total}",
    "remaining_unlimited": "Dev mode (unlimited)",
    "limit_reached": "Daily limit reached. Come back tomorrow!",
    "login_prompt": "Sign in to use AI scoring",
    "error_timeout": "Scoring service unavailable. Please try again later.",
    "error_generic": "Scoring failed. Please retry."
  }
```

- [ ] **Step 5: 同步 i18n/i18n/ 副本**

```bash
cp i18n/zh.json i18n/i18n/zh.json
cp i18n/en.json i18n/i18n/en.json
```

- [ ] **Step 6: 驗證 JSON 語法正確**

```bash
node -e "JSON.parse(require('fs').readFileSync('i18n/zh.json','utf8')); console.log('zh: valid')"
node -e "JSON.parse(require('fs').readFileSync('i18n/en.json','utf8')); console.log('en: valid')"
```

預期：`zh: valid` 和 `en: valid`

- [ ] **Step 7: Commit**

```bash
git add nuxt.config.ts package.json package-lock.json i18n/
git commit -m "feat: add openai sdk, runtimeConfig secrets, ai_evaluate i18n strings"
```

---

## Task 2: useVoiceInput composable

**Files:**
- Create: `composables/useVoiceInput.ts`
- Create: `tests/composables/useVoiceInput.test.ts`

- [ ] **Step 1: 撰寫失敗測試**

建立 `tests/composables/useVoiceInput.test.ts`：

```ts
// tests/composables/useVoiceInput.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// Mock Nuxt/Vue auto-imports for server environment
vi.mock('#imports', () => ({
  ref: vi.fn((v: any) => ({ value: v })),
  onMounted: vi.fn(),
  onUnmounted: vi.fn(),
  useI18n: vi.fn(() => ({ locale: { value: 'zh' } })),
}))

describe('useVoiceInput', () => {
  it('returns isSupported = false in non-browser environment', () => {
    const onResult = vi.fn()
    const { isSupported } = useVoiceInput(onResult)
    // In test (Node) environment, SpeechRecognition is not available
    expect(isSupported.value).toBe(false)
  })

  it('starts not recording', () => {
    const onResult = vi.fn()
    const { isRecording } = useVoiceInput(onResult)
    expect(isRecording.value).toBe(false)
  })
})
```

- [ ] **Step 2: 執行測試確認失敗**

```bash
npx vitest run tests/composables/useVoiceInput.test.ts
```

預期：FAIL（useVoiceInput not found）

- [ ] **Step 3: 建立 `composables/useVoiceInput.ts`**

```ts
// composables/useVoiceInput.ts
// Web Speech API composable — SSR safe (initialised only in onMounted)

export function useVoiceInput(onResult: (text: string) => void) {
  const isRecording = ref(false)
  const isSupported = ref(false)
  const { locale } = useI18n()

  let recognition: any = null

  onMounted(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    isSupported.value = !!SpeechRecognition
    if (!SpeechRecognition) return

    recognition = new SpeechRecognition()
    recognition.continuous    = false
    recognition.interimResults = false

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      onResult(transcript)
    }

    recognition.onend = () => {
      isRecording.value = false
    }

    recognition.onerror = () => {
      isRecording.value = false
    }
  })

  onUnmounted(() => {
    if (recognition && isRecording.value) recognition.abort()
  })

  function start() {
    if (!recognition || isRecording.value) return
    recognition.lang = locale.value === 'zh' ? 'zh-TW' : 'en-US'
    recognition.start()
    isRecording.value = true
  }

  function stop() {
    if (!recognition || !isRecording.value) return
    recognition.stop()
  }

  return { isRecording, isSupported, start, stop }
}
```

- [ ] **Step 4: 執行測試確認通過**

```bash
npx vitest run tests/composables/useVoiceInput.test.ts
```

預期：PASS（2 tests）

- [ ] **Step 5: Commit**

```bash
git add composables/useVoiceInput.ts tests/composables/useVoiceInput.test.ts
git commit -m "feat: add useVoiceInput composable with Web Speech API"
```

---

## Task 3: server/api/ai/evaluate.post.ts

**Files:**
- Create: `server/api/ai/evaluate.post.ts`
- Create: `tests/server/evaluate.test.ts`

- [ ] **Step 1: 撰寫 rate limit + bypass 邏輯測試**

建立 `tests/server/evaluate.test.ts`：

```ts
// tests/server/evaluate.test.ts
import { describe, it, expect } from 'vitest'

// Helper extracted from server route — bypass check logic
function isBypassEmail(email: string, bypassList: string): boolean {
  return bypassList
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase())
}

function isRateLimited(usedToday: number, limit: number, bypass: boolean): boolean {
  if (bypass) return false
  return usedToday >= limit
}

describe('isBypassEmail', () => {
  it('returns true when email is in bypass list', () => {
    expect(isBypassEmail('dev@example.com', 'dev@example.com,other@example.com')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isBypassEmail('DEV@EXAMPLE.COM', 'dev@example.com')).toBe(true)
  })

  it('returns false when email is not in list', () => {
    expect(isBypassEmail('other@example.com', 'dev@example.com')).toBe(false)
  })
})

describe('isRateLimited', () => {
  it('returns true when usedToday >= limit', () => {
    expect(isRateLimited(10, 10, false)).toBe(true)
    expect(isRateLimited(11, 10, false)).toBe(true)
  })

  it('returns false when under limit', () => {
    expect(isRateLimited(9, 10, false)).toBe(false)
  })

  it('always returns false for bypass emails', () => {
    expect(isRateLimited(100, 10, true)).toBe(false)
  })
})
```

- [ ] **Step 2: 執行測試確認通過（純函式邏輯，不依賴 Nuxt）**

```bash
npx vitest run tests/server/evaluate.test.ts
```

預期：PASS（5 tests）

- [ ] **Step 3: 建立 `server/api/ai/evaluate.post.ts`**

```ts
// server/api/ai/evaluate.post.ts
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import OpenAI from 'openai'

interface AiFeedback {
  accuracy: { score: number; summary: string }
  gaps: string[]
  example: string
}

const SYSTEM_PROMPT = `你是一位資深前端工程師面試官。
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
只回傳 JSON，不要有任何額外說明文字。`

export default defineEventHandler(async (event) => {
  // 1. Auth — extract user ID from JWT (sub or id)
  const user = await serverSupabaseUser(event)
  const userId: string | undefined = (user as any)?.id ?? (user as any)?.sub
  if (!userId) throw createError({ statusCode: 401, message: 'Unauthorized' })

  // 2. Parse body
  const { slug, questionText, answer } = await readBody<{
    slug: string
    questionText: string
    answer: string
  }>(event)

  if (!slug || !questionText || !answer?.trim()) {
    throw createError({ statusCode: 400, message: 'slug, questionText and answer are required' })
  }

  // 3. Rate limit check
  const config = useRuntimeConfig()
  const userEmail: string = (user as any)?.email ?? ''
  const bypassEmails = (config.bypassEmails as string)
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
  const isDevBypass = bypassEmails.includes(userEmail.toLowerCase())

  const dailyLimit = parseInt(config.dailyAiLimit as string) || 10
  let usedToday = 0

  if (!isDevBypass) {
    const dbClient = serverSupabaseServiceRole(event)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count } = await dbClient
      .from('practice_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today.toISOString())

    usedToday = count ?? 0
    if (usedToday >= dailyLimit) {
      throw createError({ statusCode: 429, message: `Daily limit reached (${dailyLimit})` })
    }
  }

  // 4. Detect locale from header
  const acceptLang = getHeader(event, 'accept-language') ?? ''
  const locale = acceptLang.toLowerCase().startsWith('zh') ? 'zh' : 'en'

  // 5. OpenAI call
  const openai = new OpenAI({ apiKey: config.openaiApiKey as string })

  let feedback: AiFeedback
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `面試題目：${questionText}\n\n應試者回答：${answer}` },
      ],
    })
    feedback = JSON.parse(completion.choices[0].message.content ?? '{}') as AiFeedback
  } catch (e) {
    console.error('[/api/ai/evaluate] OpenAI error:', e)
    throw createError({ statusCode: 500, message: 'AI scoring failed' })
  }

  // 6. Save to practice_logs
  const dbClient = serverSupabaseServiceRole(event)
  await dbClient.from('practice_logs').insert({
    user_id:       userId,
    question_slug: slug,
    question_text: questionText,
    user_answer:   answer,
    ai_feedback:   feedback,
    locale,
  })

  return {
    feedback,
    usedToday:  isDevBypass ? 0 : usedToday + 1,
    dailyLimit: isDevBypass ? null : dailyLimit,
  }
})
```

- [ ] **Step 4: 確認 `npx nuxt prepare` 無 TypeScript 錯誤**

```bash
npx nuxt prepare
```

預期：`Types generated in .nuxt` 無錯誤

- [ ] **Step 5: Commit**

```bash
git add server/api/ai/ tests/server/
git commit -m "feat: add /api/ai/evaluate route with rate limiting and GPT-4o-mini"
```

---

## Task 4: AiPractice.vue 完整重寫

**Files:**
- Modify: `components/question/AiPractice.vue`

- [ ] **Step 1: 完整替換 `components/question/AiPractice.vue`**

```vue
<!-- components/question/AiPractice.vue -->
<script setup lang="ts">
interface AiFeedback {
  accuracy: { score: number; summary: string }
  gaps: string[]
  example: string
}

interface EvaluateResponse {
  feedback:   AiFeedback
  usedToday:  number
  dailyLimit: number | null
}

const props = defineProps<{ slug: string; questionText: string }>()
const { t } = useI18n()
const user = useSupabaseUser()

// UI state: 'idle' | 'loading' | 'result' | 'limit'
const uiState  = ref<'idle' | 'loading' | 'result' | 'limit'>('idle')
const answer   = ref('')
const feedback = ref<AiFeedback | null>(null)
const usedToday  = ref(0)
const dailyLimit = ref<number | null>(10)
const errorMsg = ref('')

// Voice input
const { isRecording, isSupported, start: startVoice, stop: stopVoice } =
  useVoiceInput((transcript) => { answer.value = transcript })

const scoreColour = computed(() => {
  const s = feedback.value?.accuracy.score ?? 0
  if (s >= 80) return 'high'
  if (s >= 60) return 'mid'
  return 'low'
})

const remainingText = computed(() => {
  if (dailyLimit.value === null) return t('ai_evaluate.remaining_unlimited')
  return t('ai_evaluate.remaining', { used: usedToday.value, total: dailyLimit.value })
})

async function submit() {
  if (!answer.value.trim() || uiState.value === 'loading') return
  uiState.value = 'loading'
  errorMsg.value = ''

  try {
    const res = await $fetch<EvaluateResponse>('/api/ai/evaluate', {
      method: 'POST',
      body: {
        slug:         props.slug,
        questionText: props.questionText,
        answer:       answer.value,
      },
    })
    feedback.value  = res.feedback
    usedToday.value = res.usedToday
    dailyLimit.value = res.dailyLimit
    uiState.value   = 'result'
  } catch (err: any) {
    if (err?.status === 429) {
      uiState.value = 'limit'
    } else {
      errorMsg.value = err?.data?.message === 'AI scoring failed'
        ? t('ai_evaluate.error_timeout')
        : t('ai_evaluate.error_generic')
      uiState.value = 'idle'
    }
  }
}

function retry() {
  answer.value  = ''
  feedback.value = null
  uiState.value  = 'idle'
}
</script>

<template>
  <div class="mt-8 border border-[--color-primary-border] rounded-xl overflow-hidden bg-indigo-50/30" id="ai-practice">

    <!-- Header -->
    <div class="px-5 py-3.5 bg-gradient-to-r from-indigo-500 to-violet-500">
      <p class="text-sm font-bold text-white">✦ {{ t('ai_evaluate.title') }}</p>
      <p class="text-xs text-white/75 mt-0.5">{{ t('ai_evaluate.subtitle') }}</p>
    </div>

    <!-- ── Unauthenticated ── -->
    <div v-if="!user" class="px-5 py-8 flex flex-col items-center gap-3 text-center">
      <svg class="w-10 h-10 text-indigo-200" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
      </svg>
      <p class="text-sm text-[--color-text-secondary]">{{ t('ai_evaluate.login_prompt') }}</p>
      <LoginButton />
    </div>

    <!-- ── Daily limit reached ── -->
    <div v-else-if="uiState === 'limit'" class="px-5 py-8 text-center">
      <p class="text-sm font-semibold text-amber-600 mb-2">🚫 {{ t('ai_evaluate.limit_reached') }}</p>
      <button @click="retry" class="text-xs text-indigo-500 underline">{{ t('ai_evaluate.retry') }}</button>
    </div>

    <!-- ── Loading ── -->
    <div v-else-if="uiState === 'loading'" class="px-5 py-10 flex flex-col items-center gap-3">
      <svg class="w-9 h-9 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      <p class="text-sm text-[--color-text-muted]">{{ t('ai_evaluate.loading') }}</p>
    </div>

    <!-- ── Result ── -->
    <div v-else-if="uiState === 'result' && feedback" class="px-5 py-4 flex flex-col gap-4">
      <!-- Score -->
      <div class="flex items-center gap-3">
        <div :class="[
          'w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold shrink-0',
          scoreColour === 'high' ? 'bg-green-100 text-green-700' :
          scoreColour === 'mid'  ? 'bg-yellow-100 text-yellow-700' :
                                   'bg-red-100 text-red-700'
        ]">
          {{ feedback.accuracy.score }}
        </div>
        <div>
          <p class="text-[10px] text-[--color-text-muted] uppercase tracking-wider mb-0.5">{{ t('ai_evaluate.score_label') }}</p>
          <p class="text-sm font-medium text-[--color-text-primary] leading-snug">{{ feedback.accuracy.summary }}</p>
        </div>
      </div>

      <hr class="border-[--color-primary-border]">

      <!-- Gaps -->
      <div>
        <p class="text-[11px] font-semibold text-[--color-text-muted] uppercase tracking-wider mb-2">⚠ {{ t('ai_evaluate.gaps_title') }}</p>
        <ul class="flex flex-col gap-1.5">
          <li v-for="(gap, i) in feedback.gaps" :key="i" class="flex items-start gap-2 text-sm text-[--color-text-secondary]">
            <span class="text-amber-500 mt-0.5 shrink-0">▸</span>
            {{ gap }}
          </li>
        </ul>
      </div>

      <hr class="border-[--color-primary-border]">

      <!-- Example -->
      <div>
        <p class="text-[11px] font-semibold text-[--color-text-muted] uppercase tracking-wider mb-2">✨ {{ t('ai_evaluate.example_title') }}</p>
        <div class="bg-slate-50 border border-[--color-border] rounded-lg px-4 py-3 text-sm text-[--color-text-secondary] leading-relaxed">
          {{ feedback.example }}
        </div>
      </div>

      <div class="flex items-center justify-between">
        <button @click="retry" class="text-xs text-indigo-500 hover:underline">{{ t('ai_evaluate.retry') }}</button>
        <span class="text-xs text-[--color-text-muted]">{{ remainingText }}</span>
      </div>
    </div>

    <!-- ── Idle: Input ── -->
    <div v-else>
      <textarea
        v-model="answer"
        :placeholder="t('ai_evaluate.placeholder')"
        rows="4"
        class="w-full px-5 py-4 text-sm text-[--color-text-secondary] bg-white border-b border-[--color-primary-border] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset placeholder:text-[--color-text-muted] resize-none"
      />

      <div class="px-5 pt-2 pb-1 flex items-center gap-2">
        <!-- Voice button — only show if supported -->
        <button
          v-if="isSupported"
          @click="isRecording ? stopVoice() : startVoice()"
          :class="[
            'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors',
            isRecording
              ? 'bg-red-50 border-red-200 text-red-600'
              : 'bg-slate-50 border-[--color-border] text-[--color-text-muted] hover:border-indigo-300 hover:text-indigo-500'
          ]"
        >
          <span :class="['w-2 h-2 rounded-full', isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-400']" />
          {{ isRecording ? t('ai_evaluate.voice_recording') : t('ai_evaluate.voice_start') }}
        </button>
        <span class="ml-auto text-[10px] text-[--color-text-muted]">{{ answer.length }} / 500</span>
      </div>

      <div class="flex items-center justify-between px-5 py-3">
        <span class="text-xs text-[--color-text-muted]">{{ remainingText }}</span>
        <button
          @click="submit"
          :disabled="!answer.trim() || isRecording"
          class="text-sm font-semibold text-white bg-indigo-500 px-4 py-2 rounded-lg hover:bg-indigo-600 disabled:bg-indigo-200 disabled:cursor-not-allowed transition-colors min-h-11"
        >
          {{ t('ai_evaluate.submit') }}
        </button>
      </div>

      <!-- Error message -->
      <p v-if="errorMsg" class="px-5 pb-3 text-xs text-red-500">{{ errorMsg }}</p>
    </div>

  </div>
</template>
```

- [ ] **Step 2: 確認 `npx nuxt prepare` 無錯誤**

```bash
npx nuxt prepare
```

預期：`Types generated in .nuxt` 無錯誤

- [ ] **Step 3: Commit**

```bash
git add components/question/AiPractice.vue
git commit -m "feat: rewrite AiPractice.vue with 3 states, voice input, score card"
```

---

## Task 5: 更新 [slug].vue + 最終驗收

**Files:**
- Modify: `pages/questions/[slug].vue`

- [ ] **Step 1: 在 `pages/questions/[slug].vue` 更新 AiPractice 的 props**

讀取 `pages/questions/[slug].vue`，找到：

```vue
      <!-- AI Practice section -->
      <div id="ai-practice">
        <AiPractice />
      </div>
```

替換為：

```vue
      <!-- AI Practice section -->
      <div id="ai-practice">
        <AiPractice :slug="slug" :question-text="question.title" />
      </div>
```

- [ ] **Step 2: 執行所有測試**

```bash
npx vitest run
```

預期：所有測試通過（TagBadge ×2、useBookmarks ×2、BookmarkButton ×2、useVoiceInput ×2、evaluate ×5 = 共 13 tests）

- [ ] **Step 3: 啟動 dev server 手動驗收**

```bash
npm run dev
```

手動確認清單：

```
[ ] 未登入 → AiPractice 顯示「登入後才能使用」+ LoginButton
[ ] 登入後 → 顯示 textarea + 語音按鈕（Chrome）/ 不顯示語音按鈕（Firefox）
[ ] 輸入文字並送出 → 顯示 loading spinner
[ ] GPT 回應後 → 顯示評分卡（分數 badge 顏色正確）
[ ] 「重新作答」→ 回到 idle 狀態
[ ] BYPASS_EMAILS 帳號 → 顯示「開發者模式（無限次）」
[ ] 非 bypass 帳號第 10 次 → 顯示限制提示
[ ] DevTools Network → /api/ai/evaluate 請求不含 OPENAI_API_KEY
[ ] practice_logs 表有新增一筆紀錄（Supabase Table Editor 確認）
```

- [ ] **Step 4: 最終 commit**

```bash
git add pages/questions/[slug].vue
git commit -m "feat: AI interviewer complete — GPT-4o-mini scoring, voice input, rate limiting"
```

---

## Self-Review

**Spec coverage check:**

| Spec 需求 | 對應 Task |
|---|---|
| OpenAI GPT-4o-mini 呼叫 | Task 3 Step 3 |
| response_format json_object | Task 3 Step 3（SYSTEM_PROMPT + options）|
| 結構化評分卡（分數 + 缺漏 + 範例）| Task 4（AiPractice result state）|
| 語音輸入 Web Speech API | Task 2（useVoiceInput）|
| 語系自動切換（zh-TW / en-US）| Task 2（recognition.lang）|
| Firefox 不顯示語音按鈕 | Task 4（v-if="isSupported"）|
| Rate limit 每日 10 次 | Task 3（Supabase count query）|
| BYPASS_EMAILS 豁免 | Task 3（bypassEmails split/includes）|
| practice_logs 儲存 | Task 3（INSERT practice_logs）|
| 未登入顯示提示 | Task 4（v-if="!user"）|
| 429 顯示限制提示 | Task 4（uiState = 'limit'）|
| OPENAI_API_KEY server-only | Task 1（runtimeConfig 非 public）|
| i18n 字串 | Task 1（ai_evaluate 區段）|
| nuxt.config runtimeConfig | Task 1 Step 2 |
| [slug].vue 加 props | Task 5 Step 1 |

**無未涵蓋需求。**
