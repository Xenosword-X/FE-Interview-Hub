# Sub-project 4: Admin Dashboard Design

## Overview

A password-protected admin panel for managing interview questions with full CRUD support.
Questions are stored in Supabase (migrated from @nuxt/content Markdown files) and displayed
via a split-view Markdown editor that edits Chinese and English content simultaneously.

---

## Section 1: Architecture

### Approach

Nuxt pages with a Nitro server middleware guard — no third-party admin framework, no separate app.

### Routes

| Path | Purpose |
|---|---|
| `/admin` | Redirect → `/admin/login` (if unauth) or `/admin/questions` (if auth) |
| `/admin/login` | Login form (BACKEND_ACCOUNT / BACKEND_PASSWORD) |
| `/admin/questions` | Question list with search + filter |
| `/admin/questions/new` | Create new question (both locales) |
| `/admin/questions/[id]/edit` | Edit existing question |

### Auth Flow

1. User submits `/admin/login` form
2. Nitro validates credentials against `BACKEND_ACCOUNT` / `BACKEND_PASSWORD` env vars
3. On success: `useSession` (H3) sets encrypted cookie (`SESSION_SECRET` env var)
4. `server/middleware/admin-auth.ts` intercepts every `/admin/**` request:
   - API routes (`/api/admin/**`) → return 401 JSON if no valid session
   - Page routes (`/admin/**`) → return 302 redirect to `/admin/login`
5. Logout: POST `/api/admin/logout` clears the session cookie

### API Routes

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/admin/login` | Validate credentials, set session |
| POST | `/api/admin/logout` | Clear session |
| GET | `/api/admin/questions` | List all questions (with translations) |
| POST | `/api/admin/questions` | Create question + translations |
| GET | `/api/admin/questions/[id]` | Fetch single question + translations |
| PUT | `/api/admin/questions/[id]` | Update question + translations |
| DELETE | `/api/admin/questions/[id]` | Delete question + translations |

All `/api/admin/**` routes use `serverSupabaseServiceRole` from `#supabase/server`.

---

## Section 2: Data Layer

### Supabase Tables

#### `questions`

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

#### `translations`

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

### Public API Route (frontend)

Replace `queryCollection('questions')` with a new public endpoint:

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/questions` | Returns published questions with translations |

Query params: `locale` (required), `slug` (optional, for single question detail).

### RLS

- `questions` table: public SELECT on `is_published = true`, no public INSERT/UPDATE/DELETE
- `translations` table: public SELECT when joined with published questions, no public mutations
- All admin mutations use service role key (bypasses RLS)

### Migration Script

`scripts/migrate-questions.ts` — one-time script:

1. Reads all 8 zh + 8 en Markdown files from `content/{zh,en}/questions/**/*.md`
2. Parses frontmatter (slug, category, difficulty, tags) from zh files as source of truth
3. Upserts into `questions` table
4. Upserts into `translations` table (locale: zh, then en)
5. Logs success/failure per question
6. Run via: `npx tsx scripts/migrate-questions.ts`

---

## Section 3: Admin UI

### Login Page (`/admin/login`)

- Centered card, minimal design matching site aesthetic
- Email + password inputs
- Error message on invalid credentials
- On success: redirect to `/admin/questions`
- No "forgot password" — env-based credentials only

### Question List (`/admin/questions`)

- Table: Slug | Category | Difficulty | Published | Actions (Edit / Delete)
- Search by slug or title (client-side filter)
- Filter by category dropdown
- "New Question" button → `/admin/questions/new`
- Delete: inline confirm dialog ("Are you sure?") before API call
- No pagination for now (expected < 100 questions)

### Split-View Editor (`/admin/questions/new` and `[id]/edit`)

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  Metadata row: [Slug] [Category ▾] [Difficulty ▾] [Tags]│
├───────────────────────┬─────────────────────────────────┤
│  ZH Title             │  EN Title                       │
├───────────────────────┴─────────────────────────────────┤
│  ZH │ EN (tab selector)                                  │
├───────────────────────┬─────────────────────────────────┤
│  Markdown textarea    │  Live preview                    │
│  (selected locale)    │  (renders Markdown)              │
└───────────────────────┴─────────────────────────────────┘
│  [Cancel]                              [Save Question]   │
└─────────────────────────────────────────────────────────┘
```

**Behaviour:**

- Slug field: auto-generated from zh title (kebab-case) on create, editable, readonly on edit
- Both zh and en titles are required before saving
- Markdown body: tab toggles which locale's content is shown in the textarea/preview
- Live preview renders Markdown to HTML client-side using the `marked` npm package
- Save: single POST/PUT with `{ slug, category, difficulty, tags, zh: { title, body_md }, en: { title, body_md } }`
- Validation: slug non-empty, both titles non-empty, category and difficulty selected

### i18n

Admin UI is English-only. No i18n keys needed for admin pages.

---

## Section 4: Frontend Migration

Replace all `@nuxt/content` calls with Supabase-backed API calls.

### Files to update

| File | Change |
|---|---|
| `pages/questions/[slug].vue` | Replace `queryCollection('questions')` with `$fetch('/api/questions?locale=...&slug=...')` |
| `pages/questions/index.vue` | Replace with `$fetch('/api/questions?locale=...')` |
| `pages/index.vue` (homepage) | Same — replace content queries with `/api/questions` |
| `nuxt.config.ts` | Remove `@nuxt/content` module after migration |
| `content/` directory | Keep during migration, delete after verification |

### New public API: `/api/questions`

Returns shape:

```ts
interface QuestionItem {
  id: string
  slug: string
  category: string
  difficulty: string
  tags: string[]
  title: string     // from translations for requested locale
  body_md: string   // from translations for requested locale
}
```

Single question (with `?slug=`) returns the same shape but as a single object (404 if not found).

---

## Section 5: Environment Variables

Add to `.env`:

```
BACKEND_ACCOUNT=your-admin-email
BACKEND_PASSWORD=your-admin-password
SESSION_SECRET=32-char-random-string
```

`SESSION_SECRET` must be at least 32 characters. Used by H3 `useSession` to encrypt the cookie.

---

## Section 6: Error Handling & Edge Cases

- **Slug conflict on create**: API returns 409, editor shows "Slug already in use"
- **Delete with existing practice_logs**: Cascade delete is on `translations` only. `practice_logs` references `question_slug` (text), so deletion is safe — orphaned logs remain but don't break anything
- **Migration re-run**: Upsert (on conflict slug) so re-running is idempotent
- **Session expiry**: H3 useSession default TTL is 600s — set to 86400s (24h) via session config
- **Missing translation**: Public API returns 404 if no translation for requested locale

---

## Section 7: Testing Checklist

Manual acceptance criteria:

- [ ] Unauthenticated access to `/admin/questions` redirects to `/admin/login`
- [ ] Wrong credentials show error message
- [ ] Correct credentials redirect to question list
- [ ] Question list shows all questions from Supabase
- [ ] Create new question with both locales — appears in list and on public question page
- [ ] Edit existing question — changes reflected on public question page
- [ ] Delete question — removed from list and public site returns 404
- [ ] Migration script inserts all 8 questions correctly
- [ ] Public question pages (zh + en) load from Supabase after migration
- [ ] Homepage and questions index page load from Supabase after migration
- [ ] Session persists across page refresh (24h TTL)
- [ ] Logout clears session and redirects to login

---

## Out of Scope

- Image/media upload
- Question versioning / history
- Draft/preview before publish (is_published toggle is sufficient)
- Multiple admin users
- Analytics or usage stats in admin
