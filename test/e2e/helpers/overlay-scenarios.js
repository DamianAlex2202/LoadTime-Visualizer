'use strict';

const assert = require('node:assert/strict');

async function runOverlayScenarios(page, demoUrl) {
  await page.goto(demoUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#main', { timeout: 15000 });

  assert.equal(await page.locator('#loadtime-overlay-host').count(), 0);

  await page.keyboard.press('Control+Shift+L');
  await page.waitForSelector('#loadtime-overlay-host[data-loadtime-enabled="true"]', { timeout: 15000 });

  const brand = page.locator('#loadtime-overlay-host').locator('.brand');
  assert.equal(String(await brand.textContent()).trim(), 'LoadTime');

  await page.waitForFunction(() => {
    const host = document.getElementById('loadtime-overlay-host');
    return Number(host && host.getAttribute('data-loadtime-strips')) > 0;
  }, null, { timeout: 15000 });

  await page.waitForFunction(() => {
    const img = document.querySelector('img.hero');
    return Boolean(img && img.complete && img.naturalWidth > 0);
  }, null, { timeout: 20000 });
  await page.waitForTimeout(400);

  const stripTexts = await page.locator('#loadtime-overlay-host .strip').allTextContents();
  assert.ok(
    stripTexts.some((text) => text.includes('slow.svg') && text.includes('· net')),
    'expected slow.svg net timing, got ' + JSON.stringify(stripTexts)
  );

  const stripsBefore = Number(await page.locator('#loadtime-overlay-host').getAttribute('data-loadtime-strips'));
  await page.locator('#loadtime-overlay-host').locator('.chip[data-band="green"]').click();
  await page.waitForTimeout(300);
  const stripsAfterGreenOff = Number(
    await page.locator('#loadtime-overlay-host').getAttribute('data-loadtime-strips')
  );
  assert.ok(stripsAfterGreenOff <= stripsBefore);

  await page.locator('#loadtime-overlay-host').locator('.chip[data-band="green"]').click();
  await page.click('#js-load');
  await page.waitForSelector('#js-panel', { timeout: 8000 });
  await page.waitForTimeout(400);
  const afterJs = await page.locator('#loadtime-overlay-host .strip').allTextContents();
  assert.ok(
    afterJs.some((text) => text.includes('#js-panel') && text.includes('· dom')),
    'expected #js-panel DOM timing, got ' + JSON.stringify(afterJs)
  );

  await page.click('#ds-sim');
  await page.waitForFunction(() => (document.getElementById('cart') || {}).textContent.includes('simuliert'), null, {
    timeout: 8000
  });
  await page.waitForTimeout(400);
  const afterDs = await page.locator('#loadtime-overlay-host .strip').allTextContents();
  assert.ok(
    afterDs.some((text) => text.includes('· ds') && (text.includes('#ds-sim') || text.includes('#cart') || text.includes('strong'))),
    'expected Datastar source tag, got ' + JSON.stringify(afterDs)
  );

  await page.keyboard.press('Control+Shift+L');
  await page.waitForSelector('#loadtime-overlay-host[data-loadtime-enabled="false"]', {
    state: 'attached',
    timeout: 8000
  });
}

async function runOptionsPage(page, optionsUrl) {
  await page.goto(optionsUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('#greenMaxMs');
  assert.equal(await page.inputValue('#greenMaxMs'), '300');
  await page.fill('#greenMaxMs', '200');
  await page.fill('#yellowMaxMs', '400');
  await page.click('button[type="submit"]');
  await page.waitForSelector('#status:not([hidden])', { timeout: 8000 });
  assert.equal(await page.inputValue('#greenMaxMs'), '200');
  assert.equal(await page.inputValue('#yellowMaxMs'), '400');
}

module.exports = { runOverlayScenarios, runOptionsPage };
