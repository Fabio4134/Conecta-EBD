import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => console.log('LOG:', msg.text()));
    page.on('pageerror', err => console.error('ERROR:', err.message));

    await page.goto('http://localhost:5173');

    // Login as standard
    await page.waitForSelector('select');
    await page.select('select', '2'); // Using standard church 2 based on previous knowledge if needed, or simply let it type

    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'teste1@igreja.com');
    await page.type('input[type="password"]', '123');
    await page.click('button[type="submit"]');

    // Wait for login and navigate
    await page.waitForFunction(() => document.body.innerText.includes('Conecta EBD'));

    console.log("Logged in. Navigating to suggestions.");

    // Find suggestions button
    const elements = await page.$$('button');
    for (const el of elements) {
        const text = await page.evaluate(e => e.textContent, el);
        if (text?.includes('Sugestões e ajustes')) {
            await el.click();
            break;
        }
    }

    await page.waitForTimeout(1000);
    console.log("On suggestions page. Typing and submitting.");

    await page.waitForSelector('textarea');
    await page.type('textarea', 'Test submission script');

    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    console.log("Current body text after submit:", await page.evaluate(() => document.body.innerText.substring(0, 100)));

    await browser.close();
})();
