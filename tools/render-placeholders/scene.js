// Procedural açaí cup scene — renders placeholder frames/sprites offline.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------------------------------------------------------------- utils
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// compact 3D simplex noise
const grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
function makeNoise(seed = 1) {
  const r = mulberry32(seed);
  const p = new Uint8Array(256); for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  const perm = new Uint8Array(512); for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const F3 = 1 / 3, G3 = 1 / 6;
  function n3(x, y, z) {
    const s = (x + y + z) * F3; const i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
    const t = (i + j + k) * G3; const x0 = x - i + t, y0 = y - j + t, z0 = z - k + t;
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) { if (y0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=1;k2=0; } else if (x0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=0;k2=1; } else { i1=0;j1=0;k1=1;i2=1;j2=0;k2=1; } }
    else { if (y0 < z0) { i1=0;j1=0;k1=1;i2=0;j2=1;k2=1; } else if (x0 < z0) { i1=0;j1=1;k1=0;i2=0;j2=1;k2=1; } else { i1=0;j1=1;k1=0;i2=1;j2=1;k2=0; } }
    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;
    const ii = i & 255, jj = j & 255, kk = k & 255;
    let n = 0;
    const c = (tt, gi, xx, yy, zz) => { if (tt < 0) return 0; tt *= tt; const g = grad3[gi]; return tt * tt * (g[0] * xx + g[1] * yy + g[2] * zz); };
    n += c(0.6 - x0*x0 - y0*y0 - z0*z0, perm[ii + perm[jj + perm[kk]]] % 12, x0, y0, z0);
    n += c(0.6 - x1*x1 - y1*y1 - z1*z1, perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] % 12, x1, y1, z1);
    n += c(0.6 - x2*x2 - y2*y2 - z2*z2, perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] % 12, x2, y2, z2);
    n += c(0.6 - x3*x3 - y3*y3 - z3*z3, perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] % 12, x3, y3, z3);
    return 32 * n;
  }
  const fbm = (x, y, z, o = 4) => { let a = 0, f = 1, amp = 0.5; for (let i = 0; i < o; i++) { a += amp * n3(x * f, y * f, z * f); f *= 2; amp *= 0.5; } return a; };
  return { n3, fbm };
}
const N = makeNoise(7);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
function hex(c) { const v = parseInt(c.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
function mixc(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, { srgb = true, wrap = false } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (wrap) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.needsUpdate = true; return t;
}
function pixelTex(w, h, fn, opts) {
  const [c, ctx] = canvas(w, h); const img = ctx.createImageData(w, h); const d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 4; const col = fn(x / w, y / h, x, y);
    d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = col.length > 3 ? col[3] : 255;
  }
  ctx.putImageData(img, 0, 0); return [c, ctx];
}

// ---------------------------------------------------------------- dimensions
const H = 2.3, RT = 1.0, RB = 0.72;
const cupR = (y) => RB + (RT - RB) * clamp(y / H);
const INNER = (y) => cupR(Math.min(y, H)) - 0.016;
const EDGE_Y = H + 0.012;

// ---------------------------------------------------------------- palettes
const BASES = {
  acai: { dark: '#12031a', mid: '#2f0a43', light: '#562072', frost: '#7d4a9a' },
  cupuacu: { dark: '#b88a4a', mid: '#e8c98d', light: '#f6e2b5', frost: '#fff1d2' },
  acaiTop: { dark: '#1e0532', mid: '#4a1470', light: '#7c34a6', frost: '#a865d0' },
  mix: { dark: '#3a1240', mid: '#6b2f6e', light: '#a0609c', frost: '#d6a8cf' },
};

const SIDE = {
  acai: { dark: '#14031f', mid: '#3d0f5a', light: '#6f2a92', frost: '#a777c2' },
  cupuacu: { dark: '#a87a3c', mid: '#dcbb7c', light: '#f3dcaa', frost: '#fff3d8' },
  acaiTop: { dark: '#14031f', mid: '#3d0f5a', light: '#6f2a92', frost: '#a777c2' },
  mix: { dark: '#2a0b30', mid: '#5c2660', light: '#9a5c96', frost: '#d6a8cf' },
};
// ---------------------------------------------------------------- textures (cached)
const cache = {};
let TOP_RES = 1024;
export function setTopRes(v) { TOP_RES = v; }
function acaiTopTextures(baseKey) {
  const k = 'top_' + baseKey + TOP_RES; if (cache[k]) return cache[k];
  const P = BASES[baseKey];
  const dark = hex(P.dark), mid = hex(P.mid), light = hex(P.light), frost = hex(P.frost);
  const S = TOP_RES;
  const heights = new Float32Array(S * S);
  const [cm] = pixelTex(S, S, (u, v, x, y) => {
    const wx = u * 6, wy = v * 6;
    const warp = N.fbm(wx * 0.5, wy * 0.5, 3.1, 3);
    const n = N.fbm(wx + warp * 0.7, wy - warp * 0.5, 1.7, 4);
    const fine = N.n3(u * 90, v * 90, 9.3) * 0.5 + N.n3(u * 220, v * 220, 2.1) * 0.25;
    const du = u - 0.5, dv = v - 0.5; const dist = Math.hypot(du, dv); const ang = Math.atan2(dv, du);
    const ridge = 0.5 + 0.5 * Math.sin(dist * 44 + ang + warp * 3.2);
    const t = clamp(0.5 + n * 0.5);
    heights[y * S + x] = t * 0.5 + ridge * 0.22 + fine * 0.14 + 0.08;
    let col = mixc(dark, mid, smooth(0.05, 0.95, t * 0.85 + ridge * 0.12));
    col = mixc(col, light, smooth(0.78, 1.0, t) * 0.3 + smooth(0.85, 1, ridge) * 0.12);
    const streak = smooth(0.7, 0.95, N.fbm(wx * 1.8 + warp * 3, wy * 1.8, 5.5, 4) * 0.5 + 0.5);
    col = mixc(col, frost, streak * 0.07);
    col = mixc(col, dark, clamp(-fine) * 0.3);
    return col;
  });
  const [bm] = pixelTex(S, S, (u, v, x, y) => { const h = clamp(heights[y * S + x]) * 255; return [h, h, h]; });
  cache[k] = { map: tex(cm, { wrap: true }), bump: tex(bm, { srgb: false, wrap: true }) };
  return cache[k];
}

function sideTexture(baseKey, layered = true) {
  const k = 'side_' + baseKey + layered; if (cache[k]) return cache[k];
  const P = SIDE[baseKey];
  const W = 2048, Hh = 1024;
  const dark = hex(P.dark), mid = hex(P.mid), light = hex(P.light), frost = hex(P.frost);
  const milk = hex('#f3e2bb'), milk2 = hex('#e2c992');
  const cyl = (u) => [Math.cos(u * Math.PI * 2) * 2.4, Math.sin(u * Math.PI * 2) * 2.4];
  const base = new Uint8ClampedArray(W * Hh * 4);
  const [c, ctx] = pixelTex(W, Hh, (u, vv, px, py) => {
    const v = 1 - vv; const [cx, cz] = cyl(u);
    const n = N.fbm(cx * 1.1, v * 3.2, cz * 1.1, 5);
    const sm = N.fbm(cx * 0.7 + v * 1.5, v * 16, cz * 0.7, 4);
    const t = clamp(0.32 + n * 0.75);
    let col = mixc(dark, mid, t);
    col = mixc(col, light, smooth(0.18, 0.62, sm) * 0.55);
    col = mixc(col, frost, smooth(0.62, 0.95, N.fbm(cx * 2.2, v * 22, cz * 2.2, 3) * 0.5 + 0.5) * 0.32);
    const pocket = N.n3(cx * 26, v * 70, cz * 26);
    if (pocket > 0.66) col = mixc(col, dark, 0.7);
    if (pocket > 0.6 && pocket < 0.66) col = mixc(col, frost, 0.35);
    if (layered) {
      // condensed milk band with drips
      const top = 0.235 + N.n3(cx * 1.6, 3.3, cz * 1.6) * 0.022 + N.n3(cx * 7, 1.2, cz * 7) * 0.006;
      const drip = Math.pow(Math.max(0, N.n3(cx * 3.2, 8.1, cz * 3.2) - 0.3), 1.2) * 0.2;
      const bot = 0.17 + N.n3(cx * 2.2, 7.7, cz * 2.2) * 0.018 - drip;
      if (v < top && v > bot) {
        const edge = Math.min(v - bot, top - v);
        const a = smooth(0.0, 0.012, edge);
        const tone = clamp(0.5 + N.fbm(cx * 4, v * 40, cz * 4, 3) * 0.8);
        col = mixc(col, mixc(milk2, milk, tone), a * 0.96);
      }
      // granola band base (chunks drawn later)
      const gt = 0.345 + N.n3(cx * 2, 5.5, cz * 2) * 0.02, gb = 0.25 + N.n3(cx * 2.4, 9.9, cz * 2.4) * 0.015;
      if (v < gt && v > gb) col = mixc(col, hex('#2e1608'), 0.85);
    }
    return col;
  });
  if (layered) {
    const rnd = mulberry32(5);
    // granola chunks
    for (let i = 0; i < 1500; i++) {
      const u = rnd(); const [cx, cz] = cyl(u);
      const gt = 0.345 + N.n3(cx * 2, 5.5, cz * 2) * 0.02, gb = 0.25 + N.n3(cx * 2.4, 9.9, cz * 2.4) * 0.015;
      const v = gb + rnd() * (gt - gb); const x = u * W, y = (1 - v) * Hh;
      const r = 4 + Math.pow(rnd(), 2) * 16; const sides = 5 + Math.floor(rnd() * 3);
      const colr = GRANOLA_COLS[Math.floor(rnd() * GRANOLA_COLS.length)];
      ctx.save(); ctx.translate(x, y); ctx.rotate(rnd() * 6.28);
      ctx.beginPath();
      for (let s2 = 0; s2 < sides; s2++) { const a = (s2 / sides) * 6.28; const rr = r * (0.7 + rnd() * 0.5); ctx.lineTo(Math.cos(a) * rr * 1.2, Math.sin(a) * rr * 0.9); }
      ctx.closePath();
      ctx.fillStyle = colr; ctx.fill();
      ctx.strokeStyle = 'rgba(40,18,6,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = 'rgba(255,235,190,0.22)'; ctx.beginPath(); ctx.ellipse(-r * 0.25, -r * 0.25, r * 0.4, r * 0.25, 0.4, 0, 7); ctx.fill();
      ctx.restore();
    }
    // fruit pressed on the wall
    const [fc, fx] = canvas(W, Hh);
    const items = 7;
    for (let i = 0; i < items; i++) {
      const u = (i + 0.3 + rnd() * 0.4) / items; const v = 0.6 + rnd() * 0.16;
      const x = u * W, y = (1 - v) * Hh; const isBanana = i % 2 === 0;
      fx.save(); fx.translate(x, y); fx.rotate((rnd() - 0.5) * 0.6);
      if (isBanana) {
        const rx = 58, ry = 72;
        const g = fx.createRadialGradient(0, 0, 3, 0, 0, rx);
        g.addColorStop(0, '#f6ecc4'); g.addColorStop(0.6, '#efdf9f'); g.addColorStop(0.9, '#e2c983'); g.addColorStop(1, 'rgba(200,170,100,0.9)');
        fx.fillStyle = g; fx.beginPath(); fx.ellipse(0, 0, rx, ry, 0, 0, 7); fx.fill();
        fx.strokeStyle = 'rgba(200,170,105,0.35)'; fx.lineWidth = 1.2;
        for (let a = 0; a < 22; a++) { const ang = (a / 22) * 6.28; fx.beginPath(); fx.moveTo(Math.cos(ang) * 10, Math.sin(ang) * 12); fx.lineTo(Math.cos(ang) * rx * 0.85, Math.sin(ang) * ry * 0.85); fx.stroke(); }
        fx.fillStyle = 'rgba(110,86,48,0.85)';
        for (let a = 0; a < 3; a++) { const ang = (a / 3) * 6.28 + 0.4; fx.beginPath(); fx.ellipse(Math.cos(ang) * 7, Math.sin(ang) * 9, 2.6, 3.6, ang, 0, 7); fx.fill(); }
      } else {
        const rx = 54, ry = 80;
        fx.beginPath(); fx.moveTo(0, ry); fx.bezierCurveTo(rx * 1.15, ry * 0.2, rx * 0.95, -ry * 0.9, 0, -ry * 0.72); fx.bezierCurveTo(-rx * 0.95, -ry * 0.9, -rx * 1.15, ry * 0.2, 0, ry); fx.closePath();
        fx.save(); fx.clip();
        const g = fx.createRadialGradient(0, -6, 4, 0, 0, rx * 1.25);
        g.addColorStop(0, '#fde6e4'); g.addColorStop(0.4, '#f49aa6'); g.addColorStop(0.78, '#db2d48'); g.addColorStop(1, '#9e0b25');
        fx.fillStyle = g; fx.fillRect(-rx * 1.5, -ry * 1.5, rx * 3, ry * 3);
        fx.strokeStyle = 'rgba(255,240,238,0.75)'; fx.lineWidth = 5; fx.beginPath(); fx.moveTo(0, -ry * 0.55); fx.quadraticCurveTo(3, 0, 0, ry * 0.65); fx.stroke();
        fx.lineWidth = 1.3; fx.strokeStyle = 'rgba(255,232,232,0.5)';
        for (let a = 0; a < 16; a++) { const ang = (a / 16) * 6.28; fx.beginPath(); fx.moveTo(Math.cos(ang) * 8, Math.sin(ang) * 12); fx.lineTo(Math.cos(ang) * rx * 0.88, Math.sin(ang) * ry * 0.84); fx.stroke(); }
        fx.restore();
      }
      fx.restore();
    }
    // composite fruit with açaí occlusion
    const fd = fx.getImageData(0, 0, W, Hh).data; const bd = ctx.getImageData(0, 0, W, Hh); const d = bd.data;
    const [blc, blx] = canvas(W, Hh); blx.filter = 'blur(9px)'; blx.drawImage(fc, 0, 0); const bl = blx.getImageData(0, 0, W, Hh).data;
    for (let py = 0; py < Hh; py++) for (let px = 0; px < W; px++) {
      const o = (py * W + px) * 4; const fa = fd[o + 3] / 255; if (fa < 0.01) continue;
      const u = px / W, v = 1 - py / Hh; const [cx, cz] = cyl(u);
      const ba = bl[o + 3] / 255; const nn = N.fbm(cx * 9, v * 40, cz * 9, 3);
      const a = fa * smooth(0.45, 0.85, ba + nn * 0.35) * 0.97;
      d[o] = lerp(d[o], fd[o], a); d[o + 1] = lerp(d[o + 1], fd[o + 1], a); d[o + 2] = lerp(d[o + 2], fd[o + 2], a);
    }
    ctx.putImageData(bd, 0, 0);
  }
  cache[k] = tex(c, { wrap: true });
  return cache[k];
}

function strawberryTextures() {
  if (cache.straw) return cache.straw;
  const S = 1024; const rnd = mulberry32(9);
  const [c, ctx] = pixelTex(S, S, (u, v) => {
    const n = N.fbm(u * 8, v * 8, 2, 4);
    const top = smooth(0.78, 1.0, v);
    let col = mixc(hex('#e0233c'), hex('#b40f2a'), clamp(0.5 + n));
    col = mixc(col, hex('#f05a52'), clamp(n * 0.6));
    col = mixc(col, hex('#f2b9a0'), top * 0.5);
    return col;
  });
  const [bc, bctx] = canvas(S, S); bctx.fillStyle = '#8a8a8a'; bctx.fillRect(0, 0, S, S);
  const rows = 16;
  for (let r = 0; r < rows; r++) {
    const v = 0.06 + (r / rows) * 0.82; const count = Math.round(lerp(8, 22, Math.sin(v * Math.PI)));
    for (let i = 0; i < count; i++) {
      const u = (i + (r % 2) * 0.5) / count + (rnd() - 0.5) * 0.01; const x = u * S, y = (1 - v) * S;
      // pit
      const pg = bctx.createRadialGradient(x, y, 0, x, y, 16); pg.addColorStop(0, '#3a3a3a'); pg.addColorStop(1, 'rgba(138,138,138,0)');
      bctx.fillStyle = pg; bctx.beginPath(); bctx.ellipse(x, y, 16, 20, 0, 0, Math.PI * 2); bctx.fill();
      bctx.fillStyle = '#d0d0d0'; bctx.beginPath(); bctx.ellipse(x, y + 1, 4, 6, 0, 0, Math.PI * 2); bctx.fill();
      // color
      const g = ctx.createRadialGradient(x, y, 0, x, y, 14); g.addColorStop(0, 'rgba(120,8,25,0.55)'); g.addColorStop(1, 'rgba(120,8,25,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, 14, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rnd() > 0.3 ? '#efcf56' : '#e5a843'; ctx.beginPath(); ctx.ellipse(x, y + 1, 3.6, 5.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,230,0.7)'; ctx.beginPath(); ctx.ellipse(x - 1, y - 1, 1.2, 1.8, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  // cut face
  const [fc, fctx] = canvas(512, 512);
  let g = fctx.createRadialGradient(256, 230, 10, 256, 256, 300);
  g.addColorStop(0, '#fff3f0'); g.addColorStop(0.3, '#f8c2c4'); g.addColorStop(0.62, '#ef7083'); g.addColorStop(0.82, '#d81f3c'); g.addColorStop(1, '#b30c27');
  fctx.fillStyle = g; fctx.fillRect(0, 0, 512, 512);
  fctx.filter = 'blur(3px)'; fctx.strokeStyle = 'rgba(255,248,244,0.6)'; fctx.lineWidth = 16; fctx.lineCap = 'round';
  fctx.beginPath(); fctx.moveTo(256, 90); fctx.bezierCurveTo(240, 220, 270, 330, 256, 440); fctx.stroke();
  fctx.lineWidth = 2; fctx.strokeStyle = 'rgba(255,240,240,0.22)';
  for (let a = 0; a < 22; a++) { const ang = a / 22 * Math.PI * 2; fctx.beginPath(); fctx.moveTo(256 + Math.cos(ang) * 30, 260 + Math.sin(ang) * 40); fctx.lineTo(256 + Math.cos(ang) * 210, 256 + Math.sin(ang) * 230); fctx.stroke(); }
  fctx.filter = 'none'; fctx.globalAlpha = 0.16;
  for (let i = 0; i < 400; i++) { fctx.fillStyle = rnd() > 0.5 ? '#ffffff' : '#c41634'; fctx.beginPath(); fctx.arc(rnd() * 512, rnd() * 512, rnd() * 3, 0, 7); fctx.fill(); }
  fctx.globalAlpha = 1;
  cache.straw = { map: tex(c), bump: tex(bc, { srgb: false }), face: tex(fc) };
  return cache.straw;
}

function capTexture(kind) {
  const k = 'cap_' + kind; if (cache[k]) return cache[k];
  const S = 512; const [c, ctx] = canvas(S, S); const rnd = mulberry32(kind.length * 13);
  const C = S / 2;
  if (kind === 'banana') {
    let g = ctx.createRadialGradient(C, C, 5, C, C, C);
    g.addColorStop(0, '#fbf3cf'); g.addColorStop(0.55, '#f5e6ab'); g.addColorStop(0.86, '#ecd68c'); g.addColorStop(0.95, '#dcc178'); g.addColorStop(1, '#c9ad62');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = 'rgba(205,175,100,0.35)'; ctx.lineWidth = 2;
    for (let a = 0; a < 40; a++) { const ang = a / 40 * Math.PI * 2 + rnd() * 0.05; ctx.beginPath(); ctx.moveTo(C + Math.cos(ang) * 30, C + Math.sin(ang) * 30); ctx.lineTo(C + Math.cos(ang) * 225, C + Math.sin(ang) * 225); ctx.stroke(); }
    const sg = ctx.createRadialGradient(C, C, 0, C, C, 60); sg.addColorStop(0, 'rgba(220,200,140,0.8)'); sg.addColorStop(1, 'rgba(220,200,140,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(C, C, 60, 0, 7); ctx.fill();
    ctx.fillStyle = '#5c4728';
    for (let a = 0; a < 3; a++) { const ang = a / 3 * Math.PI * 2 + 0.4; ctx.beginPath(); ctx.ellipse(C + Math.cos(ang) * 22, C + Math.sin(ang) * 22, 6, 9, ang, 0, 7); ctx.fill(); }
    for (let i = 0; i < 18; i++) { const ang = rnd() * 7, rr = 30 + rnd() * 25; ctx.fillStyle = 'rgba(110,85,50,0.5)'; ctx.beginPath(); ctx.arc(C + Math.cos(ang) * rr, C + Math.sin(ang) * rr, 2 + rnd() * 2, 0, 7); ctx.fill(); }
  } else if (kind === 'kiwi') {
    let g = ctx.createRadialGradient(C, C, 5, C, C, C);
    g.addColorStop(0, '#f4f5d8'); g.addColorStop(0.16, '#eef2c4'); g.addColorStop(0.3, '#a6cc3d'); g.addColorStop(0.8, '#7fb22a'); g.addColorStop(0.93, '#6a9c22'); g.addColorStop(0.96, '#8a6a3a'); g.addColorStop(1, '#5e4428');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = 'rgba(235,245,200,0.55)'; ctx.lineWidth = 3;
    for (let a = 0; a < 46; a++) { const ang = a / 46 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(C + Math.cos(ang) * 50, C + Math.sin(ang) * 50); ctx.lineTo(C + Math.cos(ang) * 205, C + Math.sin(ang) * 205); ctx.stroke(); }
    for (let a = 0; a < 58; a++) { const ang = a / 58 * Math.PI * 2 + rnd() * 0.05, rr = 70 + rnd() * 18; ctx.save(); ctx.translate(C + Math.cos(ang) * rr, C + Math.sin(ang) * rr); ctx.rotate(ang); ctx.fillStyle = '#121008'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 3.6, 0, 0, 7); ctx.fill(); ctx.restore(); }
  } else if (kind === 'flesh') {
    ctx.fillStyle = '#f2df9f'; ctx.fillRect(0, 0, S, S);
  }
  cache[k] = tex(c); return cache[k];
}

// ---------------------------------------------------------------- materials
function mats(baseKey = 'acai') {
  const k = 'mats_' + baseKey; if (cache[k]) return cache[k];
  const top = acaiTopTextures(baseKey);
  const s = strawberryTextures();
  const m = {
    cup: new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.08, transmission: 1, thickness: 0.05, ior: 1.46, clearcoat: 1, clearcoatRoughness: 0.05, specularIntensity: 1, envMapIntensity: 2.2, attenuationColor: new THREE.Color('#f4eefa'), attenuationDistance: 3 }),
    rim: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, transmission: 1, thickness: 0.02, ior: 1.3, clearcoat: 1, envMapIntensity: 2 }),
    side: new THREE.MeshPhysicalMaterial({ map: sideTexture(baseKey), roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.5 }),
    sidePlain: new THREE.MeshPhysicalMaterial({ map: sideTexture(baseKey, false), roughness: 0.55 }),
    top: new THREE.MeshPhysicalMaterial({ map: top.map, bumpMap: top.bump, bumpScale: 0.7, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.35 }),
    straw: new THREE.MeshPhysicalMaterial({ map: s.map, bumpMap: s.bump, bumpScale: 3, roughness: 0.34, clearcoat: 0.6, clearcoatRoughness: 0.18, sheen: 0.2, sheenColor: new THREE.Color('#ff9a9a') }),
    strawFace: new THREE.MeshPhysicalMaterial({ map: s.face, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide }),
    leaf: new THREE.MeshPhysicalMaterial({ color: '#4c8a2a', roughness: 0.5, clearcoat: 0.5, side: THREE.DoubleSide }),
    bananaCap: new THREE.MeshPhysicalMaterial({ map: capTexture('banana'), roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.3 }),
    bananaSide: new THREE.MeshPhysicalMaterial({ color: '#dcc274', roughness: 0.55, clearcoat: 0.2 }),
    kiwiCap: new THREE.MeshPhysicalMaterial({ map: capTexture('kiwi'), roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 }),
    kiwiSide: new THREE.MeshPhysicalMaterial({ color: '#6f5232', roughness: 0.9 }),
    mango: new THREE.MeshPhysicalMaterial({ color: '#ffa51f', roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.15, sheen: 0.4, sheenColor: new THREE.Color('#ffd27a') }),
    granola: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0 }),
    milk: new THREE.MeshPhysicalMaterial({ color: '#f2deb2', roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.5, sheenColor: new THREE.Color('#fff8ea'), specularIntensity: 1 }),
    choc: new THREE.MeshPhysicalMaterial({ color: '#3a1f14', roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 }),
    honey: new THREE.MeshPhysicalMaterial({ color: '#d98a12', roughness: 0.08, clearcoat: 1, transmission: 0.35, thickness: 0.2, ior: 1.5 }),
    powder: new THREE.MeshStandardMaterial({ color: '#fbf6ea', roughness: 1 }),
    pacoca: new THREE.MeshStandardMaterial({ color: '#c99d63', roughness: 0.95 }),
    berry: new THREE.MeshPhysicalMaterial({ color: '#241030', roughness: 0.45, clearcoat: 0.6, sheen: 1, sheenColor: new THREE.Color('#6a5a9a'), sheenRoughness: 0.5 }),
    drop: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.0, transmission: 1, thickness: 0.03, ior: 1.33, clearcoat: 1, specularIntensity: 1, envMapIntensity: 1.6 }),
    spoon: new THREE.MeshPhysicalMaterial({ color: '#8137C8', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 }),
  };
  cache[k] = m; return m;
}

