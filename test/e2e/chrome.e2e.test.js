'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { packExtension } = require('../../scripts/pack-extension.js');
const { startDemoServer } = require('./helpers/demo-server.js');
const { runOverlayScenarios, runOptionsPage } = require('./helpers/overlay-scenarios.js');

const rootDir = path.join(__dirname, '..', '..');

describe('Chrome E2E', { timeout: 120000 }, () => {
  let chromium;
  let demo;
  let chromeDir;
  let tmp;

  before(async () => {
    ({ chromium } = require('playwright'));
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'loadtime-chrome-'));
    chromeDir = packExtension({ rootDir, outDir: path.join(tmp, 'dist') }).chromeDir;
    demo = await startDemoServer(rootDir);
  });

  after(async () => {
    if (demo) await demo.stop();
  });

  it('toggles overlay, filters, JS insert, and Datastar on the demo page', async () => {
    const userDataDir = fs.mkdtempSync(path.join(tmp, 'profile-'));
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: true,
      channel: 'chromium',
      args: [
        `--disable-extensions-except=${chromeDir}`,
        `--load-extension=${chromeDir}`,
        '--no-first-run'
      ]
    });
    try {
      const page = await context.newPage();
      await runOverlayScenarios(page, demo.url);
    } finally {
      await context.close();
    }
  });

  it('saves thresholds on the options page', async () => {
    const userDataDir = fs.mkdtempSync(path.join(tmp, 'profile-opt-'));
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: true,
      channel: 'chromium',
      args: [
        `--disable-extensions-except=${chromeDir}`,
        `--load-extension=${chromeDir}`,
        '--no-first-run'
      ]
    });
    try {
      let worker = context.serviceWorkers()[0];
      if (!worker) worker = await context.waitForEvent('serviceworker', { timeout: 15000 });
      const extensionId = worker.url().split('/')[2];
      assert.ok(extensionId);
      const page = await context.newPage();
      await runOptionsPage(page, 'chrome-extension://' + extensionId + '/options/options.html');
    } finally {
      await context.close();
    }
  });
});
