import { test, expect } from '@playwright/test';

const SUFFIX = Date.now().toString(36);
const EMAIL = `portal-test-${SUFFIX}@example.com`;
const PASSWORD = 'TestPass123!';

test('Member portal full chain: signup -> PIN capture -> portal -> lock -> PIN login', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));

  await page.goto('/#member-dashboard');
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: /Sign In to Member Portal/i }).click();
  await page.waitForTimeout(800);

  // Switch to sign-up mode
  await page.getByRole('button', { name: /Sign up/i }).click();
  await page.waitForTimeout(300);

  await page.getByPlaceholder('John').fill('Portal');
  await page.getByPlaceholder('Doe').fill('Test');
  await page.getByPlaceholder('you@example.com').fill(EMAIL);
  await page.getByPlaceholder('••••••••').fill(PASSWORD);

  await page.getByRole('button', { name: /Sign Up/i }).click();

  // Wait for success message containing the PIN
  const successText = await page.locator('body').textContent();
  const pinMatch = successText?.match(/Security PIN is (\d{4})/);
  console.log('SUCCESS MSG PIN:', pinMatch ? pinMatch[1] : 'NONE FOUND');
  console.log('SUCCESS MSG:', successText?.slice(0, 600));

  await page.waitForTimeout(5500);

  // Click Open Portal (user is now authenticated)
  await page.getByRole('button', { name: /Open Portal/i }).click();
  await page.waitForTimeout(2500);

  const portalText = await page.locator('body').textContent();
  console.log('PORTAL HAS DASHBOARD:', portalText?.includes('Member Dashboard') || portalText?.includes('OFFICIAL MEMBER ID'));
  console.log('PORTAL SHOWS AUTH GATE:', portalText?.includes('Member Authentication'));

  // If portal opened, lock profile and try PIN login
  if (pinMatch) {
    const lockBtn = page.getByRole('button', { name: /Lock Profile/i });
    if (await lockBtn.count()) {
      await lockBtn.click();
      await page.waitForTimeout(1000);
      const gateText = await page.locator('body').textContent();
      console.log('AFTER LOCK SHOWS AUTH GATE:', gateText?.includes('Member Authentication'));

      // Try the captured PIN
      const idInput = page.locator('input[placeholder*="Member Email"], input[placeholder*="ID"], input[type="text"]').first();
      await idInput.fill(EMAIL);
      const pinInput = page.locator('input[inputmode="numeric"], input[type="password"]').first();
      await pinInput.fill(pinMatch[1]);
      await page.getByRole('button', { name: /Unlock|Sign In|Verify/i }).first().click();
      await page.waitForTimeout(2500);
      const afterPin = await page.locator('body').textContent();
      console.log('PIN LOGIN SUCCESS:', afterPin?.includes('OFFICIAL MEMBER ID'));
      console.log('PIN LOGIN ERROR:', afterPin?.match(/(Incorrect Security PIN|Member profile not found|Too many PIN attempts)[^<]*/)?.[0] || 'none');
    }
  }

  console.log('CONSOLE ERRORS:', JSON.stringify(consoleErrors, null, 2));
});