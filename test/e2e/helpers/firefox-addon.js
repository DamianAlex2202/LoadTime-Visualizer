'use strict';

const net = require('node:net');

function encodeRdp(obj) {
  const raw = Buffer.from(JSON.stringify(obj), 'utf8');
  return Buffer.concat([Buffer.from(String(raw.length) + ':', 'utf8'), raw]);
}

function loadFirefoxAddon(port, host, addonPath, timeoutMs) {
  const deadline = Date.now() + (timeoutMs || 15000);
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      if (Date.now() > deadline) {
        reject(new Error('Firefox RDP did not accept the addon at ' + addonPath));
        return;
      }
      const socket = net.connect({ port, host });
      let success = false;
      let settled = false;

      const failLater = () => {
        if (settled) return;
        socket.destroy();
        setTimeout(tryConnect, 200);
      };

      socket.setTimeout(2000);
      socket.once('timeout', failLater);
      socket.once('error', failLater);

      const send = (data) => {
        socket.write(encodeRdp(data));
      };

      socket.once('connect', () => {
        send({ to: 'root', type: 'getRoot' });
      });

      const onMessage = (message) => {
        if (message.addonsActor) {
          send({
            to: message.addonsActor,
            type: 'installTemporaryAddon',
            addonPath
          });
        }
        if (message.addon) {
          success = true;
          settled = true;
          socket.end();
          resolve(message.addon);
        }
        if (message.error) {
          settled = true;
          socket.end();
          reject(new Error(String(message.error)));
        }
      };

      const buffers = [];
      let remainingBytes = 0;

      socket.on('data', (chunk) => {
        let data = chunk;
        while (true) {
          if (remainingBytes === 0) {
            buffers.push(data);
            const buffer = Buffer.concat(buffers);
            const bufferIndex = buffer.indexOf(':');
            if (bufferIndex === -1) return;
            buffers.length = 0;
            remainingBytes = Number(buffer.subarray(0, bufferIndex).toString());
            if (!Number.isFinite(remainingBytes)) {
              failLater();
              return;
            }
            data = buffer.subarray(bufferIndex + 1);
          }
          if (data.length < remainingBytes) {
            remainingBytes -= data.length;
            buffers.push(data);
            break;
          }
          buffers.push(data.subarray(0, remainingBytes));
          const jsonBuf = Buffer.concat(buffers);
          buffers.length = 0;
          let json;
          try {
            json = JSON.parse(jsonBuf.toString('utf8'));
          } catch (err) {
            failLater();
            return;
          }
          queueMicrotask(() => onMessage(json));
          const remainder = data.subarray(remainingBytes);
          remainingBytes = 0;
          if (remainder.length === 0) break;
          data = remainder;
        }
      });

      socket.once('close', () => {
        if (!settled && !success) failLater();
      });
    };
    tryConnect();
  });
}

module.exports = { loadFirefoxAddon };
