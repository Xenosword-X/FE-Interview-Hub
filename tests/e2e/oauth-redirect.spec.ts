/**
 * tests/e2e/oauth-redirect.spec.ts
 *
 * 驗證 Google OAuth 登入時的 redirectTo 是否正確指向 localhost:3000/zh/auth/callback
 * 不會真的登入 Google，只攔截送往 Supabase authorize 的 request 並檢查 redirect_to 參數。
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'
const EXPECTED_REDIRECT_TO = `${BASE_URL}/zh/auth/callback`

test.describe('Google OAuth redirectTo 驗證', () => {
  test('點擊「使用 Google 登入」後，redirect_to 應指向 localhost:3000/zh/auth/callback', async ({
    page,
    context,
  }) => {
    // ── Step 1: 攔截所有前往 Supabase authorize 的請求並中止，避免跳去 Google ──
    let capturedRedirectTo: string | null = null
    let capturedAuthorizeUrl: string | null = null

    await page.route('**supabase.co/auth/v1/authorize**', async (route) => {
      const url = route.request().url()
      capturedAuthorizeUrl = url

      const parsed = new URL(url)
      const rawRedirectTo = parsed.searchParams.get('redirect_to')
      capturedRedirectTo = rawRedirectTo ? decodeURIComponent(rawRedirectTo) : null

      // 中止請求，不讓瀏覽器真的跳到 Google
      await route.abort('aborted')
    })

    // 也攔截可能的 accounts.google.com 跳轉（保險用）
    await page.route('**accounts.google.com**', async (route) => {
      await route.abort('aborted')
    })

    // ── Step 2: 前往有 LoginButton 的頁面（question slug 頁，未登入會顯示 AiPractice 登入卡片）──
    await page.goto(`${BASE_URL}/zh/questions/box-model`, {
      waitUntil: 'networkidle',
    })

    // 截圖：初始頁面狀態
    await page.screenshot({
      path: 'tests/e2e/screenshots/before-click.png',
      fullPage: true,
    })

    // ── Step 3: 確認登入卡片可見（鎖定 AiPractice 區塊 #ai-practice 裡的按鈕，避免 Navbar 的重複元素觸發 strict mode violation）──
    const aiPracticeSection = page.locator('#ai-practice')
    await expect(aiPracticeSection).toBeVisible({ timeout: 10_000 })
    const loginButton = aiPracticeSection.getByRole('button', { name: /google/i })
    await expect(loginButton).toBeVisible({ timeout: 10_000 })

    // ── Step 4: 等待攔截到的 authorize request ──
    const [authorizeRequest] = await Promise.all([
      page.waitForRequest((req) => req.url().includes('supabase.co/auth/v1/authorize'), {
        timeout: 10_000,
      }).catch(() => null),
      loginButton.click(),
    ])

    // 如果 waitForRequest 先拿到 null（route abort 造成），改用已記錄的 capturedAuthorizeUrl
    const finalUrl = authorizeRequest?.url() ?? capturedAuthorizeUrl

    // 截圖：點擊後頁面狀態（應仍停在原頁或顯示錯誤，不會跳到 Google）
    await page.screenshot({
      path: 'tests/e2e/screenshots/after-click.png',
      fullPage: true,
    })

    // ── Step 5: 驗證 ──
    console.log('\n========== OAuth 驗證結果 ==========')
    console.log('攔截到的 authorize URL:', finalUrl)
    console.log('解碼後的 redirect_to  :', capturedRedirectTo)
    console.log('預期的 redirect_to    :', EXPECTED_REDIRECT_TO)
    console.log('驗證結果              :', capturedRedirectTo === EXPECTED_REDIRECT_TO ? '✓ 正確' : '✗ 不符')
    console.log('=====================================\n')

    // 確認有攔截到 authorize 請求
    expect(finalUrl, '未攔截到 Supabase authorize 請求').not.toBeNull()

    // 確認 redirect_to 存在
    expect(capturedRedirectTo, 'authorize URL 中沒有 redirect_to 參數').not.toBeNull()

    // 核心斷言：redirect_to 必須是 http://localhost:3000/zh/auth/callback
    expect(capturedRedirectTo).toBe(EXPECTED_REDIRECT_TO)
  })

  test('也驗證 Navbar 的登入按鈕（AppNavbar）redirect_to 一致', async ({ page }) => {
    let capturedRedirectTo: string | null = null

    await page.route('**supabase.co/auth/v1/authorize**', async (route) => {
      const url = route.request().url()
      const parsed = new URL(url)
      const raw = parsed.searchParams.get('redirect_to')
      capturedRedirectTo = raw ? decodeURIComponent(raw) : null
      await route.abort('aborted')
    })

    await page.route('**accounts.google.com**', async (route) => {
      await route.abort('aborted')
    })

    // 前往 questions index 頁（Navbar 會顯示登入按鈕）
    await page.goto(`${BASE_URL}/zh/questions`, { waitUntil: 'networkidle' })

    // Navbar 的登入按鈕
    const navLoginBtn = page.getByRole('button', { name: /google/i }).first()
    const isNavBtnVisible = await navLoginBtn.isVisible().catch(() => false)

    if (!isNavBtnVisible) {
      test.skip()
      return
    }

    const [_req] = await Promise.all([
      page
        .waitForRequest((req) => req.url().includes('supabase.co/auth/v1/authorize'), {
          timeout: 10_000,
        })
        .catch(() => null),
      navLoginBtn.click(),
    ])

    console.log('\n========== Navbar OAuth 驗證結果 ==========')
    console.log('解碼後的 redirect_to:', capturedRedirectTo)
    console.log('預期的 redirect_to  :', EXPECTED_REDIRECT_TO)
    console.log('==========================================\n')

    expect(capturedRedirectTo).toBe(EXPECTED_REDIRECT_TO)
  })
})
