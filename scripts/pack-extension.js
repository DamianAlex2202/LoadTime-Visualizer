'use strict';

const fs = require('node:fs');
const path = require('node:path');

const COPY_FILES = [
  'background.js',
  'lib/browser.js',
  'lib/color.js',
  'lib/datastar.js',
  'lib/hotkey.js',
  'lib/label.js',
  'lib/resource.js',
  'lib/settings.js',
  'lib/skip.js',
  'lib/timing.js',
  'content/index.js',
  'content/measure.js',
  'content/overlay.js',
  'options/options.html',
  'options/options.css',
  'options/options.js'
];

function chromeManifest() {
  return {
    manifest_version: 3,
    name: 'LoadTime Overlay',
    version: '1.0.0',
    description: 'Zeigt Ladezeiten einzelner Elemente als Overlay an (HTML, JavaScript, Datastar).',
    permissions: ['storage'],
    background: {
      service_worker: 'background.js'
    },
    options_ui: {
      page: 'options/options.html',
      open_in_tab: true
    },
    commands: {
      'toggle-overlay': {
        suggested_key: {
          default: 'Ctrl+Shift+L',
          mac: 'Command+Shift+L'
        },
        description: 'LoadTime-Overlay ein- oder ausschalten'
      }
    },
    content_scripts: [
      {
        matches: ['http://*/*', 'https://*/*'],
        js: [
          'lib/color.js',
          'lib/label.js',
          'lib/timing.js',
          'lib/settings.js',
          'lib/skip.js',
          'lib/resource.js',
          'lib/datastar.js',
          'lib/hotkey.js',
          'lib/browser.js',
          'content/measure.js',
          'content/overlay.js',
          'content/index.js'
        ],
        run_at: 'document_start',
        all_frames: false
      }
    ]
  };
}

function firefoxManifest() {
  const manifest = chromeManifest();
  manifest.background = {
    scripts: ['lib/browser.js', 'background.js']
  };
  manifest.host_permissions = ['http://*/*', 'https://*/*'];
  manifest.browser_specific_settings = {
    gecko: {
      id: 'loadtime-visualizer@damianalex2202',
      strict_min_version: '121.0'
    }
  };
  return manifest;
}

function copyFile(rootDir, destDir, rel) {
  const from = path.join(rootDir, rel);
  const to = path.join(destDir, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function packExtension(options) {
  const rootDir = options.rootDir;
  const outDir = options.outDir;
  const chromeDir = path.join(outDir, 'chrome');
  const firefoxDir = path.join(outDir, 'firefox');
  fs.mkdirSync(chromeDir, { recursive: true });
  fs.mkdirSync(firefoxDir, { recursive: true });
  for (let i = 0; i < COPY_FILES.length; i++) {
    copyFile(rootDir, chromeDir, COPY_FILES[i]);
    copyFile(rootDir, firefoxDir, COPY_FILES[i]);
  }
  fs.writeFileSync(path.join(chromeDir, 'manifest.json'), JSON.stringify(chromeManifest(), null, 2));
  fs.writeFileSync(path.join(firefoxDir, 'manifest.json'), JSON.stringify(firefoxManifest(), null, 2));
  return { chromeDir, firefoxDir };
}

module.exports = { packExtension, chromeManifest, firefoxManifest, COPY_FILES };

if (require.main === module) {
  const rootDir = path.join(__dirname, '..');
  const outDir = path.join(rootDir, 'dist');
  packExtension({ rootDir, outDir });
  process.stdout.write('Packed dist/chrome and dist/firefox\n');
}
