const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { computeSubtreeMs, SOURCE_RANK, shouldReplaceSource } = require('../lib/timing.js');

describe('computeSubtreeMs', () => {
  it('is the max of own time and child subtree times', () => {
    assert.equal(computeSubtreeMs(40, [80, 820, 410]), 820);
  });

  it('uses own time when there are no children', () => {
    assert.equal(computeSubtreeMs(80, []), 80);
  });

  it('treats missing own time as 0', () => {
    assert.equal(computeSubtreeMs(undefined, [120]), 120);
  });
});

describe('shouldReplaceSource', () => {
  it('lets datastar and resource replace a weaker dom measurement', () => {
    assert.equal(shouldReplaceSource('dom', 'resource'), true);
    assert.equal(shouldReplaceSource('resource', 'datastar'), true);
    assert.equal(shouldReplaceSource('datastar', 'dom'), false);
  });

  it('allows the same source to update', () => {
    assert.equal(shouldReplaceSource('resource', 'resource'), true);
  });

  it('ranks sources in spec order', () => {
    assert.equal(SOURCE_RANK.dom < SOURCE_RANK.resource, true);
    assert.equal(SOURCE_RANK.resource < SOURCE_RANK.datastar, true);
  });
});
