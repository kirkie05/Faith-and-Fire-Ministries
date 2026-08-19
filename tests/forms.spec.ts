import { test, expect } from '@playwright/test';

test.describe('Public Contact Form Submission', () => {
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