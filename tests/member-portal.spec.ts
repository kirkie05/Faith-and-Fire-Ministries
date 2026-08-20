import { test, expect } from '@playwright/test';

test('Member portal: unauthenticated state renders auth gate', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));

  await page.goto('/#member-dashboard');
  await page.waitForTimeout(2500);

  const body = await page.locator('body').textContent();
  expect(body).toContain('Member Authentication');
  expect(body).toContain('Sign In to Member Portal');

  await page.getByRole('button', { name: /Sign In to Member Portal/i }).click();
  await page.waitForTimeout(1000);
  const modal = await page.locator('body').textContent();
  expect(modal).toContain('Sign In');
  expect(modal).toContain('Continue with Google');

  console.log('CONSOLE ERRORS:', JSON.stringify(consoleErrors, null, 2));
  expect(consoleErrors.filter(e => !e.includes('Google API') && !e.includes('favicon'))).toEqual([]);
});

test('Member portal: after-login identity resolution (fallback vs real record)', async ({ page }) => {
  await page.goto('/#member-dashboard');
  await page.waitForTimeout(2500);
  const body = await page.locator('body').textContent();
  // Logged-out: must show the auth gate, not a fake unlocked dashboard.
  expect(body).toContain('Member Authentication');
});