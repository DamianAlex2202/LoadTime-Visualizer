const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { classifyDatastarFetch, datastarAppear, resolveAppear } = require('../lib/datastar.js');

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

describe('resolveAppear', () => {
  it('keeps navigation-relative DOM time only while the document is still loading', () => {
    assert.deepEqual(
      resolveAppear(80, { inflight: 0, batchStart: 0, readyState: 'loading' }),
      { ownMs: 80, source: 'dom' }
    );
  });

  it('uses the mutation-batch duration after load instead of time since navigation', () => {
    assert.deepEqual(
      resolveAppear(5000, {
        inflight: 0,
        batchStart: 0,
        readyState: 'complete',
        domBatchStart: 4992
      }),
      { ownMs: 8, source: 'dom' }
    );
  });

  it('still prefers an in-flight Datastar fetch over DOM appearance', () => {
    assert.deepEqual(
      resolveAppear(1000, {
        inflight: 1,
        batchStart: 590,
        readyState: 'complete',
        domBatchStart: 900
      }),
      { ownMs: 410, source: 'datastar' }
    );
  });
});
