import { test, expect } from '@playwright/test';

// This suite submits real forms. It is gated behind VITE_FIREBASE_EMULATOR=1
// so it can only run against local emulators (the app under test must have
// been built with the same flag) and can never write to the production
// Firestore project. Run with:
//   VITE_FIREBASE_EMULATOR=1 npm run build:ssr
//   firebase emulators:exec --only firestore,auth "npm run test:e2e"
test.describe('Public Contact Form Submission', () => {
  test.skip(!process.env.VITE_FIREBASE_EMULATOR, 'Set VITE_FIREBASE_EMULATOR=1 to run form tests against local emulators');

  const testName = `Test Visitor ${Date.now()}`;
  const testEmail = `test${Date.now()}@example.com`;

  test('should submit Contact form and show success modal', async ({ page }) => {
    // The "Get In Touch With Us" form lives in the home page's contact section
    await page.goto('/');

    await page.fill('input[placeholder="Your name"]', testName);
    await page.fill('input[placeholder="Your email"]', testEmail);
    await page.fill('textarea[placeholder="Write message"]', 'Automated smoke test submission from the Playwright suite.');

    await page.getByRole('button', { name: /Send Message/i }).click();

    // Success modal appears
    await expect(page.getByText('Message Sent!')).toBeVisible({ timeout: 10000 });
  });
});