'use strict';

if (typeof importScripts === 'function' && !(globalThis.LoadTime && globalThis.LoadTime.sendToggleToActiveTab)) {
  importScripts('lib/browser.js');
}

const LT = globalThis.LoadTime;
const ext = LT.getExtensionApi(globalThis);
if (ext && ext.commands && ext.commands.onCommand) {
  ext.commands.onCommand.addListener(async (command) => {
    if (command !== 'toggle-overlay') return;
    await LT.sendToggleToActiveTab(ext);
  });
}
