const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { getExtensionApi, getStorageArea, sendToggleToActiveTab } = require('../lib/browser.js');

describe('getExtensionApi', () => {
  it('prefers the browser namespace when runtime exists', () => {
    const browser = { runtime: { id: 'fx' } };
    const chrome = { runtime: { id: 'cr' } };
    assert.equal(getExtensionApi({ browser, chrome }), browser);
  });

  it('falls back to chrome when browser is missing', () => {
    const chrome = { runtime: { id: 'cr' } };
    assert.equal(getExtensionApi({ chrome }), chrome);
  });

  it('returns null when neither API is present', () => {
    assert.equal(getExtensionApi({}), null);
    assert.equal(getExtensionApi(null), null);
  });
});

describe('getStorageArea', () => {
  it('prefers sync and falls back to local', () => {
    const sync = { name: 'sync' };
    const local = { name: 'local' };
    assert.equal(getStorageArea({ storage: { sync, local } }), sync);
    assert.equal(getStorageArea({ storage: { local } }), local);
    assert.equal(getStorageArea({}), null);
  });
});

describe('sendToggleToActiveTab', () => {
  it('sends LOADTIME_TOGGLE to the active tab id', async () => {
    const sent = [];
    const api = {
      tabs: {
        query: async () => [{ id: 42 }],
        sendMessage: async (id, msg) => {
          sent.push({ id, msg });
        }
      }
    };
    await sendToggleToActiveTab(api);
    assert.deepEqual(sent, [{ id: 42, msg: { type: 'LOADTIME_TOGGLE' } }]);
  });

  it('ignores missing tabs and send errors', async () => {
    await sendToggleToActiveTab({ tabs: { query: async () => [], sendMessage: async () => {} } });
    await sendToggleToActiveTab({
      tabs: {
        query: async () => [{ id: 1 }],
        sendMessage: async () => {
          throw new Error('no receiver');
        }
      }
    });
  });
});
