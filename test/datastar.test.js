const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { classifyDatastarFetch, datastarAppear } = require('../lib/datastar.js');

describe('classifyDatastarFetch', () => {
  it('detects start and end of a fetch lifecycle', () => {
    assert.deepEqual(classifyDatastarFetch({ type: 'started' }), { phase: 'start' });
    assert.deepEqual(classifyDatastarFetch({ type: 'finished' }), { phase: 'end' });
    assert.deepEqual(classifyDatastarFetch({ type: 'error' }), { phase: 'end' });
    assert.deepEqual(classifyDatastarFetch({ type: 'retries-failed' }), { phase: 'end' });
    assert.deepEqual(classifyDatastarFetch({ type: 'retrying' }), { phase: 'other' });
    assert.deepEqual(classifyDatastarFetch(null), { phase: 'other' });
  });
});

describe('datastarAppear', () => {
  it('attributes mutations during an in-flight fetch to datastar duration', () => {
    assert.deepEqual(datastarAppear(1000, { inflight: 1, batchStart: 590 }), {
      ownMs: 410,
      source: 'datastar'
    });
  });

  it('uses navigation-relative time when nothing is in flight', () => {
    assert.deepEqual(datastarAppear(80, { inflight: 0, batchStart: 0 }), {
      ownMs: 80,
      source: 'dom'
    });
  });
});
