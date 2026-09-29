const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Standard CRC32 table for PNG chunk generation
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

// Generate valid RGBA PNG buffer
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
    rawData[rowOffset] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Distance to 2D line segment
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// Distance to 2D rounded box
function roundedBoxSDF(px, py, cx, cy, w, h, r) {
  const qx = Math.abs(px - cx) - (w - r);
  const qy = Math.abs(py - cy) - (h - r);
  const extX = Math.max(qx, 0);
  const extY = Math.max(qy, 0);
  const outsideDist = Math.hypot(extX, extY);
  const insideDist = Math.min(Math.max(qx, qy), 0);
  return outsideDist + insideDist - r;
}

// Signed distance to the "VB" monogram
function vbMonogramSDF(nx, ny) {
  // --- Glyph V ---
  // Left arm of V: from (-0.56, -0.48) to (-0.30, 0.48)
  // Right arm of V: from (-0.30, 0.48) to (-0.05, -0.48)
  // Stroke radius = 0.088 (stroke width ~ 0.176)
  const strokeV = 0.088;
  const vArm1 = distToSegment(nx, ny, -0.56, -0.48, -0.30, 0.48) - strokeV;
  const vArm2 = distToSegment(nx, ny, -0.30, 0.48, -0.05, -0.48) - strokeV;
  const vSDF = Math.min(vArm1, vArm2);

  // --- Glyph B ---
  // Vertical stem of B: from (0.13, -0.48) to (0.13, 0.48)
  const bSpine = distToSegment(nx, ny, 0.13, -0.48, 0.13, 0.48) - 0.088;

  // Top outer bowl of B:
  // Center (0.33, -0.23), width 0.22, height 0.23, corner radius 0.16
  const topOuter = roundedBoxSDF(nx, ny, 0.32, -0.24, 0.21, 0.22, 0.14);
  const topInner = roundedBoxSDF(nx, ny, 0.32, -0.24, 0.09, 0.09, 0.06);
  const topBowl = Math.max(topOuter, -topInner);

  // Bottom outer bowl of B (slightly larger for visual groundedness):
  // Center (0.35, 0.23), width 0.24, height 0.25, corner radius 0.17
  const botOuter = roundedBoxSDF(nx, ny, 0.34, 0.23, 0.23, 0.24, 0.15);
  const botInner = roundedBoxSDF(nx, ny, 0.34, 0.23, 0.10, 0.10, 0.06);
  const botBowl = Math.max(botOuter, -botInner);

  // Combine B parts (prevent bowls extending backwards to the left of spine)
  const bBowls = (nx >= 0.10) ? Math.min(topBowl, botBowl) : 999;
  const bSDF = Math.min(bSpine, bBowls);

  // Union of V and B
  return Math.min(vSDF, bSDF);
}

// Background squircle SDF
function squircleSDF(nx, ny, radius = 0.24) {
  const ax = Math.abs(nx);
  const ay = Math.abs(ny);
  if (ax > 1 - radius && ay > 1 - radius) {
    const cornerDist = Math.hypot(ax - (1 - radius), ay - (1 - radius));
    return cornerDist - radius;
  }
  return Math.max(ax, ay) - 1;
}

