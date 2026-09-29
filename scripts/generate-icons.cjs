const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c >>> 0;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function makePng(width, height, getPixel) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdr = makeChunk('IHDR', ihdrData);

  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Distance helper
function dist(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

// Shader for VenkateshBhaiya Assistant icon
function renderIconPixel(x, y, w, h, isMaskable = false) {
  // Normalize coordinates (-1 to 1)
  const nx = (x / w) * 2 - 1;
  const ny = (y / h) * 2 - 1;

  // Check rounded corner for non-maskable icons
  if (!isMaskable) {
    const cornerRadius = 0.28;
    const ax = Math.abs(nx);
    const ay = Math.abs(ny);
    if (ax > 1 - cornerRadius && ay > 1 - cornerRadius) {
      const cornerDist = Math.hypot(ax - (1 - cornerRadius), ay - (1 - cornerRadius));
      if (cornerDist > cornerRadius) {
        return [0, 0, 0, 0]; // Transparent outside corner
      }
    }
  }

  // Deep dark modern gradient background
  // Base: from #0f172a (15, 23, 42) at top-left to #1e1b4b (30, 27, 75) to #09090b (9, 9, 11) at bottom-right
  const gradT = (nx + ny + 2) / 4;
  let bgR = Math.round(15 * (1 - gradT) + 9 * gradT);
  let bgG = Math.round(23 * (1 - gradT) + 9 * gradT);
  let bgB = Math.round(50 * (1 - gradT) + 12 * gradT);

  // Radial glow around center
  const centerD = Math.hypot(nx, ny + 0.05);
  if (centerD < 0.8) {
    const glow = Math.pow(1 - centerD / 0.8, 1.8) * 0.45;
    bgR = Math.min(255, bgR + Math.round(70 * glow));
    bgG = Math.min(255, bgG + Math.round(90 * glow));
    bgB = Math.min(255, bgB + Math.round(220 * glow));
  }

  // Central 4-pointed Star / AI Spark
  // Scale for maskable has 15% safe-padding margin
  const scale = isMaskable ? 0.75 : 0.88;
  const sx = nx / scale;
  const sy = (ny + 0.05) / scale;

  // Star distance function: (|x|^0.5 + |y|^0.5)
  const absX = Math.abs(sx);
  const absY = Math.abs(sy);
  const starDist = Math.pow(absX, 0.55) + Math.pow(absY, 0.55);

  let r = bgR, g = bgG, b = bgB, a = 255;

  // Outer primary star
  if (starDist < 0.72) {
    // Gradient from cyan (56, 189, 248) to indigo (99, 102, 241) to purple (168, 85, 247)
    const starT = (sx - sy + 1) / 2;
    let sR = Math.round(56 * (1 - starT) + 168 * starT);
    let sG = Math.round(189 * (1 - starT) + 85 * starT);
    let sB = Math.round(248 * (1 - starT) + 247 * starT);

    // Inner core bright white/cyan spark
    if (starDist < 0.35) {
      const coreT = starDist / 0.35;
      sR = Math.round(255 * (1 - coreT) + sR * coreT);
      sG = Math.round(255 * (1 - coreT) + sG * coreT);
      sB = Math.round(255 * (1 - coreT) + sB * coreT);
    }

    // Blend star with background
    const edge = Math.min(1, Math.max(0, (0.72 - starDist) * 15));
    r = Math.round(sR * edge + r * (1 - edge));
    g = Math.round(sG * edge + g * (1 - edge));
    b = Math.round(sB * edge + b * (1 - edge));
  }

  // Left & right satellite neural nodes
  const node1 = dist(sx, sy, -0.55, -0.35);
  const node2 = dist(sx, sy, 0.55, -0.35);
  const node3 = dist(sx, sy, -0.6, 0.3);
  const node4 = dist(sx, sy, 0.6, 0.3);

  const minNodeDist = Math.min(node1, node2, node3, node4);
  if (minNodeDist < 0.08) {
    const nodeT = minNodeDist / 0.08;
    const nR = 224, nG = 242, nB = 254; // glowing cyan-white
    r = Math.round(nR * (1 - nodeT) + r * nodeT);
    g = Math.round(nG * (1 - nodeT) + g * nodeT);
    b = Math.round(nB * (1 - nodeT) + b * nodeT);
  }

  return [r, g, b, a];
}

const publicDir = path.join(__dirname, '..', 'public');

console.log('Generating PWA icons in:', publicDir);

// 1. 192x192 icon
const pwa192 = makePng(192, 192, (x, y, w, h) => renderIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);
console.log('Generated pwa-192x192.png');

// 2. 512x512 icon
const pwa512 = makePng(512, 512, (x, y, w, h) => renderIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);
console.log('Generated pwa-512x512.png');

// 3. 512x512 Maskable icon (full-bleed background + safe-zone padding)
const pwaMaskable512 = makePng(512, 512, (x, y, w, h) => renderIconPixel(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable512);
console.log('Generated pwa-maskable-512x512.png');

// 4. 180x180 Apple Touch Icon (PNG)
const appleTouchIcon = makePng(180, 180, (x, y, w, h) => renderIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchIcon);
console.log('Generated apple-touch-icon.png');

// 5. 32x32 Favicon PNG
const favicon = makePng(32, 32, (x, y, w, h) => renderIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'favicon.png'), favicon);
console.log('Generated favicon.png');

console.log('All PWA icons generated successfully!');
