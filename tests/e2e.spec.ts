import { test, expect } from '@playwright/test';

test('App should load without crashing (No white screen)', async ({ page }) => {
  // Navigate to the app (baseURL from playwright.config.ts)
  await page.goto('/');

  // Wait for the app to initialize
  await page.waitForTimeout(2000);

  // Check if we are on a login screen or dashboard
  // We look for any text that indicates successful rendering, like "Sign In", "Faith & Fire", etc.
  const bodyText = await page.locator('body').textContent();

  // Basic assertion that the page is not completely blank or showing a Vite error
  expect(bodyText?.length).toBeGreaterThan(50);

  // Try to find the title or a heading
  const hasHeading = await page.locator('h1, h2, h3').count();
  expect(hasHeading).toBeGreaterThan(0);

  // If there's an error overlay (like Vite's red error overlay), fail the test
  const viteErrorOverlay = await page.locator('vite-error-overlay').count();
  expect(viteErrorOverlay).toBe(0);

  // SSR serves dynamic per-route titles
  const title = await page.title();
  expect(title.length).toBeGreaterThan(10);
});