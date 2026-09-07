const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { formatLabel, nameFromUrl, nameFromElement } = require('../lib/label.js');

describe('formatLabel', () => {
  it('joins name and rounded milliseconds', () => {
    assert.equal(formatLabel('hero.jpg', 819.6), 'hero.jpg · 820ms');
  });

  it('falls back when the name is empty', () => {
    assert.equal(formatLabel('  ', 80), 'element · 80ms');
  });
});

describe('nameFromUrl', () => {
  it('uses the last path segment', () => {
    assert.equal(nameFromUrl('https://cdn.example/img/hero.jpg?w=800'), 'hero.jpg');
  });

  it('uses the hostname when the path is empty', () => {
    assert.equal(nameFromUrl('https://api.example/'), 'api.example');
  });
});

describe('nameFromElement', () => {
  it('prefers id', () => {
    assert.equal(nameFromElement({ nodeType: 1, id: 'cart', tagName: 'DIV', className: 'box' }), '#cart');
  });

  it('uses tag plus first class when there is no id', () => {
    assert.equal(
      nameFromElement({ nodeType: 1, id: '', tagName: 'ARTICLE', className: 'prose wide' }),
      'article.prose'
    );
  });

  it('uses the tag name as last resort', () => {
    assert.equal(nameFromElement({ nodeType: 1, id: '', tagName: 'P', className: '' }), 'p');
  });
});
