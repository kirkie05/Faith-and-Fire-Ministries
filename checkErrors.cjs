const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });

    await page.goto('http://localhost:3003', { waitUntil: 'networkidle0', timeout: 5000 });
  } catch (e) {
    console.log('Navigation timeout or error:', e.message);
  }

  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
