const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { resourceDuration, absoluteUrl, urlsOf } = require('../lib/resource.js');

describe('resourceDuration', () => {
  it('uses duration when it is positive', () => {
    assert.equal(resourceDuration({ duration: 820, responseEnd: 900, startTime: 10 }), 820);
  });

  it('falls back to responseEnd minus startTime', () => {
    assert.equal(resourceDuration({ duration: 0, responseEnd: 500, startTime: 80 }), 420);
  });

  it('returns 0 when nothing usable is present', () => {
    assert.equal(resourceDuration({}), 0);
    assert.equal(resourceDuration({ duration: NaN }), 0);
  });
});

describe('absoluteUrl', () => {
  it('resolves relative URLs against a base', () => {
    assert.equal(absoluteUrl('/slow.svg', 'http://127.0.0.1:4173/'), 'http://127.0.0.1:4173/slow.svg');
  });

  it('returns empty string for invalid values', () => {
    assert.equal(absoluteUrl('http://[', 'http://example.test/'), '');
  });
});

describe('urlsOf', () => {
  it('collects src, href, and currentSrc', () => {
    const urls = urlsOf({
      currentSrc: 'https://cdn.test/a.png',
      src: 'https://cdn.test/a.png',
      href: '',
      getAttribute: (name) => (name === 'href' ? '/x.css' : '')
    });
    assert.ok(urls.includes('https://cdn.test/a.png'));
    assert.ok(urls.includes('/x.css'));
  });
});