// Render single pixel with 4x supersampling (anti-aliasing)
function renderPixel(x, y, w, h, isMaskable = false) {
  let accR = 0, accG = 0, accB = 0, accA = 0;
  const samples = 2; // 2x2 = 4 sub-pixel samples

  for (let sy = 0; sy < samples; sy++) {
    for (let sx = 0; sx < samples; sx++) {
      const subX = x + (sx + 0.5) / samples;
      const subY = y + (sy + 0.5) / samples;

      // Normalized coordinates: -1 to 1
      const nx = (subX / w) * 2 - 1;
      const ny = (subY / h) * 2 - 1;

      // Background squircle boundary check
      let bgAlpha = 1.0;
      if (!isMaskable) {
        // Leave tiny margin of 0.06 around icon border
        const sqDist = squircleSDF(nx / 0.94, ny / 0.94, 0.26);
        const pixelSizeNorm = 2 / Math.min(w, h);
        bgAlpha = Math.max(0, Math.min(1, 0.5 - sqDist / (pixelSizeNorm * 1.2)));
        if (bgAlpha <= 0) {
          continue; // completely transparent outside squircle
        }
      }

      // Background rich dark gradient:
      // Dark navy/slate (#0c1322) at top-left to deep midnight (#030712) at bottom-right
      const bgDiag = (nx + ny + 2) / 4;
      let bgR = Math.round(14 * (1 - bgDiag) + 3 * bgDiag);
      let bgG = Math.round(20 * (1 - bgDiag) + 7 * bgDiag);
      let bgB = Math.round(36 * (1 - bgDiag) + 18 * bgDiag);

      // Subtle cyan-indigo ambient radial glow behind the monogram
      const glowDist = Math.hypot(nx, ny);
      if (glowDist < 0.85) {
        const glowFactor = Math.pow(1 - glowDist / 0.85, 2.0);
        bgR = Math.min(255, bgR + Math.round(35 * glowFactor));
        bgG = Math.min(255, bgG + Math.round(75 * glowFactor));
        bgB = Math.min(255, bgB + Math.round(180 * glowFactor));
      }

      // Delicate 1px border highlight around squircle
      if (!isMaskable) {
        const sqDist = squircleSDF(nx / 0.94, ny / 0.94, 0.26);
        const borderDist = Math.abs(sqDist);
        const pixelSizeNorm = 2 / Math.min(w, h);
        if (borderDist < pixelSizeNorm * 1.5) {
          const borderT = Math.max(0, 1 - borderDist / (pixelSizeNorm * 1.5));
          // Cyan-indigo border highlight (#38bdf8 / #818cf8)
          const bStrokeR = 56, bStrokeG = 189, bStrokeB = 248;
          bgR = Math.round(bStrokeR * (borderT * 0.45) + bgR * (1 - borderT * 0.45));
          bgG = Math.round(bStrokeG * (borderT * 0.45) + bgG * (1 - borderT * 0.45));
          bgB = Math.round(bStrokeB * (borderT * 0.45) + bgB * (1 - borderT * 0.45));
        }
      }

      // Scale coordinates for the VB monogram inside the squircle
      // Safe padding: monogram scaled to 0.72 of squircle
      const monoScale = isMaskable ? 0.62 : 0.72;
      const mx = nx / monoScale;
      const my = ny / monoScale;

      const monoDist = vbMonogramSDF(mx, my);
      const pixelSizeMono = (2 / Math.min(w, h)) / monoScale;

      // Soft drop shadow behind monogram: offset (+0.03, +0.04)
      const shadowDist = vbMonogramSDF(mx - 0.035, my - 0.045);
      if (shadowDist < pixelSizeMono * 2.5) {
        const shadowAlpha = Math.max(0, Math.min(0.55, (1 - shadowDist / (pixelSizeMono * 2.5)) * 0.55));
        bgR = Math.round(bgR * (1 - shadowAlpha));
        bgG = Math.round(bgG * (1 - shadowAlpha));
        bgB = Math.round(bgB * (1 - shadowAlpha));
      }

      // Render the "VB" Monogram
      if (monoDist <= pixelSizeMono * 1.5) {
        const monoAlpha = Math.max(0, Math.min(1, 0.5 - monoDist / (pixelSizeMono * 1.2)));

        // Monogram gradient:
        // Top-left crisp white (#ffffff) to electric cyan (#38bdf8) to vivid indigo-purple (#818cf8 -> #c084fc)
        const t = Math.max(0, Math.min(1, (mx * 0.5 + my * 0.5 + 0.5)));

        let mR, mG, mB;
        if (t < 0.4) {
          // Pure white to bright cyan
          const t1 = t / 0.4;
          mR = Math.round(255 * (1 - t1) + 56 * t1);
          mG = Math.round(255 * (1 - t1) + 189 * t1);
          mB = Math.round(255 * (1 - t1) + 248 * t1);
        } else {
          // Bright cyan to electric indigo/purple
          const t2 = (t - 0.4) / 0.6;
          mR = Math.round(56 * (1 - t2) + 168 * t2);
          mG = Math.round(189 * (1 - t2) + 85 * t2);
          mB = Math.round(248 * (1 - t2) + 247 * t2);
        }

        // Inner core bevel highlight at top edge
        const topBevel = Math.max(0, -my) * (monoDist < 0 ? 1 : 0);
        if (topBevel > 0.1) {
          const hVal = Math.min(0.35, (topBevel - 0.1) * 0.4);
          mR = Math.min(255, Math.round(mR * (1 - hVal) + 255 * hVal));
          mG = Math.min(255, Math.round(mG * (1 - hVal) + 255 * hVal));
          mB = Math.min(255, Math.round(mB * (1 - hVal) + 255 * hVal));
        }

        // Alpha blend monogram over background
        bgR = Math.round(mR * monoAlpha + bgR * (1 - monoAlpha));
        bgG = Math.round(mG * monoAlpha + bgG * (1 - monoAlpha));
        bgB = Math.round(mB * monoAlpha + bgB * (1 - monoAlpha));
      }

      accR += bgR;
      accG += bgG;
      accB += bgB;
      accA += Math.round(bgAlpha * 255);
    }
  }

  const total = samples * samples;
  return [
    Math.round(accR / total),
    Math.round(accG / total),
    Math.round(accB / total),
    Math.round(accA / total),
  ];
}

