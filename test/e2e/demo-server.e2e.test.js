'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const { startDemoServer } = require('./helpers/demo-server.js');

const rootDir = path.join(__dirname, '..', '..');

function fetchBinary(url) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    http
      .get(url, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            ms: Date.now() - start,
            headers: res.headers,
            body: Buffer.concat(chunks)
          });
        });
      })
      .on('error', reject);
  });
}

describe('Demo server E2E', { timeout: 20000 }, () => {
  let demo;

  before(async () => {
    demo = await startDemoServer(rootDir);
  });

  after(async () => {
    if (demo) await demo.stop();
  });

  it('serves the demo page with HTML, JS, and Datastar hooks', async () => {
    const res = await fetchBinary(demo.url);
    const html = res.body.toString('utf8');
    assert.equal(res.status, 200);
    assert.match(html, /slow\.svg/);
    assert.match(html, /js-load/);
    assert.match(html, /datastar-fetch|@get\('\/cart'\)/);
  });

  it('delays the slow image beyond the red threshold', async () => {
    const res = await fetchBinary(demo.url.replace(/\/$/, '') + '/slow.svg');
    assert.equal(res.status, 200);
    assert.ok(res.ms >= 700, 'slow.svg should take ~750ms, took ' + res.ms);
  });

  it('delays the Datastar cart fragment and sets selector headers', async () => {
    const res = await fetchBinary(demo.url.replace(/\/$/, '') + '/cart');
    assert.equal(res.status, 200);
    assert.ok(res.ms >= 380, 'cart should take ~420ms, took ' + res.ms);
    assert.equal(res.headers['datastar-selector'], '#cart');
    assert.match(res.body.toString('utf8'), /Warenkorb/);
  });
});