// ---------------------------------------------------------------- geometry builders
function cupGeometry() {
  if (cache.cupGeo) return cache.cupGeo;
  const pts = [];
  pts.push(new THREE.Vector2(0.0, 0.035));
  pts.push(new THREE.Vector2(RB - 0.06, 0.035));
  pts.push(new THREE.Vector2(RB - 0.04, 0.0));
  for (let i = 0; i <= 40; i++) { const y = (i / 40) * H; pts.push(new THREE.Vector2(cupR(y) + 0.004, y)); }
  const g = new THREE.LatheGeometry(pts, 160);
  const rim = new THREE.TorusGeometry(RT + 0.01, 0.014, 16, 160); rim.rotateX(Math.PI / 2); rim.translate(0, H, 0);
  cache.cupGeo = { body: g, rim };
  return cache.cupGeo;
}

function contentsGeometry() {
  if (cache.contGeo) return cache.contGeo;
  const pts = []; const y0 = 0.05, y1 = EDGE_Y;
  pts.push(new THREE.Vector2(0, y0));
  for (let i = 0; i <= 40; i++) { const y = lerp(y0, y1, i / 40); pts.push(new THREE.Vector2(INNER(y), y)); }
  const g = new THREE.LatheGeometry(pts, 160);
  // remap v so the side texture uses only the wall part
  const uv = g.attributes.uv; const pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) { uv.setY(i, clamp((pos.getY(i) - y0) / (y1 - y0))); }
  cache.contGeo = g; return g;
}

