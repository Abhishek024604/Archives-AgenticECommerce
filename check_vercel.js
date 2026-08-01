const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });
  
  try {
    await page.goto('https://archives-agentic-e-commerce.vercel.app/', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.screenshot({ path: 'C:/Users/Lenovo/.gemini/antigravity-ide/brain/1905eab2-2bb6-4cad-b493-300365e1be3b/vercel_preview.png', fullPage: true });
    console.log('Screenshot saved!');
  } catch (err) {
    console.error('Error navigating:', err);
  }
  
  await browser.close();
})();
