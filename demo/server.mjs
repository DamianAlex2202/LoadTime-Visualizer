import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const HOST = '127.0.0.1';
const PORT = 4173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8'
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeFile(urlPath) {
  const raw = decodeURIComponent((urlPath || '/').split('?')[0]);
  if (raw.includes('\0')) return null;
  const rel = raw.replace(/^\/+/, '') || 'index.html';
  const abs = path.normalize(path.join(ROOT, rel));
  const rootWithSep = ROOT.endsWith(path.sep) ? ROOT : ROOT + path.sep;
  if (abs !== ROOT && !abs.startsWith(rootWithSep)) return null;
  return abs;
}

function send(res, status, headers, body) {
  res.writeHead(status, Object.assign({ 'Cache-Control': 'no-store' }, headers));
  res.end(body);
}

const SLOW_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="140">' +
  '<rect width="100%" height="100%" fill="#9bb4c8"/>' +
  '<text x="24" y="80" font-size="28" font-family="sans-serif" fill="#1a1a1a">slow.svg (~750ms)</text>' +
  '</svg>';

const server = http.createServer(async (req, res) => {
  const urlPath = (req.url || '/').split('?')[0];

  try {
    if (urlPath === '/slow.svg') {
      await delay(750);
      send(res, 200, { 'Content-Type': 'image/svg+xml' }, SLOW_SVG);
      return;
    }

    if (urlPath === '/cart') {
      await delay(420);
      send(
        res,
        200,
        {
          'Content-Type': 'text/html; charset=utf-8',
          'datastar-selector': '#cart',
          'datastar-mode': 'outer'
        },
        '<div id="cart" class="card"><strong>Warenkorb</strong><p>3 Artikel · per Datastar</p></div>'
      );
      return;
    }

    const file = safeFile(urlPath);
    if (!file) {
      send(res, 400, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Bad path');
      return;
    }

    let stat;
    try {
      stat = fs.statSync(file);
    } catch (err) {
      send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not found');
      return;
    }
    const target = stat.isDirectory() ? path.join(file, 'index.html') : file;
    const ext = path.extname(target).toLowerCase();
    const body = fs.readFileSync(target);
    send(res, 200, { 'Content-Type': MIME[ext] || 'application/octet-stream' }, body);
  } catch (err) {
    send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Server error');
  }
});

server.listen(PORT, HOST, () => {
  process.stdout.write('Demo: http://' + HOST + ':' + PORT + '/\n');
});
