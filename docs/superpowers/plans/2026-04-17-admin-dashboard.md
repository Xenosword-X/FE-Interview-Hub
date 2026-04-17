# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a password-protected admin panel for CRUD management of interview questions stored in Supabase, replacing the current @nuxt/content Markdown file system.

**Architecture:** Nuxt pages under `/admin/*` guarded by a Nitro server middleware that validates an H3 session cookie. Question data lives in two Supabase tables (`questions` + `translations`). The public frontend switches from `queryCollection()` to a new `/api/questions` endpoint. The admin uses a split-view Markdown editor (zh/en tabs).

**Tech Stack:** Nuxt 4, @nuxtjs/supabase v2 (serverSupabaseServiceRole), H3 useSession, marked (Markdown rendering), TypeScript

---

## File Map

| Status | Path | Purpose |
|---|---|---|
| CREATE | `scripts/migrate-questions.ts` | One-time migration from MD files to Supabase |
| CREATE | `server/api/questions/index.get.ts` | Public questions API (replaces queryCollection) |
| CREATE | `server/middleware/admin-auth.ts` | Guards all /admin/* and /api/admin/* routes |
| CREATE | `server/api/admin/login.post.ts` | Validate credentials, set session cookie |
| CREATE | `server/api/admin/logout.post.ts` | Clear session cookie |
| CREATE | `server/api/admin/questions/index.get.ts` | Admin: list all questions |
| CREATE | `server/api/admin/questions/index.post.ts` | Admin: create question |
| CREATE | `server/api/admin/questions/[id].get.ts` | Admin: fetch one question |
| CREATE | `server/api/admin/questions/[id].put.ts` | Admin: update question |
| CREATE | `server/api/admin/questions/[id].delete.ts` | Admin: delete question |
| CREATE | `layouts/admin.vue` | Admin layout (no site nav) |
| CREATE | `pages/admin/login.vue` | Login form |
| CREATE | `pages/admin/questions/index.vue` | Question list with search/filter |
| CREATE | `pages/admin/questions/new.vue` | Create new question |
| CREATE | `pages/admin/questions/[id]/edit.vue` | Edit existing question |
| CREATE | `components/admin/MarkdownEditor.vue` | Split-view editor (zh/en + preview) |
| MODIFY | `nuxt.config.ts` | Add sessionSecret, backendAccount, backendPassword to runtimeConfig |
| MODIFY | `composables/useQuestions.ts` | Replace queryCollection with $fetch |
| MODIFY | `pages/index.vue` | Replace queryCollection with $fetch |
| MODIFY | `pages/questions/[slug].vue` | Replace queryCollection + ContentRenderer with $fetch + marked |
| MODIFY | `assets/css/main.css` | Add .callout style for marked-rendered callout blocks |

---

## Task 1: Create Supabase Tables

**Files:** (SQL run in Supabase SQL Editor — no source files)

- [ ] **Step 1: Open your Supabase project dashboard → SQL Editor**

- [ ] **Step 2: Run this SQL to create the `questions` table**

```sql
create table questions (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  category    text not null,
  difficulty  text not null check (difficulty in ('basic','intermediate','advanced')),
  tags        text[] not null default '{}',
  is_published boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

- [ ] **Step 3: Run this SQL to create the `translations` table**

```sql
create table translations (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  locale      text not null check (locale in ('zh','en')),
  title       text not null,
  body_md     text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (question_id, locale)
);
```

- [ ] **Step 4: Verify both tables exist in the Table Editor**

Expected: `questions` and `translations` listed with the columns above.

- [ ] **Step 5: Add environment variables to `.env`**

```
BACKEND_ACCOUNT=your-admin-email
BACKEND_PASSWORD=your-admin-password
SESSION_SECRET=generate-a-32-char-random-string-here
```

`SESSION_SECRET` must be at least 32 characters. Use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` to generate one.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: create questions and translations tables in Supabase"
```

---

## Task 2: Migration Script

**Files:**
- Create: `scripts/migrate-questions.ts`

- [ ] **Step 1: Create `scripts/migrate-questions.ts`**

```typescript
// scripts/migrate-questions.ts
import { readFileSync, readdirSync } from 'fs'
import { join, resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env file manually (tsx doesn't auto-load it)
try {
  const envFile = readFileSync(resolve('.env'), 'utf-8')
  for (const line of envFile.split('\n')) {
    const eqIdx = line.indexOf('=')
    if (eqIdx > 0 && !line.startsWith('#')) {
      const key = line.slice(0, eqIdx).trim()
      const val = line.slice(eqIdx + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  }
} catch {}

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function parseFrontmatter(content: string): { data: Record<string, any>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) throw new Error('No frontmatter block found')
  const yaml = match[1]
  const body = match[2].trim()
  const data: Record<string, any> = {}
  for (const line of yaml.split('\n')) {
    const eqIdx = line.indexOf(':')
    if (eqIdx < 0) continue
    const key = line.slice(0, eqIdx).trim()
    const val = line.slice(eqIdx + 1).trim()
    if (val.startsWith('[') && val.endsWith(']')) {
      data[key] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''))
    } else {
      data[key] = val
    }
  }
  return { data, body }
}

function getAllMdFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      files.push(...getAllMdFiles(join(dir, entry.name)))
    } else if (entry.name.endsWith('.md')) {
      files.push(join(dir, entry.name))
    }
  }
  return files
}

const zhDir = resolve('content/zh/questions')
const enDir = resolve('content/en/questions')
const zhFiles = getAllMdFiles(zhDir)

let success = 0
let failed = 0

for (const zhPath of zhFiles) {
  // Derive the relative path to find the matching EN file
  const relPath = zhPath.slice(zhDir.length).replace(/\\/g, '/')
  const enPath = join(enDir, relPath)

  let enRaw: string
  try {
    enRaw = readFileSync(enPath, 'utf-8')
  } catch {
    console.error(`✗ Missing EN file: ${relPath}`)
    failed++
    continue
  }

  const zhRaw = readFileSync(zhPath, 'utf-8')
  const { data: zhMeta, body: zhBody } = parseFrontmatter(zhRaw)
  const { data: enMeta, body: enBody } = parseFrontmatter(enRaw)

  try {
    // Upsert question row (slug is unique — safe to re-run)
    const { data: question, error: qErr } = await supabase
      .from('questions')
      .upsert(
        {
          slug: zhMeta.slug,
          category: zhMeta.category,
          difficulty: zhMeta.difficulty,
          tags: zhMeta.tags,
          is_published: true,
        },
        { onConflict: 'slug' }
      )
      .select('id')
      .single()

    if (qErr) throw new Error(qErr.message)

    // Upsert translations (question_id+locale is unique)
    const { error: tErr } = await supabase
      .from('translations')
      .upsert(
        [
          { question_id: question.id, locale: 'zh', title: zhMeta.title, body_md: zhBody },
          { question_id: question.id, locale: 'en', title: enMeta.title, body_md: enBody },
        ],
        { onConflict: 'question_id,locale' }
      )

    if (tErr) throw new Error(tErr.message)

    console.log(`✓ ${zhMeta.slug}`)
    success++
  } catch (err: any) {
    console.error(`✗ ${zhMeta.slug}: ${err.message}`)
    failed++
  }
}

console.log(`\nMigration complete: ${success} succeeded, ${failed} failed`)
```

- [ ] **Step 2: Run the migration script**

```bash
npx tsx scripts/migrate-questions.ts
```

Expected output:
```
✓ event-loop
✓ closure
✓ prototype-chain
✓ composition-api
✓ box-model
✓ generics
✓ lcp
✓ http-vs-https

Migration complete: 8 succeeded, 0 failed
```

- [ ] **Step 3: Verify in Supabase Table Editor**

Open `questions` table — should have 8 rows. Open `translations` — should have 16 rows (2 per question).

- [ ] **Step 4: Commit**

```bash
git add scripts/migrate-questions.ts
git commit -m "feat: add Supabase migration script for Markdown questions"
```

---

## Task 3: Public Questions API

**Files:**
- Create: `server/api/questions/index.get.ts`

- [ ] **Step 1: Create `server/api/questions/index.get.ts`**

```typescript
// server/api/questions/index.get.ts
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const locale = (query.locale as string) || 'zh'
  const slug = query.slug as string | undefined

  const client = serverSupabaseServiceRole(event)

  // Select body_md only when fetching a single question (slug provided)
  const selectFields = slug
    ? 'title, body_md, locale, questions!inner(id, slug, category, difficulty, tags, is_published)'
    : 'title, locale, questions!inner(id, slug, category, difficulty, tags, is_published)'

  let qb = client
    .from('translations')
    .select(selectFields)
    .eq('locale', locale)
    .eq('questions.is_published', true)

  if (slug) {
    qb = qb.eq('questions.slug', slug)
  }

  const { data, error } = await qb

  if (error) throw createError({ statusCode: 500, message: error.message })

  const result = (data ?? []).map((row: any) => ({
    id: row.questions.id,
    slug: row.questions.slug,
    category: row.questions.category,
    difficulty: row.questions.difficulty,
    tags: row.questions.tags,
    title: row.title,
    body_md: row.body_md ?? '',
  }))

  if (slug) {
    if (result.length === 0) throw createError({ statusCode: 404, message: 'Question not found' })
    return result[0]
  }

  return result
})
```

- [ ] **Step 2: Start dev server and test the endpoint**

```bash
npm run dev
```

In another terminal:
```bash
curl "http://localhost:3000/api/questions?locale=zh"
```

Expected: JSON array with 8 objects, each having `id`, `slug`, `category`, `difficulty`, `tags`, `title`, `body_md` (empty for list).

```bash
curl "http://localhost:3000/api/questions?locale=zh&slug=event-loop"
```

Expected: Single JSON object with full `body_md` populated.

- [ ] **Step 3: Commit**

```bash
git add server/api/questions/index.get.ts
git commit -m "feat: add public questions API backed by Supabase"
```

---

## Task 4: Migrate Frontend Off @nuxt/content

**Files:**
- Modify: `composables/useQuestions.ts`
- Modify: `pages/index.vue`
- Modify: `pages/questions/[slug].vue`
- Modify: `assets/css/main.css`

- [ ] **Step 1: Update `composables/useQuestions.ts`**

Replace entire file content:

```typescript
// composables/useQuestions.ts
export interface QuestionMeta {
  id: string
  slug: string
  title: string
  category: string
  tags: string[]
  difficulty: 'basic' | 'intermediate' | 'advanced'
}

export interface QuestionItem extends QuestionMeta {
  body_md: string
}

export function useQuestions() {
  const { locale } = useI18n()
  const route = useRoute()

  const { data: questions, pending } = useAsyncData(
    `questions-${locale.value}`,
    () => $fetch<QuestionMeta[]>('/api/questions', { query: { locale: locale.value } })
  )

  const activeTag = computed(() => (route.query.tag as string) ?? '')

  const filtered = computed(() => {
    if (!questions.value) return []
    if (!activeTag.value) return questions.value
    return questions.value.filter(q => q.category === activeTag.value)
  })

  return { questions, filtered, activeTag, pending }
}
```

- [ ] **Step 2: Update `pages/index.vue` — replace the queryCollection call**

Find and replace this block in `pages/index.vue`:

```typescript
// REMOVE this block:
const { data: allQuestions } = await useAsyncData(
  `all-questions-${locale.value}`,
  () => queryCollection('questions')
    .select('slug', 'title', 'category', 'tags', 'difficulty', 'path')
    .all()
    .then(qs => qs.filter(q => q.path?.includes(`/${locale.value}/`)))
)
```

Replace with (add this import at the top of `<script setup>`, then replace the useAsyncData call):

```typescript
import type { QuestionMeta } from '~/composables/useQuestions'

const { data: allQuestions } = await useAsyncData(
  `all-questions-${locale.value}`,
  () => $fetch<QuestionMeta[]>('/api/questions', { query: { locale: locale.value } })
)
```

- [ ] **Step 3: Update `pages/questions/[slug].vue` — replace imports and data fetching**

At the top of `<script setup>`, replace:

```typescript
// REMOVE this import if present:
// const AppCalloutComp = resolveComponent('AppCallout')

// REMOVE this block:
const { data: localeQuestions } = await useAsyncData(
  `questions-${locale.value}`,
  async () => {
    const all = await queryCollection('questions').all()
    return all.filter(q => q.path?.includes(`/${locale.value}/`))
  }
)

const question = localeQuestions.value?.find(q => q.slug === slug) ?? null
```

Replace with (add `marked` imports and new data fetching):

```typescript
import { marked, Renderer } from 'marked'
import type { QuestionItem, QuestionMeta } from '~/composables/useQuestions'

// Configure marked to generate heading IDs for TOC
const renderer = new Renderer()
renderer.heading = ({ text, depth }: { text: string; depth: number }): string => {
  const id = text.toLowerCase().replace(/[`*]/g, '').trim().replace(/\s+/g, '-')
  return `<h${depth} id="${id}">${text}</h${depth}>\n`
}
marked.use({ renderer })

function preprocessMarkdown(md: string): string {
  // Convert ::callout\ncontent\n:: to styled div
  return md.replace(/::callout\r?\n([\s\S]*?)\r?\n::/g, (_, content) =>
    `<div class="callout">${content}</div>`
  )
}

// Fetch current question (with body_md)
const { data: question } = await useAsyncData(
  `question-${locale.value}-${slug}`,
  () => $fetch<QuestionItem>('/api/questions', { query: { locale: locale.value, slug } })
)

// Fetch all questions for prev/next navigation (reuses cached questions-{locale} key)
const { data: localeQuestions } = await useAsyncData(
  `questions-${locale.value}`,
  () => $fetch<QuestionMeta[]>('/api/questions', { query: { locale: locale.value } })
)
```

- [ ] **Step 4: Update the null check and derived data in `[slug].vue`**

Replace:

```typescript
if (!question) {
  throw createError({ statusCode: 404, statusMessage: 'Question not found' })
}

const currentIndex = localeQuestions.value?.findIndex(q => q.slug === slug) ?? -1
const prevQuestion = currentIndex > 0 ? (localeQuestions.value?.[currentIndex - 1] ?? null) : null
const nextQuestion = currentIndex < (localeQuestions.value?.length ?? 0) - 1
  ? (localeQuestions.value?.[currentIndex + 1] ?? null)
  : null

// TOC links from content body (question is a plain object, not a Ref)
const tocLinks = (question as any)?.body?.toc?.links as Array<{ id: string; text: string; depth: number }> ?? []
```

With:

```typescript
if (!question.value) {
  throw createError({ statusCode: 404, statusMessage: 'Question not found' })
}

const currentIndex = localeQuestions.value?.findIndex(q => q.slug === slug) ?? -1
const prevQuestion = currentIndex > 0 ? (localeQuestions.value?.[currentIndex - 1] ?? null) : null
const nextQuestion = currentIndex < (localeQuestions.value?.length ?? 0) - 1
  ? (localeQuestions.value?.[currentIndex + 1] ?? null)
  : null

// Extract TOC from Markdown headings (h2 and h3 only)
const tocLinks = computed(() => {
  if (!question.value?.body_md) return []
  const links: Array<{ id: string; text: string; depth: number }> = []
  for (const line of question.value.body_md.split('\n')) {
    const match = line.match(/^(#{2,3})\s+(.+)$/)
    if (match) {
      const depth = match[1].length
      const text = match[2].trim()
      const id = text.toLowerCase().replace(/[`*]/g, '').trim().replace(/\s+/g, '-')
      links.push({ id, text, depth })
    }
  }
  return links
})

// Rendered HTML for the question body
const renderedHtml = computed(() =>
  question.value?.body_md
    ? marked(preprocessMarkdown(question.value.body_md)) as string
    : ''
)
```

- [ ] **Step 5: Update SEO and template references in `[slug].vue`**

The `question` is now `question.value` (it's a Ref). Update all `question.xxx` references to `question.value.xxx` in the `<script setup>` section (the useSeoMeta and useHead calls):

```typescript
// Update useSeoMeta to use question.value:
useSeoMeta({
  title: `${question.value!.title} | FE Interview Hub`,
  description: question.value!.title,
  ogTitle: question.value!.title,
  ogUrl: `${siteUrl}/${locale.value}/questions/${slug}`,
  twitterCard: 'summary',
})

useHead({
  link: [
    { rel: 'canonical', href: `${siteUrl}/${locale.value}/questions/${slug}` },
    { rel: 'alternate', hreflang: 'zh-TW', href: `${siteUrl}/zh/questions/${slug}` },
    { rel: 'alternate', hreflang: 'en-US', href: `${siteUrl}/en/questions/${slug}` },
  ],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      name: question.value!.title,
      inLanguage: locale.value === 'zh' ? 'zh-TW' : 'en-US',
      url: `${siteUrl}/${locale.value}/questions/${slug}`,
    })
  }]
})
```

- [ ] **Step 6: Replace ContentRenderer in `[slug].vue` template**

In the template, find:

```html
<!-- Markdown content — v-show keeps it in DOM for SEO -->
<div
  v-show="isExpanded"
  class="
    prose prose-slate max-w-none
    ...
    mb-6
  "
>
  <ContentRenderer
    v-if="question"
    :value="question"
    :components="{ callout: AppCalloutComp }"
  />
</div>
```

Replace with:

```html
<!-- Markdown content — v-show keeps it in DOM for SEO -->
<div
  v-show="isExpanded"
  class="
    prose prose-slate max-w-none
    prose-headings:font-bold prose-headings:text-[--color-text-primary]
    prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-2.5
    prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2
    prose-p:text-base prose-p:text-[--color-text-secondary] prose-p:leading-relaxed
    prose-li:text-base prose-li:text-[--color-text-secondary]
    prose-code:text-[11px] prose-code:font-mono prose-code:bg-slate-100 prose-code:text-indigo-700 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
    prose-pre:bg-slate-50 prose-pre:border prose-pre:border-[--color-border] prose-pre:rounded-lg prose-pre:text-[12px]
    prose-table:text-sm prose-th:text-[--color-text-primary] prose-td:text-[--color-text-secondary]
    mb-6
  "
  v-html="renderedHtml"
/>
```

Also update the template references to `question.title`, `question.category`, `question.difficulty` — add `.value`:

In the template, replace `question.title` → `question.value?.title`, `question.category` → `question.value?.category`, `question.difficulty` → `question.value?.difficulty`, `question.slug` does not need change (slug is already a const from route params).

Also update `<AiPractice :slug="slug" :question-text="question.title" />` to `<AiPractice :slug="slug" :question-text="question.value?.title ?? ''" />`.

And `<QuestionToc :links="tocLinks" />` — `tocLinks` is now a computed ref, so in template it auto-unwraps (no change needed).

- [ ] **Step 7: Add callout style to `assets/css/main.css`**

Append at the end of the file:

```css
/* Callout block (rendered from ::callout :: MDC syntax via marked) */
.callout {
  background: #eff6ff;
  border-left: 3px solid #6366f1;
  padding: 12px 16px;
  border-radius: 6px;
  margin: 1rem 0;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.6;
}
```

- [ ] **Step 8: Install `marked`**

```bash
npm install marked
```

- [ ] **Step 9: Verify in browser**

Start dev server (`npm run dev`). Navigate to any question detail page (e.g., `/zh/questions/event-loop`). Verify:
- Question title shows correctly
- Markdown body renders (headings, code blocks, tables visible)
- Callout box shows with indigo left border
- TOC links appear on right sidebar (desktop)
- Breadcrumb shows category name
- Prev/Next navigation works

- [ ] **Step 10: Commit**

```bash
git add composables/useQuestions.ts pages/index.vue pages/questions/[slug].vue assets/css/main.css package.json package-lock.json
git commit -m "feat: migrate frontend from @nuxt/content to Supabase API"
```

---

## Task 5: Admin Auth Infrastructure

**Files:**
- Modify: `nuxt.config.ts`
- Create: `server/middleware/admin-auth.ts`
- Create: `server/api/admin/login.post.ts`
- Create: `server/api/admin/logout.post.ts`
- Create: `layouts/admin.vue`

- [ ] **Step 1: Add admin secrets to `nuxt.config.ts` runtimeConfig**

In `nuxt.config.ts`, find the `runtimeConfig` block and add three new server-only keys:

```typescript
runtimeConfig: {
  openaiApiKey:    process.env.OPENAI_API_KEY  ?? '',
  dailyAiLimit:    process.env.DAILY_AI_LIMIT  ?? '10',
  bypassEmails:    process.env.BYPASS_EMAILS   ?? '',
  sessionSecret:   process.env.SESSION_SECRET  ?? '',
  backendAccount:  process.env.BACKEND_ACCOUNT ?? '',
  backendPassword: process.env.BACKEND_PASSWORD ?? '',
  public: {
    siteUrl: SITE_URL,
  },
},
```

- [ ] **Step 2: Create `server/middleware/admin-auth.ts`**

```typescript
// server/middleware/admin-auth.ts
export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Only guard /admin/* and /api/admin/* paths
  if (!path.startsWith('/admin') && !path.startsWith('/api/admin')) return

  // Login endpoints are always accessible
  if (path === '/admin/login' || path === '/api/admin/login') return

  const config = useRuntimeConfig(event)
  const session = await useSession(event, {
    password: config.sessionSecret,
    maxAge: 86400, // 24 hours
  })

  if (!session.data.authenticated) {
    if (path.startsWith('/api/')) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    } else {
      return sendRedirect(event, '/admin/login', 302)
    }
  }
})
```

- [ ] **Step 3: Create `server/api/admin/login.post.ts`**

```typescript
// server/api/admin/login.post.ts
export default defineEventHandler(async (event) => {
  const { account, password } = await readBody<{ account: string; password: string }>(event)
  const config = useRuntimeConfig(event)

  if (!account || !password) {
    throw createError({ statusCode: 400, message: 'Account and password are required' })
  }

  if (account !== config.backendAccount || password !== config.backendPassword) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  const session = await useSession(event, {
    password: config.sessionSecret,
    maxAge: 86400,
  })
  await session.update({ authenticated: true })

  return { success: true }
})
```

- [ ] **Step 4: Create `server/api/admin/logout.post.ts`**

```typescript
// server/api/admin/logout.post.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, {
    password: config.sessionSecret,
    maxAge: 86400,
  })
  await session.clear()
  return { success: true }
})
```

- [ ] **Step 5: Create `layouts/admin.vue`**

```vue
<!-- layouts/admin.vue -->
<script setup lang="ts">
async function logout() {
  await $fetch('/api/admin/logout', { method: 'POST' })
  await navigateTo('/admin/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
      <div class="flex items-center gap-3">
        <NuxtLink to="/admin/questions" class="text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors">
          FE Interview Hub
        </NuxtLink>
        <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
          Admin
        </span>
      </div>
      <button
        @click="logout"
        class="text-xs text-slate-400 hover:text-red-500 transition-colors"
      >
        Sign out
      </button>
    </header>
    <main class="max-w-5xl mx-auto px-6 py-8">
      <slot />
    </main>
  </div>
</template>
```

- [ ] **Step 6: Verify middleware works**

With dev server running, visit `http://localhost:3000/admin/questions` in browser.
Expected: redirected to `/admin/login`.

Visit `http://localhost:3000/admin/login` — expected: no redirect (page loads).

- [ ] **Step 7: Commit**

```bash
git add nuxt.config.ts server/middleware/admin-auth.ts server/api/admin/login.post.ts server/api/admin/logout.post.ts layouts/admin.vue
git commit -m "feat: add admin auth middleware, session-based login/logout"
```

---

## Task 6: Admin CRUD API Routes

**Files:**
- Create: `server/api/admin/questions/index.get.ts`
- Create: `server/api/admin/questions/index.post.ts`
- Create: `server/api/admin/questions/[id].get.ts`
- Create: `server/api/admin/questions/[id].put.ts`
- Create: `server/api/admin/questions/[id].delete.ts`

- [ ] **Step 1: Create `server/api/admin/questions/index.get.ts`**

```typescript
// server/api/admin/questions/index.get.ts
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client
    .from('questions')
    .select('*, translations(*)')
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data ?? []
})
```

- [ ] **Step 2: Create `server/api/admin/questions/index.post.ts`**

```typescript
// server/api/admin/questions/index.post.ts
import { serverSupabaseServiceRole } from '#supabase/server'

interface CreateBody {
  slug: string
  category: string
  difficulty: string
  tags: string[]
  zh: { title: string; body_md: string }
  en: { title: string; body_md: string }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateBody>(event)

  if (!body.slug || !body.zh?.title || !body.en?.title || !body.category || !body.difficulty) {
    throw createError({ statusCode: 400, message: 'slug, category, difficulty, and both titles are required' })
  }

  const client = serverSupabaseServiceRole(event)

  const { data: question, error: qErr } = await client
    .from('questions')
    .insert({
      slug: body.slug,
      category: body.category,
      difficulty: body.difficulty,
      tags: body.tags ?? [],
    })
    .select('id')
    .single()

  if (qErr) {
    if (qErr.code === '23505') {
      throw createError({ statusCode: 409, message: 'Slug already in use' })
    }
    throw createError({ statusCode: 500, message: qErr.message })
  }

  const { error: tErr } = await client
    .from('translations')
    .insert([
      { question_id: question.id, locale: 'zh', title: body.zh.title, body_md: body.zh.body_md },
      { question_id: question.id, locale: 'en', title: body.en.title, body_md: body.en.body_md },
    ])

  if (tErr) throw createError({ statusCode: 500, message: tErr.message })

  return { id: question.id, slug: body.slug }
})
```

- [ ] **Step 3: Create `server/api/admin/questions/[id].get.ts`**

```typescript
// server/api/admin/questions/[id].get.ts
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id' })

  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client
    .from('questions')
    .select('*, translations(*)')
    .eq('id', id)
    .single()

  if (error || !data) throw createError({ statusCode: 404, message: 'Question not found' })
  return data
})
```

- [ ] **Step 4: Create `server/api/admin/questions/[id].put.ts`**

```typescript
// server/api/admin/questions/[id].put.ts
import { serverSupabaseServiceRole } from '#supabase/server'

interface UpdateBody {
  category: string
  difficulty: string
  tags: string[]
  zh: { title: string; body_md: string }
  en: { title: string; body_md: string }
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id' })

  const body = await readBody<UpdateBody>(event)

  if (!body.zh?.title || !body.en?.title || !body.category || !body.difficulty) {
    throw createError({ statusCode: 400, message: 'category, difficulty, and both titles are required' })
  }

  const client = serverSupabaseServiceRole(event)

  const { error: qErr } = await client
    .from('questions')
    .update({
      category: body.category,
      difficulty: body.difficulty,
      tags: body.tags ?? [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (qErr) throw createError({ statusCode: 500, message: qErr.message })

  for (const locale of ['zh', 'en'] as const) {
    const t = body[locale]
    const { error: tErr } = await client
      .from('translations')
      .upsert(
        {
          question_id: id,
          locale,
          title: t.title,
          body_md: t.body_md,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'question_id,locale' }
      )

    if (tErr) throw createError({ statusCode: 500, message: tErr.message })
  }

  return { success: true }
})
```

- [ ] **Step 5: Create `server/api/admin/questions/[id].delete.ts`**

```typescript
// server/api/admin/questions/[id].delete.ts
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id' })

  const client = serverSupabaseServiceRole(event)

  // Translations are cascade-deleted by the FK constraint
  const { error } = await client.from('questions').delete().eq('id', id)
  if (error) throw createError({ statusCode: 500, message: error.message })

  return { success: true }
})
```

- [ ] **Step 6: Commit**

```bash
git add server/api/admin/questions/
git commit -m "feat: add admin CRUD API routes for questions"
```

---

## Task 7: Admin Login Page

**Files:**
- Create: `pages/admin/login.vue`

- [ ] **Step 1: Create `pages/admin/login.vue`**

```vue
<!-- pages/admin/login.vue -->
<script setup lang="ts">
definePageMeta({ layout: false })

const account  = ref('')
const password = ref('')
const error    = ref('')
const loading  = ref(false)

async function login() {
  if (!account.value || !password.value) return
  loading.value = true
  error.value   = ''
  try {
    await $fetch('/api/admin/login', {
      method: 'POST',
      body: { account: account.value, password: password.value },
    })
    await navigateTo('/admin/questions')
  } catch (err: any) {
    error.value = err?.data?.message ?? 'Invalid credentials'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center px-4">
    <div class="w-full max-w-sm bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
      <h1 class="text-lg font-bold text-slate-800 mb-1">Admin Login</h1>
      <p class="text-xs text-slate-400 mb-6">FE Interview Hub Dashboard</p>

      <div class="flex flex-col gap-4">
        <div>
          <label class="text-xs font-medium text-slate-600 block mb-1">Account</label>
          <input
            v-model="account"
            type="text"
            autocomplete="username"
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            @keydown.enter="login"
          />
        </div>
        <div>
          <label class="text-xs font-medium text-slate-600 block mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            @keydown.enter="login"
          />
        </div>

        <p v-if="error" class="text-xs text-red-500">{{ error }}</p>

        <button
          @click="login"
          :disabled="loading || !account || !password"
          class="bg-indigo-500 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-indigo-600 disabled:bg-indigo-200 disabled:cursor-not-allowed transition-colors"
        >
          {{ loading ? 'Signing in…' : 'Sign In' }}
        </button>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Verify login flow in browser**

Navigate to `http://localhost:3000/admin/login`.
- Enter wrong credentials → expect "Invalid credentials" error message appears
- Enter correct credentials (from `.env`) → expect redirect to `/admin/questions`
- After login, navigate to `http://localhost:3000/admin/questions` directly → expect page loads (not redirected)
- Click "Sign out" in header → expect redirect back to `/admin/login`

- [ ] **Step 3: Commit**

```bash
git add pages/admin/login.vue
git commit -m "feat: add admin login page"
```

---

## Task 8: Admin Question List Page

**Files:**
- Create: `pages/admin/questions/index.vue`

- [ ] **Step 1: Create `pages/admin/questions/index.vue`**

```vue
<!-- pages/admin/questions/index.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'admin' })

interface Translation {
  locale: string
  title: string
  body_md: string
}

interface AdminQuestion {
  id: string
  slug: string
  category: string
  difficulty: string
  tags: string[]
  is_published: boolean
  created_at: string
  translations: Translation[]
}

const { data: questions, refresh } = await useAsyncData(
  'admin-questions',
  () => $fetch<AdminQuestion[]>('/api/admin/questions')
)

const search         = ref('')
const filterCategory = ref('')
const confirmDelete  = ref<string | null>(null)
const deleting       = ref(false)

const categories = ['javascript', 'vue', 'css', 'typescript', 'react', 'web-vitals', 'browser', 'http']

const filtered = computed(() => {
  if (!questions.value) return []
  return questions.value.filter(q => {
    const zhTitle = q.translations.find(t => t.locale === 'zh')?.title ?? ''
    const matchSearch = !search.value
      || q.slug.includes(search.value.toLowerCase())
      || zhTitle.includes(search.value)
    const matchCat = !filterCategory.value || q.category === filterCategory.value
    return matchSearch && matchCat
  })
})

async function deleteQuestion(id: string) {
  deleting.value = true
  try {
    await $fetch(`/api/admin/questions/${id}`, { method: 'DELETE' })
    confirmDelete.value = null
    await refresh()
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div>
    <!-- Header row -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-slate-800">
        Questions
        <span class="text-sm font-normal text-slate-400 ml-2">{{ filtered.length }}</span>
      </h1>
      <NuxtLink
        to="/admin/questions/new"
        class="bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
      >
        + New Question
      </NuxtLink>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 mb-5">
      <input
        v-model="search"
        type="text"
        placeholder="Search slug or title…"
        class="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-64"
      />
      <select
        v-model="filterCategory"
        class="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        <option value="">All Categories</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Slug</th>
            <th class="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Category</th>
            <th class="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Difficulty</th>
            <th class="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Published</th>
            <th class="px-4 py-3 w-28"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="q in filtered" :key="q.id" class="hover:bg-slate-50 transition-colors">
            <td class="px-4 py-3 font-mono text-xs text-slate-600">{{ q.slug }}</td>
            <td class="px-4 py-3 text-slate-600">{{ q.category }}</td>
            <td class="px-4 py-3 text-slate-600">{{ q.difficulty }}</td>
            <td class="px-4 py-3">
              <span
                :class="q.is_published ? 'text-green-600 bg-green-50' : 'text-slate-400 bg-slate-50'"
                class="text-[11px] font-medium px-2 py-0.5 rounded"
              >
                {{ q.is_published ? 'Yes' : 'No' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-3">
                <NuxtLink
                  :to="`/admin/questions/${q.id}/edit`"
                  class="text-xs text-indigo-500 hover:underline"
                >
                  Edit
                </NuxtLink>

                <template v-if="confirmDelete !== q.id">
                  <button
                    @click="confirmDelete = q.id"
                    class="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </template>
                <template v-else>
                  <span class="text-xs text-slate-500">Sure?</span>
                  <button
                    @click="deleteQuestion(q.id)"
                    :disabled="deleting"
                    class="text-xs text-red-600 font-semibold hover:underline disabled:opacity-50"
                  >
                    Yes
                  </button>
                  <button
                    @click="confirmDelete = null"
                    class="text-xs text-slate-400 hover:underline"
                  >
                    No
                  </button>
                </template>
              </div>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="5" class="px-4 py-10 text-center text-sm text-slate-400">
              No questions found
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Verify question list in browser**

After logging in, visit `/admin/questions`. Verify:
- All 8 migrated questions appear in the table
- Search input filters by slug
- Category dropdown filters by category
- Edit link navigates to edit page (404 for now — that's fine)
- Delete flow: click Delete → "Sure? Yes No" confirmation appears → click Yes → row disappears

- [ ] **Step 3: Commit**

```bash
git add pages/admin/questions/index.vue
git commit -m "feat: add admin question list page"
```

---

## Task 9: MarkdownEditor Component

**Files:**
- Create: `components/admin/MarkdownEditor.vue`

> Note: `marked` was already installed in Task 4 Step 8.

- [ ] **Step 1: Create `components/admin/MarkdownEditor.vue`**

```vue
<!-- components/admin/MarkdownEditor.vue -->
<script setup lang="ts">
import { marked, Renderer } from 'marked'

interface LocaleContent {
  title: string
  body_md: string
}

const props = defineProps<{
  zh: LocaleContent
  en: LocaleContent
  slug: string
  category: string
  difficulty: string
  tags: string
  isNew?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:zh', val: LocaleContent): void
  (e: 'update:en', val: LocaleContent): void
  (e: 'update:slug', val: string): void
  (e: 'update:category', val: string): void
  (e: 'update:difficulty', val: string): void
  (e: 'update:tags', val: string): void
  (e: 'save'): void
  (e: 'cancel'): void
}>()

const activeLocale = ref<'zh' | 'en'>('zh')

// Configure marked with heading IDs
const renderer = new Renderer()
renderer.heading = ({ text, depth }: { text: string; depth: number }): string => {
  const id = text.toLowerCase().replace(/[`*]/g, '').trim().replace(/\s+/g, '-')
  return `<h${depth} id="${id}">${text}</h${depth}>\n`
}
marked.use({ renderer })

function preprocessMarkdown(md: string): string {
  return md.replace(/::callout\r?\n([\s\S]*?)\r?\n::/g, (_, content) =>
    `<div class="callout">${content}</div>`
  )
}

const previewHtml = computed(() => {
  const md = activeLocale.value === 'zh' ? props.zh.body_md : props.en.body_md
  return marked(preprocessMarkdown(md)) as string
})

const categories = ['javascript', 'vue', 'css', 'typescript', 'react', 'web-vitals', 'browser', 'http']
const difficulties = ['basic', 'intermediate', 'advanced']

function updateZhTitle(e: Event) {
  emit('update:zh', { ...props.zh, title: (e.target as HTMLInputElement).value })
}
function updateEnTitle(e: Event) {
  emit('update:en', { ...props.en, title: (e.target as HTMLInputElement).value })
}
function updateBody(e: Event) {
  const val = (e.target as HTMLTextAreaElement).value
  if (activeLocale.value === 'zh') {
    emit('update:zh', { ...props.zh, body_md: val })
  } else {
    emit('update:en', { ...props.en, body_md: val })
  }
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Metadata row -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div>
        <label class="text-xs font-medium text-slate-500 block mb-1">
          Slug <span class="text-slate-300">(auto-generated on create)</span>
        </label>
        <input
          :value="slug"
          @input="emit('update:slug', ($event.target as HTMLInputElement).value)"
          :readonly="!isNew"
          :class="[
            'w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400',
            isNew ? 'border-slate-200' : 'border-slate-100 bg-slate-50 text-slate-400 cursor-default'
          ]"
          placeholder="event-loop"
        />
      </div>
      <div>
        <label class="text-xs font-medium text-slate-500 block mb-1">Category *</label>
        <select
          :value="category"
          @change="emit('update:category', ($event.target as HTMLSelectElement).value)"
          class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="" disabled>Select…</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <div>
        <label class="text-xs font-medium text-slate-500 block mb-1">Difficulty *</label>
        <select
          :value="difficulty"
          @change="emit('update:difficulty', ($event.target as HTMLSelectElement).value)"
          class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="" disabled>Select…</option>
          <option v-for="d in difficulties" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>
      <div>
        <label class="text-xs font-medium text-slate-500 block mb-1">Tags (comma-separated)</label>
        <input
          :value="tags"
          @input="emit('update:tags', ($event.target as HTMLInputElement).value)"
          placeholder="javascript, async"
          class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
    </div>

    <!-- Title row -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="text-xs font-medium text-slate-500 block mb-1">ZH Title *</label>
        <input
          :value="zh.title"
          @input="updateZhTitle"
          placeholder="什麼是 Event Loop？"
          class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
      <div>
        <label class="text-xs font-medium text-slate-500 block mb-1">EN Title *</label>
        <input
          :value="en.title"
          @input="updateEnTitle"
          placeholder="What is the Event Loop?"
          class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
    </div>

    <!-- Locale tabs -->
    <div class="flex gap-0 border-b border-slate-200">
      <button
        v-for="loc in ['zh', 'en']"
        :key="loc"
        @click="activeLocale = loc as 'zh' | 'en'"
        :class="[
          'px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
          activeLocale === loc
            ? 'border-indigo-500 text-indigo-600'
            : 'border-transparent text-slate-400 hover:text-slate-600'
        ]"
      >
        {{ loc.toUpperCase() }}
      </button>
    </div>

    <!-- Split-view editor -->
    <div class="grid grid-cols-2 border border-slate-200 rounded-xl overflow-hidden" style="height: 440px">
      <!-- Markdown input -->
      <textarea
        :value="activeLocale === 'zh' ? zh.body_md : en.body_md"
        @input="updateBody"
        class="w-full h-full px-5 py-4 text-sm font-mono bg-white border-r border-slate-200 focus:outline-none resize-none leading-relaxed text-slate-700 placeholder:text-slate-300"
        :placeholder="activeLocale === 'zh' ? '請用 Markdown 撰寫中文內容…' : 'Write Markdown content in English…'"
      />
      <!-- Live preview -->
      <div
        class="h-full overflow-y-auto px-5 py-4 prose prose-sm prose-slate max-w-none bg-slate-50"
        v-html="previewHtml"
      />
    </div>

    <!-- Action bar -->
    <div class="flex items-center justify-between pt-2">
      <button
        @click="emit('cancel')"
        class="text-sm text-slate-400 hover:text-slate-600 transition-colors"
      >
        Cancel
      </button>
      <button
        @click="emit('save')"
        class="bg-indigo-500 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-indigo-600 transition-colors"
      >
        Save Question
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/MarkdownEditor.vue
git commit -m "feat: add split-view MarkdownEditor component for admin"
```

---

## Task 10: New Question Page

**Files:**
- Create: `pages/admin/questions/new.vue`

- [ ] **Step 1: Create `pages/admin/questions/new.vue`**

```vue
<!-- pages/admin/questions/new.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const slug       = ref('')
const category   = ref('')
const difficulty = ref('')
const tagsStr    = ref('')
const zh         = ref({ title: '', body_md: '' })
const en         = ref({ title: '', body_md: '' })
const error      = ref('')
const saving     = ref(false)

// Auto-generate slug from zh title (only while slug is still empty)
watch(() => zh.value.title, (title) => {
  if (!slug.value) {
    slug.value = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
  }
})

async function save() {
  if (!slug.value || !zh.value.title || !en.value.title || !category.value || !difficulty.value) {
    error.value = 'Please fill in slug, both titles, category, and difficulty'
    return
  }
  saving.value = true
  error.value  = ''
  try {
    await $fetch('/api/admin/questions', {
      method: 'POST',
      body: {
        slug:       slug.value,
        category:   category.value,
        difficulty: difficulty.value,
        tags:       tagsStr.value.split(',').map(s => s.trim()).filter(Boolean),
        zh:         zh.value,
        en:         en.value,
      },
    })
    await navigateTo('/admin/questions')
  } catch (err: any) {
    error.value   = err?.data?.message ?? 'Save failed. Please try again.'
    saving.value  = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/admin/questions" class="text-sm text-slate-400 hover:text-indigo-500 transition-colors">
        ← Questions
      </NuxtLink>
      <span class="text-slate-300">/</span>
      <h1 class="text-xl font-bold text-slate-800">New Question</h1>
    </div>

    <div
      v-if="error"
      class="mb-5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
    >
      {{ error }}
    </div>

    <MarkdownEditor
      :slug="slug"
      :category="category"
      :difficulty="difficulty"
      :tags="tagsStr"
      :zh="zh"
      :en="en"
      :is-new="true"
      @update:slug="slug = $event"
      @update:category="category = $event"
      @update:difficulty="difficulty = $event"
      @update:tags="tagsStr = $event"
      @update:zh="zh = $event"
      @update:en="en = $event"
      @save="save"
      @cancel="navigateTo('/admin/questions')"
    />
  </div>
</template>
```

- [ ] **Step 2: Verify create flow in browser**

Navigate to `/admin/questions/new`. Verify:
- Typing a zh title auto-fills the slug field
- Switching ZH/EN tabs switches the textarea content
- Markdown typed in textarea appears rendered in right panel
- Callout block (`::callout\ntext\n::`) renders with indigo left border in preview
- Submit without filling all required fields → error message appears
- Fill all fields and click Save → redirects to `/admin/questions` with new question listed
- Navigate to the public question page at `/zh/questions/{new-slug}` — new question shows correctly

- [ ] **Step 3: Commit**

```bash
git add pages/admin/questions/new.vue
git commit -m "feat: add new question creation page"
```

---

## Task 11: Edit Question Page

**Files:**
- Create: `pages/admin/questions/[id]/edit.vue`

- [ ] **Step 1: Create `pages/admin/questions/[id]/edit.vue`**

```vue
<!-- pages/admin/questions/[id]/edit.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const route = useRoute()
const id    = route.params.id as string

const { data: question } = await useAsyncData(
  `admin-question-${id}`,
  () => $fetch<any>(`/api/admin/questions/${id}`)
)

if (!question.value) {
  throw createError({ statusCode: 404, statusMessage: 'Question not found' })
}

const slug       = ref(question.value.slug)
const category   = ref(question.value.category)
const difficulty = ref(question.value.difficulty)
const tagsStr    = ref((question.value.tags as string[]).join(', '))

const zhTrans = question.value.translations.find((t: any) => t.locale === 'zh') ?? { title: '', body_md: '' }
const enTrans = question.value.translations.find((t: any) => t.locale === 'en') ?? { title: '', body_md: '' }

const zh = ref({ title: zhTrans.title, body_md: zhTrans.body_md })
const en = ref({ title: enTrans.title, body_md: enTrans.body_md })

const error  = ref('')
const saving = ref(false)

async function save() {
  if (!zh.value.title || !en.value.title || !category.value || !difficulty.value) {
    error.value = 'Please fill in both titles, category, and difficulty'
    return
  }
  saving.value = true
  error.value  = ''
  try {
    await $fetch(`/api/admin/questions/${id}`, {
      method: 'PUT',
      body: {
        category:   category.value,
        difficulty: difficulty.value,
        tags:       tagsStr.value.split(',').map(s => s.trim()).filter(Boolean),
        zh:         zh.value,
        en:         en.value,
      },
    })
    await navigateTo('/admin/questions')
  } catch (err: any) {
    error.value  = err?.data?.message ?? 'Save failed. Please try again.'
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/admin/questions" class="text-sm text-slate-400 hover:text-indigo-500 transition-colors">
        ← Questions
      </NuxtLink>
      <span class="text-slate-300">/</span>
      <h1 class="text-xl font-bold text-slate-800">Edit: {{ slug }}</h1>
    </div>

    <div
      v-if="error"
      class="mb-5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
    >
      {{ error }}
    </div>

    <MarkdownEditor
      :slug="slug"
      :category="category"
      :difficulty="difficulty"
      :tags="tagsStr"
      :zh="zh"
      :en="en"
      :is-new="false"
      @update:slug="slug = $event"
      @update:category="category = $event"
      @update:difficulty="difficulty = $event"
      @update:tags="tagsStr = $event"
      @update:zh="zh = $event"
      @update:en="en = $event"
      @save="save"
      @cancel="navigateTo('/admin/questions')"
    />
  </div>
</template>
```

- [ ] **Step 2: Verify edit flow in browser**

From `/admin/questions`, click Edit on any row. Verify:
- Editor loads with existing content pre-filled (slug, category, difficulty, tags, titles, body)
- Slug field is read-only (grey background)
- Editing zh title and saving reflects on the public `/zh/questions/{slug}` page
- Switching EN tab shows the English content
- Saving updated EN body reflects on `/en/questions/{slug}`

- [ ] **Step 3: Commit**

```bash
git add pages/admin/questions/
git commit -m "feat: add edit question page"
```

---

## Task 12: Remove @nuxt/content

**Files:**
- Modify: `nuxt.config.ts`

- [ ] **Step 1: Remove @nuxt/content from `nuxt.config.ts`**

In `nuxt.config.ts`, remove `'@nuxt/content'` from the `modules` array and remove the `content: { ... }` config block:

```typescript
// BEFORE:
modules: [
  '@nuxtjs/supabase',
  '@nuxt/content',   // ← remove this line
  '@nuxtjs/i18n',
  '@nuxtjs/sitemap',
],

// ... and remove the entire content: { build: { ... } } block
```

```typescript
// AFTER:
modules: [
  '@nuxtjs/supabase',
  '@nuxtjs/i18n',
  '@nuxtjs/sitemap',
],
```

- [ ] **Step 2: Uninstall @nuxt/content**

```bash
npm uninstall @nuxt/content better-sqlite3
```

(`better-sqlite3` was a peer dependency of @nuxt/content's local DB used in dev mode.)

- [ ] **Step 3: Restart dev server and verify**

```bash
npm run dev
```

Expected: dev server starts without errors. No `@nuxt/content` warnings.

Navigate to:
- `/zh/` — homepage loads, hot questions visible
- `/zh/questions` — question list loads
- `/zh/questions/event-loop` — detail page loads with Markdown rendered
- `/admin/questions` — admin list still works

- [ ] **Step 4: Commit**

```bash
git add nuxt.config.ts package.json package-lock.json
git commit -m "chore: remove @nuxt/content, migrate fully to Supabase"
```

---

## Acceptance Checklist

Run through these manually before declaring the feature complete:

- [ ] Unauthenticated visit to `/admin/questions` → redirect to `/admin/login`
- [ ] Wrong credentials → "Invalid credentials" error shown
- [ ] Correct credentials → redirect to `/admin/questions`
- [ ] All 8 migrated questions visible in list
- [ ] Search and category filter work
- [ ] Create new question (both locales) → appears in list AND on public question page
- [ ] Edit existing question → changes visible on public question page
- [ ] Delete question → removed from list; public page returns 404
- [ ] Sign out → redirects to login; subsequent visit to `/admin/questions` redirects back
- [ ] `/zh/questions/event-loop` — renders Markdown correctly (headings, code blocks, table, callout)
- [ ] `/en/questions/event-loop` — renders English content
- [ ] TOC sidebar visible on desktop with correct anchor links
- [ ] Homepage hot questions load from Supabase
- [ ] Questions list page loads from Supabase
- [ ] No @nuxt/content errors in console
