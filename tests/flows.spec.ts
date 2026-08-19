import { test, expect } from '@playwright/test';

test.describe('Public application flows (hash-routed)', () => {
  test('Home page renders hero with church branding', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toContainText(/Faith & Fire/i, { timeout: 10000 });
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
    const viteErrorOverlay = await page.locator('vite-error-overlay').count();
    expect(viteErrorOverlay).toBe(0);
  });

  test('Giving page renders the donation flow', async ({ page }) => {
    await page.goto('/#give');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toContainText(/Give|Donate|Offering/i, { timeout: 10000 });
    const viteErrorOverlay = await page.locator('vite-error-overlay').count();
    expect(viteErrorOverlay).toBe(0);
  });

  test('Sermons page renders the media screen', async ({ page }) => {
    await page.goto('/#sermons');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toContainText(/Sermon|Media|Video/i, { timeout: 10000 });
    const viteErrorOverlay = await page.locator('vite-error-overlay').count();
    expect(viteErrorOverlay).toBe(0);
  });

  test('Guest check-in screen renders the visitor form', async ({ page }) => {
    await page.goto('/#guest-check-in');
    await page.waitForTimeout(1500);
    await expect(page.getByRole('heading', { name: /GUEST QR CHECK-IN/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  });

  test('Member service QR check-in screen renders', async ({ page }) => {
    await page.goto('/#check-in');
    await page.waitForTimeout(1500);
    await expect(page.getByRole('heading', { name: /SERVICE QR CHECK-IN/i })).toBeVisible({ timeout: 10000 });
  });

  test('Join-us page renders the visitor registration flow', async ({ page }) => {
    await page.goto('/#visitor-card');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toContainText(/Welcome|Visitor|Visit/i, { timeout: 10000 });
    const viteErrorOverlay = await page.locator('vite-error-overlay').count();
    expect(viteErrorOverlay).toBe(0);
  });

  test('Anonymous user cannot reach the admin dashboard (gate shown, no dashboard)', async ({ page }) => {
    await page.goto('/#admin');
    // Wait for the auth state to resolve out of the "Verifying secure access…" spinner.
    await expect(page.locator('body')).toContainText('Administrator access required', { timeout: 15000 });
    const bodyText = await page.locator('body').textContent();
    // The admin gate must render a sign-in prompt, not member counts / dashboard stats.
    expect(bodyText).not.toContain('Members Overview');
    const viteErrorOverlay = await page.locator('vite-error-overlay').count();
    expect(viteErrorOverlay).toBe(0);
  });
});