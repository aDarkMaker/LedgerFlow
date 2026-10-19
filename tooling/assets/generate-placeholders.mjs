import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { deflateSync } from 'node:zlib';

const size = 1024;
const canvas = Buffer.alloc(size * size * 4);

// Cream canvas with a coral rounded square and an ink stripe, matching the tokens.
for (let y = 0; y < size; y += 1) {
  for (let x = 0; x < size; x += 1) {
    const i = (y * size + x) * 4;
    const inSquare = x > 260 && x < 764 && y > 260 && y < 764;
    const inStripe = x > 320 && x < 704 && y > 470 && y < 554;
    const [r, g, b] = inStripe ? [49, 23, 3] : inSquare ? [255, 127, 80] : [255, 246, 233];
    canvas[i] = r;
    canvas[i + 1] = g;
    canvas[i + 2] = b;
    canvas[i + 3] = 255;
  }
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crcTable = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const byte of body) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([length, body, crcBuffer]);
}

const header = Buffer.alloc(13);
header.writeUInt32BE(size, 0);
header.writeUInt32BE(size, 4);
header[8] = 8;
header[9] = 6;

const raw = Buffer.alloc(size * (size * 4 + 1));
for (let y = 0; y < size; y += 1) {
  raw[y * (size * 4 + 1)] = 0;
  canvas.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', header),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const assets = path.resolve(process.cwd(), 'apps/mobile/assets');
mkdirSync(assets, { recursive: true });
for (const name of ['icon.png', 'adaptive-icon.png', 'splash-icon.png']) {
  writeFileSync(path.join(assets, name), png);
}
process.stdout.write('Wrote placeholder assets\n');