// top surface height
function topHeight(x, z, bare = false) {
  const R = INNER(EDGE_Y); const r = Math.hypot(x, z) / R;
  if (r > 1) return EDGE_Y;
  const th = Math.atan2(z, x);
  const dome = 0.24 * Math.pow(1 - r * r, 0.75);
  const swirl = 0.03 * Math.sin(th * 2 + r * 12) * Math.sin(Math.PI * r);
  const lumps = N.fbm(x * 2.2, z * 2.2, 0.5, 3) * 0.05 * (1 - r * 0.6);
  return EDGE_Y + dome + swirl + lumps + 0.005;
}

function topGeometry() {
  if (cache.topGeo) return cache.topGeo;
  const R = INNER(EDGE_Y); const rings = 90, segs = 200;
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= rings; i++) {
    const r = (i / rings) * R;
    for (let j = 0; j <= segs; j++) {
      const th = (j / segs) * Math.PI * 2; const x = Math.cos(th) * r, z = Math.sin(th) * r;
      let y = topHeight(x, z);
      if (i === rings) y = EDGE_Y;
      pos.push(x, y, z); uv.push(x / (2 * R) * 0.96 + 0.5, z / (2 * R) * 0.96 + 0.5);
    }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < segs; j++) {
    const a = i * (segs + 1) + j, b = a + segs + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  cache.topGeo = g; return g;
}

