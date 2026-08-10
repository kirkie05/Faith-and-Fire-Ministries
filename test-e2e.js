import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto('http://localhost:3003', { waitUntil: 'networkidle2' });
    
    // Check if the page loaded by verifying some text
    const text = await page.evaluate(() => document.body.innerText);
    
    if (text.length > 50) {
      console.log('SUCCESS: Page loaded successfully. Text length:', text.length);
      console.log('Sample text:', text.substring(0, 100));
    } else {
      console.error('ERROR: Page appears empty or crashed.');
      process.exit(1);
    }
    
    await browser.close();
  } catch (err) {
    console.error('Failed to run puppeteer:', err);
    process.exit(1);
  }
})();
