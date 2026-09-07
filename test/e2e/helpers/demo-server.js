'use strict';

const { spawn } = require('node:child_process');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = addr && addr.port;
      server.close((err) => {
        if (err) reject(err);
        else resolve(port);
      });
    });
    server.on('error', reject);
  });
}

function waitForHttp(url, timeoutMs) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) reject(new Error('Demo server did not start: ' + url));
        else setTimeout(attempt, 100);
      });
    };
    attempt();
  });
}

async function startDemoServer(rootDir) {
  const port = await getFreePort();
  const child = spawn(process.execPath, [path.join(rootDir, 'demo', 'server.mjs')], {
    cwd: rootDir,
    env: Object.assign({}, process.env, { LOADTIME_DEMO_PORT: String(port) }),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const url = 'http://127.0.0.1:' + port + '/';
  await waitForHttp(url, 10000);
  return {
    url,
    port,
    stop: () =>
      new Promise((resolve) => {
        child.once('exit', () => resolve());
        child.kill();
        setTimeout(resolve, 1000);
      })
  };
}

module.exports = { getFreePort, startDemoServer };