const STRAW_PROFILE = [[0, -0.5], [0.1, -0.47], [0.21, -0.39], [0.31, -0.25], [0.38, -0.09], [0.415, 0.06], [0.41, 0.18], [0.36, 0.28], [0.26, 0.35], [0.13, 0.385], [0, 0.39]];
function strawberryGeometry(half, seed = 1) {
  const k = 'sg_' + half + seed; if (cache[k]) return cache[k];
  const pts = STRAW_PROFILE.map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(pts, 64, 0, half ? Math.PI : Math.PI * 2);
  const nz = makeNoise(seed);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = 1 + nz.n3(x * 3, y * 3, z * 3) * 0.06;
    p.setXYZ(i, x * n * 1.0, y, z * n * 0.94);
  }
  g.computeVertexNormals();
  let face = null;
  if (half) {
    const shape = new THREE.Shape();
    shape.moveTo(0, STRAW_PROFILE[0][1]);
    for (const [r, y] of STRAW_PROFILE) shape.lineTo(r * 0.94, y);
    for (let i = STRAW_PROFILE.length - 1; i >= 0; i--) { const [r, y] = STRAW_PROFILE[i]; shape.lineTo(-r * 0.94, y); }
    face = new THREE.ShapeGeometry(shape, 24);
    const uv = face.attributes.uv; const fp = face.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, fp.getX(i) / 0.9 + 0.5, (fp.getY(i) + 0.5) / 0.9);
    face.rotateY(-Math.PI / 2);
  }
  cache[k] = { shell: g, face }; return cache[k];
}