const publicDir = path.join(__dirname, '..', 'public');
console.log('Writing icons to:', publicDir);

// 1. Primary Favicon: 96x96 PNG (multiple of 48, crystal clear at 16x16, 32x32, 48x48, 96x96)
const faviconBuffer = makePng(96, 96, (x, y, w, h) => renderPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'favicon.png'), faviconBuffer);
console.log('Generated /public/favicon.png (96x96,', faviconBuffer.length, 'bytes)');

// 2. Also generate 180x180 Apple Touch Icon
const appleTouchBuffer = makePng(180, 180, (x, y, w, h) => renderPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchBuffer);
console.log('Generated /public/apple-touch-icon.png (180x180)');

// 3. Also generate 192x192 PWA Icon
const pwa192Buffer = makePng(192, 192, (x, y, w, h) => renderPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192Buffer);
console.log('Generated /public/pwa-192x192.png (192x192)');

// 4. Also generate 512x512 PWA Icon
const pwa512Buffer = makePng(512, 512, (x, y, w, h) => renderPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512Buffer);
console.log('Generated /public/pwa-512x512.png (512x512)');

// 5. Generate matching clean SVG icon for /public/icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0c1322" />
      <stop offset="50%" stop-color="#111827" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
    <linearGradient id="vbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="35%" stop-color="#38bdf8" />
      <stop offset="70%" stop-color="#818cf8" />
      <stop offset="100%" stop-color="#c084fc" />
    </linearGradient>
    <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.6" />
    </filter>
  </defs>
  <!-- Background Squircle -->
  <rect x="3" y="3" width="90" height="90" rx="22" ry="22" fill="url(#bgGrad)" stroke="#38bdf8" stroke-width="1" stroke-opacity="0.35" />
  <circle cx="48" cy="48" r="38" fill="url(#ambientGlow)" />
  <!-- Monogram VB -->
  <g filter="url(#shadow)" fill="none" stroke="url(#vbGrad)" stroke-linecap="round" stroke-linejoin="round">
    <!-- Letter V -->
    <path d="M 24 28 L 36 68 L 48 28" stroke-width="8.5" />
    <!-- Letter B Spine -->
    <path d="M 58 28 L 58 68" stroke-width="8.5" />
    <!-- Letter B Bowls -->
    <path d="M 58 28 H 71 C 77 28 81 32 81 38 C 81 44 77 48 71 48 H 58" stroke-width="8.5" />
    <path d="M 58 48 H 73 C 80 48 84 52 84 58 C 84 64 80 68 73 68 H 58" stroke-width="8.5" />
  </g>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent.trim());
console.log('Updated /public/icon.svg');

console.log('All brand VB icons created successfully!');
