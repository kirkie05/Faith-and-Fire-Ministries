import { test, expect } from '@playwright/test';

const SUFFIX = Date.now().toString(36);
const EMAIL = `returning-${SUFFIX}@example.com`;
const PASSWORD = 'TestPass123!';

test('Returning member after reload: identity resolution and PIN login', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (msg) => { if (['error', 'warning'].includes(msg.type())) logs.push(msg.type() + ': ' + msg.text()); });
  page.on('pageerror', (err) => logs.push('PAGEERROR: ' + err.message));
  test.setTimeout(90000);

  // --- Step 1: Sign up ---
  await page.goto('/#member-dashboard');
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: /Sign In to Member Portal/i }).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /Sign up/i }).click();
  await page.waitForTimeout(300);
  await page.getByPlaceholder('John').fill('Returning');
  await page.getByPlaceholder('Doe').fill('Member');
  await page.getByPlaceholder('you@example.com').fill(EMAIL);
  await page.getByPlaceholder('••••••••').fill(PASSWORD);
  await page.getByRole('button', { name: /Sign Up/i }).click();
  await page.waitForTimeout(7000);

  let body = await page.locator('body').textContent() || '';
  const pinMatch = body.match(/Security PIN is (\d{4})/);
  console.log('PIN FROM SIGNUP:', pinMatch ? pinMatch[1] : 'NONE');
  const pin = pinMatch ? pinMatch[1] : '0000';

  // --- Step 2: Simulate returning member — full reload ---
  await page.reload();
  await page.waitForTimeout(3000);
  body = await page.locator('body').textContent() || '';
  console.log('AFTER RELOAD — AUTH GATE SHOWN:', body.includes('Member Authentication'));
  console.log('AFTER RELOAD — DASHBOARD UNLOCKED:', body.includes('OFFICIAL MEMBER ID'));

  // --- Step 3: Sign in with email/password ---
  if (body.includes('Member Authentication')) {
    await page.getByRole('button', { name: /Sign In to Member Portal/i }).click();
    await page.waitForTimeout(800);
    await page.getByPlaceholder('you@example.com').fill(EMAIL);
    await page.getByPlaceholder('••••••••').fill(PASSWORD);
    await page.getByRole('button', { name: /^Sign In$/i }).click();
    await page.waitForTimeout(6000);
    body = await page.locator('body').textContent() || '';
    console.log('AFTER EMAIL LOGIN — AUTH GATE SHOWN:', body.includes('Member Authentication'));
    console.log('AFTER EMAIL LOGIN — DASHBOARD UNLOCKED:', body.includes('OFFICIAL MEMBER ID'));
    if (body.includes('Member Authentication')) {
      console.log('LOGIN ERROR TEXT:', body.match(/(Invalid email|Failed to sign in|error[^<]*)/i)?.[0] || 'none');
      // Try PIN login on the auth gate
      const gateText = body;
      console.log('GATE HAS PIN FORM:', gateText.includes('Security PIN'));
    }
  }

  console.log('LOGS:', JSON.stringify(logs, null, 2));
});