function leafGeometry() {
  if (cache.leaf) return cache.leaf;
  const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(0.09, 0.12, 0, 0.3); s.quadraticCurveTo(-0.09, 0.12, 0, 0);
  const g = new THREE.ShapeGeometry(s, 12);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setZ(i, -y * y * 1.6 + Math.abs(p.getX(i)) * 0.4); }
  g.computeVertexNormals(); cache.leaf = g; return g;
}

function makeStrawberry(m, { half = false, seed = 1, calyx = true } = {}) {
  const grp = new THREE.Group();
  const geo = strawberryGeometry(half, seed);
  const shell = new THREE.Mesh(geo.shell, m.straw); shell.castShadow = shell.receiveShadow = true; grp.add(shell);
  if (half) { const f = new THREE.Mesh(geo.face, m.strawFace); f.castShadow = f.receiveShadow = true; grp.add(f); }
  if (calyx) {
    const lg = leafGeometry(); const n = 7;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + seed;
      if (half && Math.sin(a) < -0.05) continue;
      const l = new THREE.Mesh(lg, m.leaf); l.castShadow = true;
      l.position.set(0, 0.37, 0);
      l.rotation.order = 'YXZ'; l.rotation.y = a; l.rotation.x = -1.25 + Math.random() * 0.15;
      l.scale.setScalar(0.85 + Math.random() * 0.3);
      grp.add(l);
    }
    if (!half) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.14, 8), m.leaf); st.position.y = 0.44; st.rotation.z = 0.2; grp.add(st); }
  }
  return grp;
}

function makeSlice(m, kind, r = 0.19, h = 0.065, seed = 3) {
  const g = new THREE.CylinderGeometry(r, r, h, 48, 1);
  const nz = makeNoise(seed); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const a = Math.atan2(z, x); const f = 1 + nz.n3(Math.cos(a) * 1.5, Math.sin(a) * 1.5, 0) * 0.05; p.setX(i, x * f); p.setZ(i, z * f); }
  g.computeVertexNormals();
  const mm = kind === 'kiwi' ? [m.kiwiSide, m.kiwiCap, m.kiwiCap] : [m.bananaSide, m.bananaCap, m.bananaCap];
  const mesh = new THREE.Mesh(g, mm); mesh.castShadow = mesh.receiveShadow = true; return mesh;
}

function granolaGeometries() {
  if (cache.gran) return cache.gran;
  const out = [];
  for (let v = 0; v < 6; v++) {
    const g = new THREE.IcosahedronGeometry(1, 2); const nz = makeNoise(100 + v); const p = g.attributes.position;
    const sx = 0.7 + v * 0.08, sy = 0.45 + (v % 3) * 0.12, sz = 0.8 + (v % 2) * 0.3;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const f = 1 + nz.n3(x * 1.7, y * 1.7, z * 1.7) * 0.35; p.setXYZ(i, x * f * sx, y * f * sy, z * f * sz); }
    g.computeVertexNormals(); out.push(g);
  }
  // oat flakes
  const oat = new THREE.SphereGeometry(1, 12, 8); oat.scale(1, 0.18, 0.8); out.push(oat);
  cache.gran = out; return out;
}
const GRANOLA_COLS = ['#c58a3b', '#a8682a', '#d9a65a', '#7d4a1f', '#e2c07c', '#b9772f', '#5f3815'];

function addGranola(grp, m, placeFn, count, seed = 5, scale = 0.042) {
  const geos = granolaGeometries(); const rnd = mulberry32(seed);
  const per = Math.ceil(count / geos.length);
  const dummy = new THREE.Object3D(); const col = new THREE.Color();
  geos.forEach((geo, gi) => {
    const im = new THREE.InstancedMesh(geo, m.granola, per); im.castShadow = im.receiveShadow = true;
    for (let i = 0; i < per; i++) {
      const p = placeFn(rnd);
      dummy.position.copy(p);
      dummy.rotation.set(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28);
      const s = scale * (0.6 + rnd() * 0.8) * (gi === geos.length - 1 ? 1.3 : 1);
      dummy.scale.setScalar(s); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix);
      col.set(gi === geos.length - 1 ? '#e8d2a0' : GRANOLA_COLS[Math.floor(rnd() * GRANOLA_COLS.length)]);
      im.setColorAt(i, col);
    }
    grp.add(im);
  });
}

// variable radius tube
function varTube(curve, segs, radial, radiusFn, flat = 0.75) {
  const frames = curve.computeFrenetFrames(segs, false);
  const pos = [], nor = [], idx = [];
  const P = new THREE.Vector3(), Nn = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs; curve.getPointAt(t, P); const r = radiusFn(t);
    const n = frames.normals[i], b = frames.binormals[i];
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2; const s = Math.sin(a), c = -Math.cos(a);
      Nn.set(c * n.x + s * b.x, c * n.y + s * b.y, c * n.z + s * b.z).normalize();
      pos.push(P.x + r * Nn.x, P.y + r * Nn.y * flat, P.z + r * Nn.z); nor.push(Nn.x, Nn.y, Nn.z);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}

const ray = new THREE.Raycaster();
function dropHeight(x, z, targets, fallback) {
  ray.set(new THREE.Vector3(x, 6, z), new THREE.Vector3(0, -1, 0));
  const hits = ray.intersectObjects(targets, true);
  return hits.length ? hits[0].point.y : fallback;
}

