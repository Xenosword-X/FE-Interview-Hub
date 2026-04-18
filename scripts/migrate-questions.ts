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

const SUPABASE_URL = process.env.NUXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NUXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env')
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

  try {
    const zhRaw = readFileSync(zhPath, 'utf-8')
    const { data: zhMeta, body: zhBody } = parseFrontmatter(zhRaw)
    const { data: enMeta, body: enBody } = parseFrontmatter(enRaw)

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
    console.error(`✗ ${relPath}: ${(err as Error).message}`)
    failed++
  }
}

console.log(`\nMigration complete: ${success} succeeded, ${failed} failed`)