function addDrizzle(grp, mat, targets, { seed = 2, loops = 3.2, radius = 0.03, spread = 0.78, drips = 3, angle = 0, pattern = 'spiral' } = {}) {
  const rnd = mulberry32(seed);
  const pts = [];
  // spiral pour (default) or zig-zag
  const steps = 420; const R = INNER(EDGE_Y) * spread;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let x, z;
    if (pattern === 'zigzag') {
      const zz = lerp(-R * 0.9, R * 0.9, t) + N.n3(t * 5, seed, 1.3) * 0.08;
      const width = Math.sqrt(Math.max(0, R * R - zz * zz));
      const xx = Math.sin(t * Math.PI * loops * 2 + 0.3 + N.n3(t * 3, seed, 7.1) * 1.1) * width * (0.78 + 0.2 * N.n3(t * 6, seed, 3.3));
      const ca = Math.cos(angle), sa = Math.sin(angle);
      x = xx * ca - zz * sa; z = xx * sa + zz * ca;
    } else {
      const rr = R * (0.1 + 0.9 * t) * (1 + N.n3(t * 9, seed, 5.2) * 0.07);
      const th = loops * Math.PI * 2 * t + angle + N.n3(t * 3, seed, 2.4) * 0.5;
      x = Math.cos(th) * rr; z = Math.sin(th) * rr;
    }
    pts.push(new THREE.Vector3(x, 0, z));
  }
  grp.updateMatrixWorld(true);
  // drape
  let ys = pts.map((p) => dropHeight(p.x, p.z, targets, topHeight(p.x, p.z)) + radius * 0.25);
  const floor = pts.map((p) => topHeight(p.x, p.z) + radius * 0.3);
  for (let k = 0; k < 3; k++) ys = ys.map((y, i) => (i === 0 || i === ys.length - 1) ? y : Math.max(floor[i], (ys[i - 1] + 2 * y + ys[i + 1]) / 4));
  pts.forEach((p, i) => (p.y = ys[i]));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const geo = varTube(curve, 1200, 14, (t) => radius * (0.7 + 0.7 * Math.abs(N.n3(t * 14, seed, 8.8))) * smooth(0, 0.03, t) * smooth(1, 0.96, t) + 0.003, 0.3);
  const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = true; grp.add(mesh);
  // drips over the rim
  for (let d = 0; d < drips; d++) {
    const a = (d / drips) * Math.PI * 2 + rnd() * 0.8 + angle;
    const len = 0.25 + rnd() * 0.55;
    const ca = Math.cos(a), sa = Math.sin(a);
    const dp = [];
    const r0 = INNER(EDGE_Y) * 0.75;
    dp.push(new THREE.Vector3(ca * r0, topHeight(ca * r0, sa * r0) + 0.01, sa * r0));
    dp.push(new THREE.Vector3(ca * (RT - 0.05), EDGE_Y + 0.05, sa * (RT - 0.05)));
    dp.push(new THREE.Vector3(ca * (RT + 0.04), H + 0.01, sa * (RT + 0.04)));
    const steps2 = 6;
    for (let i = 1; i <= steps2; i++) { const y = H - (len * i) / steps2; const rr = cupR(y) + 0.03; const wob = Math.sin(i * 1.7 + d) * 0.012; dp.push(new THREE.Vector3(Math.cos(a + wob) * rr, y, Math.sin(a + wob) * rr)); }
    const c2 = new THREE.CatmullRomCurve3(dp);
    const g2 = varTube(c2, 140, 12, (t) => radius * lerp(1.0, 0.62, t) + (t > 0.86 ? radius * 0.55 * smooth(0.86, 0.95, t) * smooth(1.0, 0.95, t) : 0), 0.7);
    const m2 = new THREE.Mesh(g2, mat); m2.castShadow = true; grp.add(m2);
    const end = c2.getPointAt(1);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.95, 16, 12), mat); bulb.scale.set(1, 1.3, 0.7); bulb.position.copy(end); bulb.position.y -= radius * 0.4;
    // push bulb onto wall
    grp.add(bulb);
  }
}

function addDroplets(grp, m, count = 520, seed = 11) {
  const rnd = mulberry32(seed);
  const geo = new THREE.SphereGeometry(1, 14, 10);
  const im = new THREE.InstancedMesh(geo, m.drop, count);
  const d = new THREE.Object3D(); const slope = (RT - RB) / H;
  for (let i = 0; i < count; i++) {
    const y = 0.12 + Math.pow(rnd(), 0.8) * (H - 0.3);
    const a = rnd() * Math.PI * 2;
    const r = cupR(y) + 0.006;
    const nrm = new THREE.Vector3(Math.cos(a), -slope, Math.sin(a)).normalize();
    d.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    d.lookAt(d.position.clone().add(nrm));
    const big = rnd() < 0.12; const trail = rnd() < 0.05;
    let s = big ? 0.018 + rnd() * 0.02 : 0.004 + Math.pow(rnd(), 2) * 0.014;
    d.scale.set(s * (trail ? 0.8 : 1), s * (trail ? 2.8 : 1.15), s * 0.42);
    d.updateMatrix(); im.setMatrixAt(i, d.matrix);
  }
  grp.add(im);
}

// ---------------------------------------------------------------- top placement helpers
function onTop(x, z, lift = 0) { return new THREE.Vector3(x, topHeight(x, z) + lift, z); }

// ---------------------------------------------------------------- cup builder
// config: { base, bare, layered, toppings: { strawberries, bananas, granola, kiwi, mango, powder, pacoca, mint, spoon }, drizzle: 'condensed'|'chocolate'|'honey'|null, drizzle2, droplets }
export function buildCup(cfg = {}) {
  const base = cfg.base || 'acai';
  const m = mats(base);
  const grp = new THREE.Group();
  const cg = cupGeometry();
  const contents = new THREE.Mesh(contentsGeometry(), cfg.layered === false ? m.sidePlain : m.side); contents.receiveShadow = true; grp.add(contents);
  let topMat = m.top;
  if (cfg.matteTop) { topMat = m.top.clone(); topMat.clearcoat = 0.25; topMat.clearcoatRoughness = 0.5; topMat.roughness = 0.5; topMat.envMapIntensity = 0.25; topMat.bumpScale = 0.35; topMat.specularIntensity = 0.35; }
  const top = new THREE.Mesh(topGeometry(), topMat); top.receiveShadow = true; top.castShadow = true; grp.add(top);
  const cup = new THREE.Mesh(cg.body, m.cup); grp.add(cup);
  const rim = new THREE.Mesh(cg.rim, m.rim); grp.add(rim);
  if (cfg.droplets !== false) addDroplets(grp, m);
  const tp = cfg.toppings || {};
  const targets = [top];
  const rnd = mulberry32(cfg.seed || 21);
  if (!cfg.bare) {
    // strawberries
    const sCount = tp.strawberries ?? 0;
    const sPos = [[-0.3, -0.3, 0.6], [0.32, -0.36, 2.0], [-0.52, 0.18, 4.0], [0.02, -0.02, 5.2], [0.5, 0.22, 1.1], [-0.12, 0.5, 3.3]];
    for (let i = 0; i < Math.min(sCount, sPos.length); i++) {
      const [x, z, rot] = sPos[i];
      const half = i !== 3;
      const s = makeStrawberry(m, { half, seed: i + 1, calyx: true });
      const sc = half ? 0.6 : 0.56;
      s.scale.setScalar(sc);
      if (half) {
        const out = new THREE.Vector3(x, 0, z); if (out.length() < 0.05) out.set(0, 0, 1); out.normalize();
        const target = new THREE.Vector3(out.x * 0.75, 1.0, out.z * 0.75).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(-1, 0, 0), target);
        const spin = new THREE.Quaternion().setFromAxisAngle(target, rot);
        s.quaternion.copy(spin.multiply(q));
        s.position.copy(onTop(x, z, 0.07));
      } else { s.rotation.set(0.25, rot, 0.15); s.position.copy(onTop(x, z, 0.2)); }
      grp.add(s); targets.push(s);
    }
    // bananas
    const bCount = tp.bananas ?? 0;
    const bPos = [[0.3, 0.42], [0.58, 0.02], [0.08, 0.62], [-0.3, 0.32], [0.62, -0.32], [-0.6, -0.15], [0.25, -0.62]];
    for (let i = 0; i < Math.min(bCount, bPos.length); i++) {
      const [x, z] = bPos[i]; const sl = makeSlice(m, 'banana', 0.17 + rnd() * 0.03, 0.06, i + 3);
      const p = onTop(x, z, 0.05); sl.position.copy(p);
      sl.rotation.set(0.18 + rnd() * 0.32, rnd() * 6, (rnd() - 0.5) * 0.35);
      grp.add(sl); targets.push(sl);
    }
    const kCount = tp.kiwi ?? 0;
    const kPos = [[-0.4, -0.45], [0.48, 0.08], [-0.1, 0.35]];
    for (let i = 0; i < Math.min(kCount, kPos.length); i++) {
      const [x, z] = kPos[i]; const sl = makeSlice(m, 'kiwi', 0.2, 0.055, i + 30);
      sl.position.copy(onTop(x, z, 0.05)); sl.rotation.set(0.5 + rnd() * 0.4, rnd() * 6, (rnd() - 0.5) * 0.5); grp.add(sl); targets.push(sl);
    }
    const mCount = tp.mango ?? 0;
    for (let i = 0; i < mCount; i++) {
      const a = rnd() * Math.PI * 2, r = 0.15 + rnd() * 0.55;
      const b = new THREE.Mesh(new RoundedBoxGeometry(0.17, 0.15, 0.16, 3, 0.035), m.mango); b.castShadow = b.receiveShadow = true;
      b.position.copy(onTop(Math.cos(a) * r, Math.sin(a) * r, 0.06)); b.rotation.set(rnd(), rnd() * 6, rnd()); grp.add(b); targets.push(b);
    }
    if (tp.powder) {
      const g = new THREE.SphereGeometry(0.42, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
      const nz = makeNoise(77); const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const f = 1 + nz.fbm(x * 5, y * 5, z * 5, 3) * 0.25; p.setXYZ(i, x * f, y * f * 0.55, z * f); }
      g.computeVertexNormals();
      const mound = new THREE.Mesh(g, m.powder); mound.castShadow = mound.receiveShadow = true;
      mound.position.copy(onTop(0.08, 0.05, -0.04)); grp.add(mound); targets.push(mound);
      // dusting
      const dust = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), m.powder, 900); const d = new THREE.Object3D();
      for (let i = 0; i < 900; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 0.85; const x = Math.cos(a) * r, z = Math.sin(a) * r; d.position.copy(onTop(x, z, 0.004)); d.scale.setScalar(0.006 + rnd() * 0.01); d.rotation.set(rnd() * 6, rnd() * 6, 0); d.updateMatrix(); dust.setMatrixAt(i, d.matrix); }
      grp.add(dust);
    }
    if (tp.pacoca) {
      for (let i = 0; i < tp.pacoca; i++) {
        const a = rnd() * 6.28, r = 0.2 + rnd() * 0.5;
        const b = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.1, 0.13, 2, 0.02), m.pacoca); b.castShadow = true;
        b.position.copy(onTop(Math.cos(a) * r, Math.sin(a) * r, 0.04)); b.rotation.set(rnd(), rnd() * 6, rnd()); grp.add(b); targets.push(b);
      }
    }
    if (tp.granola) {
      const R = INNER(EDGE_Y);
      const arc = tp.granolaArc ?? [Math.PI * 0.55, Math.PI * 1.45];
      addGranola(grp, m, (r) => {
        const a = lerp(arc[0], arc[1], r()); const rr = R * (0.45 + Math.sqrt(r()) * 0.5);
        const x = Math.cos(a) * rr, z = Math.sin(a) * rr; return onTop(x, z, 0.012);
      }, tp.granola, 5);
    }
    if (tp.mint) {
      const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(0.12, 0.1, 0, 0.32); s.quadraticCurveTo(-0.12, 0.1, 0, 0);
      for (let i = 0; i < 2; i++) {
        const g = new THREE.ShapeGeometry(s, 16); const p = g.attributes.position;
        for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k); p.setZ(k, Math.abs(x) * 0.5 - y * y * 0.4); }
        g.computeVertexNormals();
        const l = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ color: '#3f9a3a', roughness: 0.4, clearcoat: 0.6, side: THREE.DoubleSide }));
        l.castShadow = true; l.position.copy(onTop(-0.05 + i * 0.06, 0.05, 0.16)); l.rotation.set(-1.0, i * 1.9 + 0.4, 0.2); l.scale.setScalar(1.1); grp.add(l);
      }
    }
    if (cfg.drizzle) {
      const mat = cfg.drizzle === 'chocolate' ? m.choc : cfg.drizzle === 'honey' ? m.honey : m.milk;
      addDrizzle(grp, mat, cfg.drapeAll ? targets : [top], { seed: 3, drips: cfg.drips ?? 3, radius: cfg.drizzle === 'chocolate' ? 0.034 : 0.03, loops: cfg.loops ?? 3.2, angle: 0.4, spread: 0.86, pattern: cfg.pattern || 'spiral' });
    }
    if (cfg.drizzle2) {
      const mat = cfg.drizzle2 === 'chocolate' ? m.choc : cfg.drizzle2 === 'honey' ? m.honey : m.milk;
      addDrizzle(grp, mat, targets, { seed: 8, drips: 1, radius: 0.026, loops: 4.5, angle: 1.9, spread: 0.7, pattern: 'zigzag' });
    }
    if (tp.spoon) {
      const sg = new THREE.Group();
      const handle = new THREE.Mesh(new RoundedBoxGeometry(0.09, 1.1, 0.025, 2, 0.012), m.spoon); handle.position.y = 0.55; sg.add(handle);
      const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), m.spoon); bowl.scale.set(1, 0.35, 1.3); bowl.rotation.x = Math.PI / 2; sg.add(bowl);
      sg.position.copy(onTop(-0.35, -0.15, -0.15)); sg.rotation.set(-0.35, 0.6, 0.3); sg.traverse((o) => (o.castShadow = true)); grp.add(sg);
    }
  } else if (cfg.drizzle && cfg.bareDrizzle) {
    addDrizzle(grp, m.milk, targets, { seed: 3, drips: cfg.drips ?? 3, loops: 4.5, angle: 0.4 });
  }
  return grp;
}

// ---------------------------------------------------------------- sprites
export function buildSprite(kind) {
  const m = mats('acai'); const grp = new THREE.Group(); const rnd = mulberry32(kind.length * 7 + 3);
  if (kind === 'strawberry') { const s = makeStrawberry(m, { half: false, seed: 2 }); s.rotation.set(0.35, 0.4, -0.25); grp.add(s); }
  else if (kind === 'strawberry-half') { const s = makeStrawberry(m, { half: true, seed: 4 }); s.rotation.set(0.12, Math.PI / 2 - 0.6, -0.1); grp.add(s); }
  else if (kind === 'banana-slice') { const sl = makeSlice(m, 'banana', 0.2, 0.07, 5); sl.rotation.set(1.05, 0, 0.25); grp.add(sl); }
  else if (kind === 'kiwi-slice') { const sl = makeSlice(m, 'kiwi', 0.22, 0.06, 6); sl.rotation.set(1.0, 0, -0.2); grp.add(sl); }
  else if (kind === 'mango') { const b = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.27, 0.28, 4, 0.06), m.mango); b.rotation.set(0.5, 0.7, 0.2); grp.add(b); }
  else if (kind === 'granola') { addGranola(grp, m, (r) => new THREE.Vector3((r() - 0.5) * 0.5, (r() - 0.5) * 0.28, (r() - 0.5) * 0.3), 46, 9, 0.05); }
  else if (kind === 'granola-bit') { addGranola(grp, m, (r) => new THREE.Vector3((r() - 0.5) * 0.06, (r() - 0.5) * 0.06, (r() - 0.5) * 0.06), 7, 13, 0.06); }
  else if (kind === 'milk-drop' || kind === 'choc-drop' || kind === 'acai-drop') {
    const pts = [];
    for (let i = 0; i <= 48; i++) { const t = Math.PI * (1 - i / 48); const r = Math.sin(t) * Math.pow(Math.sin(t / 2), 1.6) * 0.24; pts.push(new THREE.Vector2(Math.max(0.0001, r), Math.cos(t) * 0.3)); }
    const g = new THREE.LatheGeometry(pts, 48);
    const acaiGloss = new THREE.MeshPhysicalMaterial({ color: '#3d0f5a', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.4, sheenColor: new THREE.Color('#b47be0') });
    const d = new THREE.Mesh(g, kind === 'milk-drop' ? m.milk : kind === 'acai-drop' ? acaiGloss : m.choc); d.rotation.z = kind === 'acai-drop' ? 0 : 0.15; grp.add(d);
  }
  else if (kind === 'acai-berries') {
    const g = new THREE.SphereGeometry(0.075, 32, 20);
    const pos = [[0, 0, 0], [0.14, 0.03, 0.02], [-0.13, 0.02, 0.05], [0.06, 0.12, -0.04], [-0.06, 0.13, 0.03], [0.02, -0.1, 0.08], [0.15, -0.09, -0.03], [-0.15, -0.08, -0.02], [0.0, 0.05, 0.13]];
    for (const p of pos) { const s = new THREE.Mesh(g, m.berry); s.position.set(...p); s.scale.setScalar(0.9 + rnd() * 0.2); grp.add(s);
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.02, 8), new THREE.MeshStandardMaterial({ color: '#5a4630' })); tip.position.set(p[0], p[1] + 0.075, p[2]); grp.add(tip); }
    grp.rotation.set(0.4, 0.3, 0);
  }
  else if (kind === 'powder') {
    const g = new THREE.SphereGeometry(0.3, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2); const nz = makeNoise(77); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const f = 1 + nz.fbm(x * 6, y * 6, z * 6, 3) * 0.25; p.setXYZ(i, x * f, y * f * 0.7, z * f); }
    g.computeVertexNormals(); const mm = new THREE.Mesh(g, m.powder); mm.rotation.x = 0.35; grp.add(mm);
  }
  else if (kind === 'pacoca') { for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.1, 0.13, 2, 0.02), m.pacoca); b.position.set((rnd() - 0.5) * 0.25, (rnd() - 0.5) * 0.15, (rnd() - 0.5) * 0.1); b.rotation.set(rnd(), rnd() * 6, rnd()); grp.add(b); } }
  else if (kind === 'mint') {
    const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(0.14, 0.12, 0, 0.36); s.quadraticCurveTo(-0.14, 0.12, 0, 0);
    const g = new THREE.ShapeGeometry(s, 16); const p = g.attributes.position; for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k); p.setZ(k, Math.abs(x) * 0.5 - y * y * 0.3); } g.computeVertexNormals();
    const l = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ color: '#3f9a3a', roughness: 0.4, clearcoat: 0.6, side: THREE.DoubleSide })); l.rotation.set(-0.6, 0.3, 0.4); l.position.y = -0.15; grp.add(l);
  }
  grp.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return grp;
}

// ---------------------------------------------------------------- stage
let renderer, scene, camera, key, rim, fill, current;
export function setup({ width = 1000, height = 1250, ss = 2 } = {}) {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1);
  renderer.setSize(width * ss, height * ss, false);
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x000000, 0);
  document.body.appendChild(renderer.domElement);
  renderer.domElement.style.width = width + 'px';
  scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environmentIntensity = 0.55;
  camera = new THREE.PerspectiveCamera(20, width / height, 0.1, 100);
  key = new THREE.DirectionalLight('#fff1e2', 3.2); key.position.set(-6, 4.5, 3.5); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -2; key.shadow.camera.right = 2; key.shadow.camera.top = 2; key.shadow.camera.bottom = -2; key.shadow.camera.near = 1; key.shadow.camera.far = 20; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
  scene.add(key); scene.add(key.target); key.target.position.set(0, 1.6, 0);
  rim = new THREE.DirectionalLight('#ff9ccf', 3.0); rim.position.set(5, 3, -5); scene.add(rim);
  fill = new THREE.DirectionalLight('#d9c8ff', 0.7); fill.position.set(3, 1, 6); scene.add(fill);
  const top = new THREE.DirectionalLight('#ffffff', 1.0); top.position.set(0, 8, 1); scene.add(top);
  scene.add(new THREE.HemisphereLight('#fff6ec', '#3a1c4f', 0.35));
  window.__three = { renderer, scene, camera };
  return true;
}

export function show(obj) {
  if (current) scene.remove(current);
  current = obj; scene.add(obj);
}

export function view({ angle = 0, elevation = 12, distance = 9.4, target = [0, 1.32, 0], fov = 20, aspect } = {}) {
  current.rotation.y = (angle * Math.PI) / 180;
  camera.fov = fov; if (aspect) camera.aspect = aspect; camera.updateProjectionMatrix();
  const el = (elevation * Math.PI) / 180;
  camera.position.set(0, target[1] + Math.sin(el) * distance, Math.cos(el) * distance);
  camera.lookAt(new THREE.Vector3(...target));
}

export function setLights({ keyI = 3.2, rimI = 3.0, env = 0.55, exposure = 1.15 } = {}) {
  key.intensity = keyI; rim.intensity = rimI; scene.environmentIntensity = env; renderer.toneMappingExposure = exposure;
}

export function resize(width, height, ss = 2) {
  renderer.setSize(width * ss, height * ss, false); renderer.domElement.style.width = width + 'px';
  camera.aspect = width / height; camera.updateProjectionMatrix();
}

export function capture(width, height, type = 'image/webp', quality = 0.86) {
  renderer.render(scene, camera);
  const [c, ctx] = canvas(width, height);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(renderer.domElement, 0, 0, width, height);
  return c.toDataURL(type, quality);
}

export function frameObject(obj, { margin = 1.12, elevation = 12, fov = 30, aspect = 1 } = {}) {
  const box = new THREE.Box3().setFromObject(obj); const size = box.getSize(new THREE.Vector3()); const center = box.getCenter(new THREE.Vector3());
  const r = Math.max(size.x, size.y, size.z * 0.8) / 2 * margin;
  const dist = r / Math.tan((fov * Math.PI) / 360) / Math.min(1, aspect);
  return { distance: dist, target: [center.x, center.y, center.z], fov, elevation };
}

let ground = null;
export function setGround(on, opacity = 0.28) {
  if (!ground) {
    ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
    const [c, ctx] = canvas(256, 256); const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(0.5, 'rgba(0,0,0,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: tex(c, { srgb: false }), transparent: true, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2; blob.position.y = 0.002; ground.userData.blob = blob;
    key.shadow.camera.left = -6; key.shadow.camera.right = 6; key.shadow.camera.top = 6; key.shadow.camera.bottom = -6; key.shadow.camera.updateProjectionMatrix();
  }
  ground.material.opacity = opacity;
  if (on) { scene.add(ground); } else { scene.remove(ground); }
  return ground;
}
export function addBlobAt(x, z, s = 1) { const b = ground.userData.blob.clone(); b.position.set(x, 0.002, z); b.scale.setScalar(s); scene.add(b); return b; }
export function setBackground(spec) {
  if (!spec) { scene.background = null; return; }
  const [c, ctx] = canvas(1024, 1024);
  if (spec.type === 'radial') { const g = ctx.createRadialGradient(512, spec.cy ?? 420, 30, 512, 512, 760); g.addColorStop(0, spec.inner); g.addColorStop(1, spec.outer); ctx.fillStyle = g; }
  else { const g = ctx.createLinearGradient(0, 0, 0, 1024); g.addColorStop(0, spec.top); g.addColorStop(1, spec.bottom); ctx.fillStyle = g; }
  ctx.fillRect(0, 0, 1024, 1024);
  scene.background = tex(c);
}
export function group(...objs) { const g = new THREE.Group(); objs.forEach((o) => g.add(o)); return g; }
window.SCENE = { setGround, addBlobAt, setBackground, group, setTopRes, setup, buildCup, buildSprite, show, view, setLights, resize, capture, frameObject, THREE };
window.sceneReady = true;
