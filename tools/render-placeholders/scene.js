// Cena procedural do copo de açaí — renderiza offline os frames e recortes do site.
// v2: materiais físicos, estúdio com softboxes (reflexos no copo), frutas e granola 3D
// encostadas na parede do copo e captura com acúmulo (antisserrilhado, sombra suave e
// oclusão por várias direções de luz).
import * as THREE from 'three';
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
function halton(i, b) { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; }

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d', { willReadFrequently: true })]; }
function tex(c, { srgb = true, wrap = false } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (wrap) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.needsUpdate = true; return t;
}
function pixelTex(w, h, fn) {
  const [c, ctx] = canvas(w, h); const img = ctx.createImageData(w, h); const d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 4; const col = fn(x / w, y / h, x, y);
    d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = col.length > 3 ? col[3] : 255;
  }
  ctx.putImageData(img, 0, 0); return [c, ctx];
}

// ---------------------------------------------------------------- dimensões
const H = 2.3, RT = 1.0, RB = 0.72;
const cupR = (y) => RB + (RT - RB) * clamp(y / H);
const INNER = (y) => cupR(Math.min(y, H)) - 0.016;
const EDGE_Y = H + 0.012;
const SLOPE = (RT - RB) / H;
const Y0 = 0.05;
const vToY = (v) => lerp(Y0, EDGE_Y, v);

// ---------------------------------------------------------------- paletas (açaí real: roxo-vinho bem escuro)
const BASES = {
  acai: { dark: '#110207', mid: '#2a051b', light: '#470f33', smear: '#6f2b55' },
  acaiTop: { dark: '#120208', mid: '#30061f', light: '#561540', smear: '#7a3462' },
  cupuacu: { dark: '#a98244', mid: '#dcc08a', light: '#efdcb0', smear: '#fbf0d6' },
  mix: { dark: '#2a0a26', mid: '#5a2550', light: '#8c527f', smear: '#c79bbd' },
};

const cache = {};
let TOP_RES = 1024;
export function setTopRes(v) { TOP_RES = v; }

// ---------------------------------------------------------------- texturas
// Parede: açaí encostado no plástico — manchas alongadas, bolhas e falhas de contato.
function sideTexture(baseKey, layered = true) {
  const k = 'side_' + baseKey + layered; if (cache[k]) return cache[k];
  const P = BASES[baseKey === 'acaiTop' ? 'acai' : baseKey];
  const W = 2048, Hh = 1024;
  const dark = hex(P.dark), mid = hex(P.mid), light = hex(P.light), smear = hex(P.smear);
  const milk = hex('#f3e9d0'), milk2 = hex('#dccb9f');
  const cyl = (u) => [Math.cos(u * Math.PI * 2) * 2.4, Math.sin(u * Math.PI * 2) * 2.4];
  const [c] = pixelTex(W, Hh, (u, vv) => {
    const v = 1 - vv; const [cx, cz] = cyl(u);
    const warp = N.fbm(cx * 0.6, v * 1.6, cz * 0.6, 3);
    const body = N.fbm(cx * 0.9 + warp, v * 2.4, cz * 0.9, 4);
    let col = mixc(dark, mid, clamp(0.55 + body * 0.9));
    // manchas onde o creme ficou fino contra o plástico (alongadas na vertical/diagonal)
    const sm = N.fbm(cx * 1.4 + warp * 1.6 + v * 0.8, v * 7.5, cz * 1.4, 4);
    col = mixc(col, light, smooth(0.1, 0.55, sm) * 0.38);
    col = mixc(col, smear, smooth(0.35, 0.7, sm) * 0.18);
    // falhas de contato (mais escuras)
    const gap = N.fbm(cx * 1.8, v * 4.0 + 3.1, cz * 1.8, 3);
    col = mixc(col, dark, smooth(0.18, 0.42, gap) * 0.55);
    // bolhinhas de ar
    const b = N.n3(cx * 34, v * 86, cz * 34);
    if (b > 0.7) col = mixc(col, dark, 0.75);
    else if (b > 0.63) col = mixc(col, smear, 0.3 * (b - 0.63) / 0.07);
    if (layered) {
      // faixa de leite condensado com escorridos
      const top = 0.235 + N.n3(cx * 1.6, 3.3, cz * 1.6) * 0.022 + N.n3(cx * 7, 1.2, cz * 7) * 0.006;
      const drip = Math.pow(Math.max(0, N.n3(cx * 3.2, 8.1, cz * 3.2) - 0.3), 1.2) * 0.2;
      const bot = 0.17 + N.n3(cx * 2.2, 7.7, cz * 2.2) * 0.018 - drip;
      if (v < top && v > bot) {
        const edge = Math.min(v - bot, top - v);
        const a = smooth(0.0, 0.01, edge);
        const tone = clamp(0.55 + N.fbm(cx * 4, v * 40, cz * 4, 3) * 0.7);
        col = mixc(col, mixc(milk2, milk, tone), a * 0.97);
      }
      // fundo escuro da faixa de granola (os pedaços são 3D)
      const gt = 0.35 + N.n3(cx * 2, 5.5, cz * 2) * 0.02, gb = 0.245 + N.n3(cx * 2.4, 9.9, cz * 2.4) * 0.015;
      if (v < gt && v > gb) col = mixc(col, hex('#2a1408'), 0.9);
    }
    return col;
  });
  cache[k] = tex(c, { wrap: true });
  return cache[k];
}
const granolaBand = (cx, cz) => [0.245 + N.n3(cx * 2.4, 9.9, cz * 2.4) * 0.015, 0.35 + N.n3(cx * 2, 5.5, cz * 2) * 0.02];

function microBump() {
  if (cache.micro) return cache.micro;
  const S = 512;
  const [c] = pixelTex(S, S, (u, v) => {
    const a = u * Math.PI * 2, b = v * Math.PI * 2; // periódico
    const x = Math.cos(a) * 3, y = Math.sin(a) * 3, z = Math.cos(b) * 3, w = Math.sin(b) * 3;
    const n = N.fbm(x + w * 0.3, y + z * 0.3, z + w, 4) * 0.6 + N.n3(x * 6, y * 6 + w * 6, z * 6) * 0.25;
    const h = clamp(0.5 + n * 0.6) * 255; return [h, h, h];
  });
  cache.micro = tex(c, { srgb: false, wrap: true }); return cache.micro;
}

function strawberryTextures() {
  if (cache.straw) return cache.straw;
  const S = 1024; const rnd = mulberry32(9);
  const [c, ctx] = pixelTex(S, S, (u, v) => {
    const n = N.fbm(u * 9, v * 9, 2, 4);
    const top = smooth(0.8, 1.0, v);
    let col = mixc(hex('#b80f1f'), hex('#8e0816'), clamp(0.45 + n));
    col = mixc(col, hex('#d8262f'), clamp(n * 0.9));
    col = mixc(col, hex('#e98b72'), top * 0.6);
    col = mixc(col, hex('#f3d2b0'), smooth(0.93, 1.0, v) * 0.7);
    return col;
  });
  const [bc, bctx] = canvas(S, S); bctx.fillStyle = '#8a8a8a'; bctx.fillRect(0, 0, S, S);
  const rows = 18;
  for (let r = 0; r < rows; r++) {
    const v = 0.05 + (r / rows) * 0.84; const count = Math.round(lerp(8, 24, Math.sin(v * Math.PI)));
    for (let i = 0; i < count; i++) {
      const u = (i + (r % 2) * 0.5) / count + (rnd() - 0.5) * 0.012; const x = u * S, y = (1 - v) * S;
      const pg = bctx.createRadialGradient(x, y, 0, x, y, 13); pg.addColorStop(0, '#3c3c3c'); pg.addColorStop(1, 'rgba(138,138,138,0)');
      bctx.fillStyle = pg; bctx.beginPath(); bctx.ellipse(x, y, 13, 17, 0, 0, Math.PI * 2); bctx.fill();
      bctx.fillStyle = '#c6c6c6'; bctx.beginPath(); bctx.ellipse(x, y + 1, 3.2, 4.6, 0, 0, Math.PI * 2); bctx.fill();
      const g = ctx.createRadialGradient(x, y, 0, x, y, 12); g.addColorStop(0, 'rgba(90,4,14,0.6)'); g.addColorStop(1, 'rgba(90,4,14,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, 12, 16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rnd() > 0.35 ? '#e2c45a' : '#c9a23f'; ctx.beginPath(); ctx.ellipse(x, y + 1, 2.8, 4.2, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  // face cortada
  const [fc, fctx] = canvas(512, 512);
  // o rosto ocupa só o miolo da textura (UV ~0,08–0,92): gradiente curto para a borda ficar vermelha
  const g = fctx.createRadialGradient(256, 236, 6, 256, 250, 215);
  g.addColorStop(0, '#f1bcb4'); g.addColorStop(0.25, '#e9818a'); g.addColorStop(0.5, '#d93a50'); g.addColorStop(0.75, '#c51932'); g.addColorStop(0.92, '#a10d24'); g.addColorStop(1, '#850a1b');
  fctx.fillStyle = g; fctx.fillRect(0, 0, 512, 512);
  fctx.filter = 'blur(4px)'; fctx.strokeStyle = 'rgba(255,236,228,0.6)'; fctx.lineWidth = 13; fctx.lineCap = 'round';
  fctx.beginPath(); fctx.moveTo(256, 110); fctx.bezierCurveTo(244, 220, 268, 320, 256, 420); fctx.stroke();
  fctx.filter = 'blur(2px)'; fctx.lineWidth = 3;
  for (let a = 0; a < 28; a++) {
    const ang = (a / 28) * Math.PI * 2 + rnd() * 0.08;
    fctx.strokeStyle = `rgba(255,228,226,${0.06 + rnd() * 0.08})`;
    fctx.beginPath(); fctx.moveTo(256 + Math.cos(ang) * 26, 262 + Math.sin(ang) * 40);
    fctx.quadraticCurveTo(256 + Math.cos(ang + 0.1) * 120, 256 + Math.sin(ang + 0.1) * 140, 256 + Math.cos(ang) * 205, 256 + Math.sin(ang) * 225); fctx.stroke();
  }
  fctx.filter = 'none'; fctx.globalAlpha = 0.12;
  for (let i = 0; i < 900; i++) { fctx.fillStyle = rnd() > 0.5 ? '#ffffff' : '#a50c22'; fctx.beginPath(); fctx.arc(rnd() * 512, rnd() * 512, rnd() * 2.4, 0, 7); fctx.fill(); }
  fctx.globalAlpha = 1;
  cache.straw = { map: tex(c), bump: tex(bc, { srgb: false }), face: tex(fc) };
  return cache.straw;
}

function capTexture(kind) {
  const k = 'cap_' + kind; if (cache[k]) return cache[k];
  const S = 512; const [c, ctx] = canvas(S, S); const rnd = mulberry32(kind.length * 13);
  const C = S / 2;
  if (kind === 'banana') {
    const g = ctx.createRadialGradient(C, C, 4, C, C, C);
    g.addColorStop(0, '#e6d394'); g.addColorStop(0.2, '#f0dfa6'); g.addColorStop(0.55, '#eedb9a'); g.addColorStop(0.8, '#e6cc80'); g.addColorStop(0.93, '#d4b266'); g.addColorStop(1, '#b8954c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    // fibras radiais suaves
    ctx.lineWidth = 1.4;
    for (let a = 0; a < 70; a++) { const ang = a / 70 * Math.PI * 2 + rnd() * 0.04; ctx.strokeStyle = `rgba(214,186,118,${0.12 + rnd() * 0.14})`; ctx.beginPath(); ctx.moveTo(C + Math.cos(ang) * 40, C + Math.sin(ang) * 40); ctx.lineTo(C + Math.cos(ang) * 232, C + Math.sin(ang) * 232); ctx.stroke(); }
    // miolo: três lóbulos translúcidos + sementinhas
    ctx.save(); ctx.filter = 'blur(6px)';
    for (let a = 0; a < 3; a++) { const ang = a / 3 * Math.PI * 2 + 0.5; ctx.fillStyle = 'rgba(214,196,140,0.55)'; ctx.beginPath(); ctx.ellipse(C + Math.cos(ang) * 30, C + Math.sin(ang) * 30, 34, 18, ang, 0, 7); ctx.fill(); }
    ctx.restore();
    for (let a = 0; a < 3; a++) {
      const ang = a / 3 * Math.PI * 2 + 0.5;
      for (let s = 0; s < 8; s++) { const rr = 8 + s * 6 + rnd() * 3; ctx.fillStyle = `rgba(48,30,14,${0.6 + rnd() * 0.35})`; ctx.beginPath(); ctx.ellipse(C + Math.cos(ang) * rr + (rnd() - 0.5) * 6, C + Math.sin(ang) * rr + (rnd() - 0.5) * 6, 2.8 + rnd() * 1.4, 2 + rnd(), ang, 0, 7); ctx.fill(); }
    }
    ctx.fillStyle = 'rgba(95,70,40,0.5)'; ctx.beginPath(); ctx.arc(C, C, 4, 0, 7); ctx.fill();
    // manchinhas e anel fibroso perto da casca
    for (let i = 0; i < 260; i++) { const ang = rnd() * 6.28, rr = Math.sqrt(rnd()) * 230; ctx.fillStyle = `rgba(${rnd() > 0.5 ? '255,250,225' : '190,160,95'},${0.05 + rnd() * 0.08})`; ctx.beginPath(); ctx.arc(C + Math.cos(ang) * rr, C + Math.sin(ang) * rr, 3 + rnd() * 10, 0, 7); ctx.fill(); }
    ctx.strokeStyle = 'rgba(200,165,95,0.35)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(C, C, 205, 0, 7); ctx.stroke();
  } else if (kind === 'kiwi') {
    const g = ctx.createRadialGradient(C, C, 5, C, C, C);
    g.addColorStop(0, '#f1f2d4'); g.addColorStop(0.15, '#e9efc0'); g.addColorStop(0.3, '#9fc43a'); g.addColorStop(0.8, '#76a826'); g.addColorStop(0.93, '#5f911f'); g.addColorStop(0.96, '#7d6036'); g.addColorStop(1, '#553d24');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = 'rgba(235,245,200,0.45)'; ctx.lineWidth = 2.5;
    for (let a = 0; a < 52; a++) { const ang = a / 52 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(C + Math.cos(ang) * 48, C + Math.sin(ang) * 48); ctx.lineTo(C + Math.cos(ang) * 205, C + Math.sin(ang) * 205); ctx.stroke(); }
    for (let a = 0; a < 62; a++) { const ang = a / 62 * Math.PI * 2 + rnd() * 0.05, rr = 68 + rnd() * 20; ctx.save(); ctx.translate(C + Math.cos(ang) * rr, C + Math.sin(ang) * rr); ctx.rotate(ang); ctx.fillStyle = '#100d06'; ctx.beginPath(); ctx.ellipse(0, 0, 6.5, 3.2, 0, 0, 7); ctx.fill(); ctx.restore(); }
  }
  cache[k] = tex(c); return cache[k];
}

// ---------------------------------------------------------------- materiais
// Plástico do copo: só os reflexos (somados por cima do conteúdo) + leve opacidade no alfa.
// Evita o passe de transmissão do three, que custava ~3,5 s por passe no SwiftShader.
function glassReflect(env = 5, alpha = 0.14, roughness = 0.04) {
  return new THREE.MeshPhysicalMaterial({
    color: 0x000000, roughness, metalness: 0, specularIntensity: 1, envMapIntensity: env, opacity: alpha,
    transparent: true, depthWrite: false, blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.OneMinusDstAlphaFactor, blendDstAlpha: THREE.OneFactor,
  });
}
function mats(baseKey = 'acai') {
  const k = 'mats_' + baseKey; if (cache[k]) return cache[k];
  const s = strawberryTextures();
  const micro = microBump();
  const m = {
    cup: glassReflect(0.18),
    rim: glassReflect(0.3),
    haze: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.05, depthWrite: false }),
    rimHaze: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.1, depthWrite: false }),
    side: new THREE.MeshPhysicalMaterial({ map: sideTexture(baseKey), roughness: 0.3, bumpMap: micro, bumpScale: 0.25, envMapIntensity: 0.45 }),
    sidePlain: new THREE.MeshPhysicalMaterial({ map: sideTexture(baseKey, false), roughness: 0.3, bumpMap: micro, bumpScale: 0.25, envMapIntensity: 0.45 }),
    top: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.42, bumpMap: micro, bumpScale: 0.45, clearcoat: 0.18, clearcoatRoughness: 0.3, sheen: 0.35, sheenRoughness: 0.45, sheenColor: new THREE.Color('#8e3a72'), envMapIntensity: 0.25 }),
    straw: new THREE.MeshPhysicalMaterial({ map: s.map, bumpMap: s.bump, bumpScale: 2.4, roughness: 0.3, clearcoat: 0.85, clearcoatRoughness: 0.12, envMapIntensity: 0.7 }),
    strawFace: new THREE.MeshPhysicalMaterial({ map: s.face, roughness: 0.48, clearcoat: 0.05, clearcoatRoughness: 0.2, side: THREE.DoubleSide, envMapIntensity: 0.22 }),
    leaf: new THREE.MeshPhysicalMaterial({ color: '#3d7a2a', roughness: 0.45, clearcoat: 0.4, side: THREE.DoubleSide, envMapIntensity: 0.6, sheen: 0.3, sheenColor: new THREE.Color('#bfe39a') }),
    banana: new THREE.MeshPhysicalMaterial({ map: capTexture('banana'), roughness: 0.4, clearcoat: 0.35, clearcoatRoughness: 0.3, sheen: 0.25, sheenColor: new THREE.Color('#fff1c4'), envMapIntensity: 0.5, bumpMap: microBump(), bumpScale: 0.2 }),
    kiwi: new THREE.MeshPhysicalMaterial({ map: capTexture('kiwi'), roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.6 }),
    mango: new THREE.MeshPhysicalMaterial({ color: '#ff9f1c', roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.12, sheen: 0.4, sheenColor: new THREE.Color('#ffd27a'), envMapIntensity: 0.6 }),
    granola: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0, envMapIntensity: 0.5, bumpMap: micro, bumpScale: 0.6 }),
    milk: new THREE.MeshPhysicalMaterial({ color: '#f3e8cf', roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.6, sheenColor: new THREE.Color('#ffffff'), envMapIntensity: 0.85 }),
    choc: new THREE.MeshPhysicalMaterial({ color: '#341a10', roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.8 }),
    honey: new THREE.MeshPhysicalMaterial({ color: '#d98a12', roughness: 0.08, clearcoat: 1, envMapIntensity: 0.9, sheen: 0.5, sheenColor: new THREE.Color('#ffc65a') }),
    powder: new THREE.MeshStandardMaterial({ color: '#fbf6ea', roughness: 1, envMapIntensity: 0.6 }),
    pacoca: new THREE.MeshStandardMaterial({ color: '#c99d63', roughness: 0.95, envMapIntensity: 0.5, bumpMap: micro, bumpScale: 1.2 }),
    berry: new THREE.MeshPhysicalMaterial({ color: '#1e0b22', roughness: 0.4, clearcoat: 0.6, sheen: 1, sheenColor: new THREE.Color('#5e4c86'), sheenRoughness: 0.5, envMapIntensity: 0.7 }),
    drop: glassReflect(0.35, 0.2, 0.02),
    spoon: new THREE.MeshPhysicalMaterial({ color: '#8137C8', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 }),
  };
  // Com scene.environment o three ignora envMapIntensity do material; ligando o envMap
  // em cada material a intensidade individual passa a valer (copo forte, comida suave).
  for (const mat of Object.values(m)) if (ENV && 'envMap' in mat) mat.envMap = ENV;
  cache[k] = m; return m;
}

// ---------------------------------------------------------------- geometria do copo
function cupGeometry() {
  if (cache.cupGeo) return cache.cupGeo;
  const pts = [];
  pts.push(new THREE.Vector2(0.0, 0.035));
  pts.push(new THREE.Vector2(RB - 0.06, 0.035));
  pts.push(new THREE.Vector2(RB - 0.035, 0.0));
  for (let i = 0; i <= 48; i++) { const y = (i / 48) * H; pts.push(new THREE.Vector2(cupR(y) + 0.004, y)); }
  const g = new THREE.LatheGeometry(pts, 200);
  const rim = new THREE.TorusGeometry(RT + 0.012, 0.016, 20, 200); rim.rotateX(Math.PI / 2); rim.translate(0, H, 0);
  cache.cupGeo = { body: g, rim };
  return cache.cupGeo;
}

function contentsGeometry() {
  if (cache.contGeo) return cache.contGeo;
  const pts = []; const y1 = EDGE_Y;
  pts.push(new THREE.Vector2(0, Y0));
  for (let i = 0; i <= 48; i++) { const y = lerp(Y0, y1, i / 48); pts.push(new THREE.Vector2(INNER(y), y)); }
  const g = new THREE.LatheGeometry(pts, 200);
  const uv = g.attributes.uv; const pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setY(i, clamp((pos.getY(i) - Y0) / (y1 - Y0)));
  cache.contGeo = g; return g;
}

// topo: monte cremoso com dobras de colherada
function topHeight(x, z) {
  const R = INNER(EDGE_Y); const r = Math.hypot(x, z) / R;
  if (r > 1) return EDGE_Y;
  const th = Math.atan2(z, x);
  const dome = 0.3 * Math.pow(1 - r * r, 0.62) + 0.035 * N.n3(Math.cos(th) * 1.3, Math.sin(th) * 1.3, 6.6) * smooth(0.6, 0.95, r);
  const w = N.fbm(x * 1.2, z * 1.2, 4.2, 3);
  const folds = 0.04 * Math.sin(th * 1.0 + r * 15.0 + w * 3.8) * smooth(0.0, 0.25, r);
  const scoop = 0.07 * Math.max(0, N.fbm(x * 1.6 + 7.3, z * 1.6, 1.1, 3));
  const lumps = N.fbm(x * 3.4, z * 3.4, 0.5, 5) * 0.05 + Math.abs(N.n3(x * 9, z * 9, 2.2)) * 0.012;
  const fall = smooth(1.0, 0.82, r);
  return EDGE_Y + dome + (folds + scoop + lumps) * fall + 0.004;
}

function topGeometry(baseKey) {
  const k = 'topGeo_' + baseKey; if (cache[k]) return cache[k];
  const P = BASES[baseKey];
  const dark = new THREE.Color(P.dark), mid = new THREE.Color(P.mid), light = new THREE.Color(P.light);
  const R = INNER(EDGE_Y); const rings = 130, segs = 300;
  const pos = [], uv = [], col = [], idx = [];
  const tmp = new THREE.Color();
  for (let i = 0; i <= rings; i++) {
    const r = (i / rings) * R;
    for (let j = 0; j <= segs; j++) {
      const th = (j / segs) * Math.PI * 2; const x = Math.cos(th) * r, z = Math.sin(th) * r;
      let y = topHeight(x, z);
      if (i === rings) y = EDGE_Y;
      pos.push(x, y, z); uv.push(x / (2 * R) * 3 + 0.5, z / (2 * R) * 3 + 0.5);
      // cavidade: compara com a média dos vizinhos → vales mais escuros, cristas mais claras
      const e = 0.035;
      const avg = (topHeight(x + e, z) + topHeight(x - e, z) + topHeight(x, z + e) + topHeight(x, z - e)) / 4;
      const cav = clamp((y - avg) * 160, -1, 1);
      const n = N.fbm(x * 4, z * 4, 9.1, 3);
      tmp.copy(mid).lerp(dark, clamp(0.4 - cav * 0.8 + n * 0.5)).lerp(light, clamp(cav * 0.7 + n * 0.25) * 0.75);
      col.push(tmp.r, tmp.g, tmp.b);
    }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < segs; j++) {
    const a = i * (segs + 1) + j, b = a + segs + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  cache[k] = g; return g;
}

// ---------------------------------------------------------------- frutas
const STRAW_PROFILE = [[0, -0.5], [0.09, -0.47], [0.2, -0.39], [0.3, -0.26], [0.37, -0.1], [0.405, 0.05], [0.4, 0.18], [0.355, 0.28], [0.26, 0.35], [0.13, 0.385], [0, 0.39]];
function strawberryGeometry(half, seed = 1) {
  const k = 'sg_' + half + seed; if (cache[k]) return cache[k];
  const pts = STRAW_PROFILE.map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(pts, 72, 0, half ? Math.PI : Math.PI * 2);
  const nz = makeNoise(seed);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = 1 + nz.n3(x * 3, y * 3, z * 3) * 0.06;
    p.setXYZ(i, x * n, y, z * n * 0.94);
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
  const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(0.085, 0.11, 0.012, 0.29); s.lineTo(0, 0.31); s.lineTo(-0.012, 0.29); s.quadraticCurveTo(-0.085, 0.11, 0, 0);
  const g = new THREE.ShapeGeometry(s, 12);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setZ(i, -y * y * 1.6 + Math.abs(p.getX(i)) * 0.5); }
  g.computeVertexNormals(); cache.leaf = g; return g;
}

function makeStrawberry(m, { half = false, seed = 1, calyx = true } = {}) {
  const grp = new THREE.Group();
  const rnd = mulberry32(seed * 17);
  const geo = strawberryGeometry(half, seed);
  const shell = new THREE.Mesh(geo.shell, m.straw); grp.add(shell);
  if (half) { const f = new THREE.Mesh(geo.face, m.strawFace); grp.add(f); }
  if (calyx) {
    const lg = leafGeometry(); const n = 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + seed;
      if (half && Math.sin(a) < -0.05) continue;
      const l = new THREE.Mesh(lg, m.leaf);
      l.position.set(0, 0.37, 0);
      l.rotation.order = 'YXZ'; l.rotation.y = a; l.rotation.x = -1.3 + rnd() * 0.25;
      l.scale.setScalar(0.8 + rnd() * 0.35);
      grp.add(l);
    }
    if (!half) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, 0.13, 8), m.leaf); st.position.y = 0.44; st.rotation.z = 0.2; grp.add(st); }
  }
  return grp;
}

// rodela com borda arredondada e projeção plana (textura do miolo nas duas faces)
function sliceGeometry(r, h, seed) {
  const k = `slice_${r.toFixed(3)}_${h}_${seed}`; if (cache[k]) return cache[k];
  const b = Math.min(h * 0.45, 0.022); const pts = [];
  pts.push(new THREE.Vector2(0, h / 2));
  pts.push(new THREE.Vector2(r - b, h / 2));
  for (let i = 1; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; pts.push(new THREE.Vector2(r - b + Math.sin(a) * b, h / 2 - b + Math.cos(a) * b)); }
  pts.push(new THREE.Vector2(r, -h / 2 + b));
  for (let i = 1; i <= 6; i++) { const a = Math.PI / 2 + (i / 6) * Math.PI / 2; pts.push(new THREE.Vector2(r - b + Math.sin(a) * b, -h / 2 + b + Math.cos(a) * b)); }
  pts.push(new THREE.Vector2(0, -h / 2));
  pts.reverse();
  const g = new THREE.LatheGeometry(pts, 64);
  const nz = makeNoise(seed); const p = g.attributes.position; const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const a = Math.atan2(z, x);
    const f = 1 + nz.n3(Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0) * 0.06;
    const tilt = nz.n3(Math.cos(a) * 0.8, Math.sin(a) * 0.8, 4) * h * 0.25;
    p.setXYZ(i, x * f, y + tilt * Math.hypot(x, z) / r, z * f);
    uv.setXY(i, (x * f) / (2 * r * 1.06) + 0.5, (z * f) / (2 * r * 1.06) + 0.5);
  }
  g.computeVertexNormals(); cache[k] = g; return g;
}
function makeSlice(m, kind, r = 0.19, h = 0.06, seed = 3) {
  return new THREE.Mesh(sliceGeometry(r, h, seed), kind === 'kiwi' ? m.kiwi : m.banana);
}

// ---------------------------------------------------------------- granola: aglomerados de flocos
const GRANOLA_COLS = ['#b97a35', '#a0622a', '#c88f48', '#7e4519', '#d2a05a', '#94561f', '#61330f', '#ad6d2c'];
function blobGeo(wseg, hseg, seed, sx, sy, sz, amp, bend = 0) {
  const g = new THREE.SphereGeometry(1, wseg, hseg); const nz = makeNoise(seed); const p = g.attributes.position;
  for (let q = 0; q < p.count; q++) {
    const x = p.getX(q), y = p.getY(q), z = p.getZ(q); const f = 1 + nz.n3(x * 2, y * 2, z * 2) * amp;
    p.setXYZ(q, x * f * sx, y * f * sy + x * x * bend, z * f * sz);
  }
  g.computeVertexNormals(); return g;
}
function granolaClusters() {
  if (cache.clusters) return cache.clusters;
  const out = [];
  const col = new THREE.Color();
  for (let v = 0; v < 10; v++) {
    const rnd = mulberry32(300 + v); const parts = [];
    const n = v === 9 ? 1 : 4 + Math.floor(rnd() * 6);
    for (let i = 0; i < n; i++) {
      const kind = rnd(); const sd = 500 + v * 31 + i;
      let g;
      if (kind < 0.45) { g = blobGeo(8, 5, sd, 0.42, 0.1, 0.3, 0.22, 0.06); col.set(GRANOLA_COLS[Math.floor(rnd() * GRANOLA_COLS.length)]); } // floco de aveia
      else if (kind < 0.9) { g = blobGeo(6, 4, sd, 0.34, 0.24, 0.36, 0.38); col.set(GRANOLA_COLS[2 + Math.floor(rnd() * 6)]); } // pedaço tostado
      else if (kind < 0.94) { g = blobGeo(6, 3, sd, 0.4, 0.1, 0.22, 0.1); col.set('#dcc08c'); } // lasca de castanha
      else { g = blobGeo(6, 4, sd, 0.22, 0.13, 0.18, 0.25); col.set('#2c1210'); } // uva-passa
      const e = new THREE.Euler(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28);
      g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(e));
      const rr = n === 1 ? 0 : 0.55 * Math.sqrt(rnd()); const a = rnd() * 6.28;
      g.translate(Math.cos(a) * rr, (rnd() - 0.5) * 0.35, Math.sin(a) * rr);
      const cs = new Float32Array(g.attributes.position.count * 3);
      const jit = 0.9 + rnd() * 0.2;
      for (let q = 0; q < cs.length; q += 3) { cs[q] = col.r * jit; cs[q + 1] = col.g * jit; cs[q + 2] = col.b * jit; }
      g.setAttribute('color', new THREE.BufferAttribute(cs, 3));
      parts.push(g);
    }
    const merged = mergeGeometries(parts); merged.computeBoundingSphere(); out.push(merged);
  }
  cache.clusters = out; return out;
}

function addGranola(grp, m, placeFn, count, seed = 5, scale = 0.07) {
  const geos = granolaClusters(); const rnd = mulberry32(seed);
  const per = Math.ceil(count / geos.length);
  const dummy = new THREE.Object3D();
  geos.forEach((geo) => {
    const im = new THREE.InstancedMesh(geo, m.granola, per);
    for (let i = 0; i < per; i++) {
      const pl = placeFn(rnd);
      const p = pl.isVector3 ? pl : pl.pos;
      dummy.position.copy(p);
      if (pl.quat) dummy.quaternion.copy(pl.quat); else dummy.rotation.set(rnd() * 0.8 - 0.4, rnd() * 6.28, rnd() * 0.8 - 0.4);
      dummy.scale.setScalar((pl.scale ?? scale) * (0.65 + rnd() * 0.7));
      dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix);
    }
    grp.add(im);
  });
}

// ---------------------------------------------------------------- caldas
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
  const steps = 460; const R = INNER(EDGE_Y) * spread;
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
  let ys = pts.map((p) => dropHeight(p.x, p.z, targets, topHeight(p.x, p.z)) + radius * 0.2);
  const floor = pts.map((p) => topHeight(p.x, p.z) + radius * 0.25);
  for (let k = 0; k < 3; k++) ys = ys.map((y, i) => (i === 0 || i === ys.length - 1) ? y : Math.max(floor[i], (ys[i - 1] + 2 * y + ys[i + 1]) / 4));
  pts.forEach((p, i) => (p.y = ys[i]));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const geo = varTube(curve, 1400, 16, (t) => radius * (0.65 + 0.8 * Math.abs(N.n3(t * 14, seed, 8.8))) * smooth(0, 0.03, t) * smooth(1, 0.96, t) + 0.003, 0.32);
  grp.add(new THREE.Mesh(geo, mat));
  for (let d = 0; d < drips; d++) {
    const a = (d / drips) * Math.PI * 2 + rnd() * 0.8 + angle;
    const len = 0.25 + rnd() * 0.55;
    const ca = Math.cos(a), sa = Math.sin(a);
    const dp = [];
    const r0 = INNER(EDGE_Y) * 0.75;
    dp.push(new THREE.Vector3(ca * r0, topHeight(ca * r0, sa * r0) + 0.01, sa * r0));
    dp.push(new THREE.Vector3(ca * (RT - 0.05), EDGE_Y + 0.05, sa * (RT - 0.05)));
    dp.push(new THREE.Vector3(ca * (RT + 0.045), H + 0.01, sa * (RT + 0.045)));
    const steps2 = 6;
    for (let i = 1; i <= steps2; i++) { const y = H - (len * i) / steps2; const rr = cupR(y) + 0.032; const wob = Math.sin(i * 1.7 + d) * 0.012; dp.push(new THREE.Vector3(Math.cos(a + wob) * rr, y, Math.sin(a + wob) * rr)); }
    const c2 = new THREE.CatmullRomCurve3(dp);
    const g2 = varTube(c2, 160, 14, (t) => radius * lerp(1.0, 0.62, t) + (t > 0.86 ? radius * 0.55 * smooth(0.86, 0.95, t) * smooth(1.0, 0.95, t) : 0), 0.7);
    grp.add(new THREE.Mesh(g2, mat));
    const end = c2.getPointAt(1);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.95, 18, 14), mat); bulb.scale.set(1, 1.3, 0.7); bulb.position.copy(end); bulb.position.y -= radius * 0.4;
    grp.add(bulb);
  }
}

function addDroplets(grp, m, count = 440, seed = 11) {
  const rnd = mulberry32(seed);
  const geo = new THREE.SphereGeometry(1, 10, 7);
  const im = new THREE.InstancedMesh(geo, m.drop, count);
  const d = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const y = 0.12 + Math.pow(rnd(), 0.8) * (H - 0.3);
    const a = rnd() * Math.PI * 2;
    const r = cupR(y) + 0.006;
    const nrm = new THREE.Vector3(Math.cos(a), -SLOPE, Math.sin(a)).normalize();
    d.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    d.lookAt(d.position.clone().add(nrm));
    const big = rnd() < 0.12; const trail = rnd() < 0.05;
    const s = big ? 0.016 + rnd() * 0.018 : 0.004 + Math.pow(rnd(), 2) * 0.012;
    d.scale.set(s * (trail ? 0.8 : 1), s * (trail ? 2.8 : 1.15), s * 0.42);
    d.updateMatrix(); im.setMatrixAt(i, d.matrix);
  }
  im.userData.noShadow = true; im.renderOrder = 3;
  grp.add(im);
}

// ---------------------------------------------------------------- recheio encostado na parede (visto pelo plástico)
function wallNormal(a) { return new THREE.Vector3(Math.cos(a), -SLOPE, Math.sin(a)).normalize(); }
function addWallGranola(grp, m, count = 400, seed = 41) {
  addGranola(grp, m, (rnd) => {
    const a = rnd() * Math.PI * 2; const cx = Math.cos(a) * 2.4, cz = Math.sin(a) * 2.4;
    const [gb, gt] = granolaBand(cx, cz);
    const v = lerp(gb + 0.006, gt - 0.006, rnd()); const y = vToY(v);
    const s = 0.05 + rnd() * 0.035;
    const r = INNER(y) - s * (0.05 + rnd() * 0.4);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28));
    return { pos: new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), quat: q, scale: s };
  }, count, seed);
}
function addWallFruit(grp, m, seed = 61) {
  const rnd = mulberry32(seed);
  const items = 8;
  for (let i = 0; i < items; i++) {
    const a = ((i + 0.25 + rnd() * 0.5) / items) * Math.PI * 2;
    const v = 0.6 + rnd() * 0.15; const y = vToY(v);
    const n = wallNormal(a);
    if (i % 2 === 0) {
      const r = 0.2 + rnd() * 0.025, h = 0.06;
      const sl = makeSlice(m, 'banana', r, h, 70 + i);
      sl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
      sl.rotateY(rnd() * 6.28);
      const R = INNER(y) + 0.012 - h * 0.5; sl.position.set(Math.cos(a) * R, y, Math.sin(a) * R);
      grp.add(sl);
    } else {
      const s = makeStrawberry(m, { half: true, seed: 80 + i, calyx: false });
      const sc = 0.5 + rnd() * 0.08; s.scale.setScalar(sc);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(-1, 0, 0), n);
      const tilt = new THREE.Quaternion().setFromAxisAngle(n, (rnd() - 0.5) * 0.9 + (rnd() < 0.3 ? Math.PI : 0));
      s.quaternion.copy(tilt.multiply(q));
      const R = INNER(y) + 0.011; s.position.set(Math.cos(a) * R, y, Math.sin(a) * R);
      grp.add(s);
    }
  }
}

// ---------------------------------------------------------------- montagem do copo
function onTop(x, z, lift = 0) { return new THREE.Vector3(x, topHeight(x, z) + lift, z); }

// config: { base, bare, layered, toppings: { strawberries, bananas, granola, kiwi, mango, powder, pacoca, mint, spoon }, drizzle, drizzle2, droplets }
export function buildCup(cfg = {}) {
  const base = cfg.base || 'acai';
  const m = mats(base);
  const grp = new THREE.Group();
  const cg = cupGeometry();
  const layered = cfg.layered !== false;
  grp.add(new THREE.Mesh(contentsGeometry(), layered ? m.side : m.sidePlain));
  if (layered && base !== 'cupuacu') { addWallGranola(grp, m); addWallFruit(grp, m); }
  let topMat = m.top;
  if (cfg.matteTop) { topMat = m.top.clone(); topMat.clearcoat = 0.2; topMat.clearcoatRoughness = 0.5; topMat.roughness = 0.5; topMat.envMapIntensity = 0.3; topMat.specularIntensity = 0.5; }
  const top = new THREE.Mesh(topGeometry(base), topMat); grp.add(top);
  // plástico e gotas vão numa cena à parte, renderizada por cima sem luzes diretas
  // (só o reflexo do estúdio): luz pontual em plástico liso vira uma faixa estourada.
  const glass = new THREE.Group(); grp.userData.glass = glass;
  for (const [geo, mat, order] of [[cg.body, m.haze, 1], [cg.rim, m.rimHaze, 1], [cg.body, m.cup, 2], [cg.rim, m.rim, 2]]) {
    const o = new THREE.Mesh(geo, mat); o.userData.noShadow = true; o.renderOrder = order; glass.add(o);
  }
  if (cfg.droplets !== false) addDroplets(glass, m);
  const tp = cfg.toppings || {};
  const targets = [top];
  const rnd = mulberry32(cfg.seed || 21);
  if (!cfg.bare) {
    const sCount = tp.strawberries ?? 0;
    const sPos = [[-0.3, -0.3, 0.6], [0.32, -0.36, 2.0], [-0.52, 0.18, 4.0], [0.02, -0.02, 5.2], [0.5, 0.22, 1.1], [-0.12, 0.5, 3.3]];
    for (let i = 0; i < Math.min(sCount, sPos.length); i++) {
      const [x, z, rot] = sPos[i];
      const half = i !== 3;
      const s = makeStrawberry(m, { half, seed: i + 1, calyx: true });
      s.scale.setScalar(half ? 0.6 : 0.56);
      if (half) {
        const out = new THREE.Vector3(x, 0, z); if (out.length() < 0.05) out.set(0, 0, 1); out.normalize();
        const target = new THREE.Vector3(out.x * 0.75, 1.0, out.z * 0.75).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(-1, 0, 0), target);
        const spin = new THREE.Quaternion().setFromAxisAngle(target, rot);
        s.quaternion.copy(spin.multiply(q));
        s.position.copy(onTop(x, z, 0.06));
      } else { s.rotation.set(0.25, rot, 0.15); s.position.copy(onTop(x, z, 0.19)); }
      grp.add(s); targets.push(s);
    }
    const bCount = tp.bananas ?? 0;
    const bPos = [[0.3, 0.42], [0.58, 0.02], [0.08, 0.62], [-0.3, 0.32], [0.62, -0.32], [-0.6, -0.15], [0.25, -0.62]];
    for (let i = 0; i < Math.min(bCount, bPos.length); i++) {
      const [x, z] = bPos[i]; const sl = makeSlice(m, 'banana', 0.17 + rnd() * 0.03, 0.055, i + 3);
      sl.position.copy(onTop(x, z, 0.04));
      sl.rotation.set(0.18 + rnd() * 0.32, rnd() * 6, (rnd() - 0.5) * 0.35);
      grp.add(sl); targets.push(sl);
    }
    const kCount = tp.kiwi ?? 0;
    const kPos = [[-0.4, -0.45], [0.48, 0.08], [-0.1, 0.35]];
    for (let i = 0; i < Math.min(kCount, kPos.length); i++) {
      const [x, z] = kPos[i]; const sl = makeSlice(m, 'kiwi', 0.2, 0.05, i + 30);
      sl.position.copy(onTop(x, z, 0.05)); sl.rotation.set(0.5 + rnd() * 0.4, rnd() * 6, (rnd() - 0.5) * 0.5); grp.add(sl); targets.push(sl);
    }
    const mCount = tp.mango ?? 0;
    for (let i = 0; i < mCount; i++) {
      const a = rnd() * Math.PI * 2, r = 0.15 + rnd() * 0.55;
      const b = new THREE.Mesh(new RoundedBoxGeometry(0.17, 0.15, 0.16, 3, 0.035), m.mango);
      b.position.copy(onTop(Math.cos(a) * r, Math.sin(a) * r, 0.06)); b.rotation.set(rnd(), rnd() * 6, rnd()); grp.add(b); targets.push(b);
    }
    if (tp.powder) {
      const g = new THREE.SphereGeometry(0.42, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
      const nz = makeNoise(77); const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const f = 1 + nz.fbm(x * 5, y * 5, z * 5, 3) * 0.25; p.setXYZ(i, x * f, y * f * 0.55, z * f); }
      g.computeVertexNormals();
      const mound = new THREE.Mesh(g, m.powder);
      mound.position.copy(onTop(0.08, 0.05, -0.04)); grp.add(mound); targets.push(mound);
      const dust = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), m.powder, 900); const d = new THREE.Object3D();
      for (let i = 0; i < 900; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 0.85; const x = Math.cos(a) * r, z = Math.sin(a) * r; d.position.copy(onTop(x, z, 0.004)); d.scale.setScalar(0.006 + rnd() * 0.01); d.rotation.set(rnd() * 6, rnd() * 6, 0); d.updateMatrix(); dust.setMatrixAt(i, d.matrix); }
      grp.add(dust);
    }
    if (tp.pacoca) {
      for (let i = 0; i < tp.pacoca; i++) {
        const a = rnd() * 6.28, r = 0.2 + rnd() * 0.5;
        const b = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.1, 0.13, 2, 0.02), m.pacoca);
        b.position.copy(onTop(Math.cos(a) * r, Math.sin(a) * r, 0.04)); b.rotation.set(rnd(), rnd() * 6, rnd()); grp.add(b); targets.push(b);
      }
    }
    if (tp.granola) {
      const R = INNER(EDGE_Y);
      const arc = tp.granolaArc ?? [Math.PI * 0.55, Math.PI * 1.45];
      addGranola(grp, m, (r) => {
        const a = lerp(arc[0], arc[1], r()); const rr = R * (0.42 + Math.sqrt(r()) * 0.54);
        const x = Math.cos(a) * rr, z = Math.sin(a) * rr; return onTop(x, z, 0.02 + r() * 0.03);
      }, Math.round(tp.granola * 0.55), 5, 0.075);
    }
    if (tp.mint) {
      const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(0.12, 0.1, 0, 0.32); s.quadraticCurveTo(-0.12, 0.1, 0, 0);
      for (let i = 0; i < 2; i++) {
        const g = new THREE.ShapeGeometry(s, 16); const p = g.attributes.position;
        for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k); p.setZ(k, Math.abs(x) * 0.5 - y * y * 0.4); }
        g.computeVertexNormals();
        const l = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ color: '#3f9a3a', roughness: 0.4, clearcoat: 0.6, side: THREE.DoubleSide, envMap: ENV, envMapIntensity: 0.6 }));
        l.position.copy(onTop(-0.05 + i * 0.06, 0.05, 0.16)); l.rotation.set(-1.0, i * 1.9 + 0.4, 0.2); l.scale.setScalar(1.1); grp.add(l);
      }
    }
    if (cfg.drizzle) {
      const mat = cfg.drizzle === 'chocolate' ? m.choc : cfg.drizzle === 'honey' ? m.honey : m.milk;
      addDrizzle(grp, mat, cfg.drapeAll ? targets : [top], { seed: 3, drips: cfg.drips ?? 3, radius: cfg.drizzle === 'chocolate' ? 0.034 : 0.031, loops: cfg.loops ?? 3.2, angle: 0.4, spread: 0.86, pattern: cfg.pattern || 'spiral' });
    }
    if (cfg.drizzle2) {
      const mat = cfg.drizzle2 === 'chocolate' ? m.choc : cfg.drizzle2 === 'honey' ? m.honey : m.milk;
      addDrizzle(grp, mat, targets, { seed: 8, drips: 1, radius: 0.026, loops: 4.5, angle: 1.9, spread: 0.7, pattern: 'zigzag' });
    }
    if (tp.spoon) {
      const sg = new THREE.Group();
      const handle = new THREE.Mesh(new RoundedBoxGeometry(0.09, 1.1, 0.025, 2, 0.012), m.spoon); handle.position.y = 0.55; sg.add(handle);
      const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), m.spoon); bowl.scale.set(1, 0.35, 1.3); bowl.rotation.x = Math.PI / 2; sg.add(bowl);
      sg.position.copy(onTop(-0.35, -0.15, -0.15)); sg.rotation.set(-0.35, 0.6, 0.3); grp.add(sg);
    }
  } else if (cfg.drizzle && cfg.bareDrizzle) {
    addDrizzle(grp, m.milk, targets, { seed: 3, drips: cfg.drips ?? 3, loops: 4.5, angle: 0.4 });
  }
  applyShadows(grp);
  return grp;
}

function applyShadows(grp) {
  grp.traverse((o) => { if (o.isMesh) { const no = o.userData.noShadow; o.castShadow = !no; o.receiveShadow = !no; } });
}

// ---------------------------------------------------------------- recortes (ingredientes)
export function buildSprite(kind) {
  const m = mats('acai'); const grp = new THREE.Group(); const rnd = mulberry32(kind.length * 7 + 3);
  if (kind === 'strawberry') { const s = makeStrawberry(m, { half: false, seed: 2 }); s.rotation.set(0.35, 0.4, -0.25); grp.add(s); }
  else if (kind === 'strawberry-half') { const s = makeStrawberry(m, { half: true, seed: 4 }); s.rotation.set(0.12, Math.PI / 2 - 0.6, -0.1); grp.add(s); }
  else if (kind === 'banana-slice') { const sl = makeSlice(m, 'banana', 0.2, 0.065, 5); sl.rotation.set(1.05, 0, 0.25); grp.add(sl); }
  else if (kind === 'kiwi-slice') { const sl = makeSlice(m, 'kiwi', 0.22, 0.055, 6); sl.rotation.set(1.0, 0, -0.2); grp.add(sl); }
  else if (kind === 'mango') { const b = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.27, 0.28, 4, 0.06), m.mango); b.rotation.set(0.5, 0.7, 0.2); grp.add(b); }
  else if (kind === 'granola') { addGranola(grp, m, (r) => new THREE.Vector3((r() - 0.5) * 0.5, (r() - 0.5) * 0.24, (r() - 0.5) * 0.3), 40, 9, 0.085); }
  else if (kind === 'granola-bit') { addGranola(grp, m, (r) => new THREE.Vector3((r() - 0.5) * 0.04, (r() - 0.5) * 0.04, (r() - 0.5) * 0.04), 2, 13, 0.11); }
  else if (kind === 'milk-drop' || kind === 'choc-drop' || kind === 'acai-drop') {
    const pts = [];
    for (let i = 0; i <= 56; i++) { const t = Math.PI * (1 - i / 56); const r = Math.sin(t) * Math.pow(Math.sin(t / 2), 1.6) * 0.24; pts.push(new THREE.Vector2(Math.max(0.0001, r), Math.cos(t) * 0.3)); }
    const g = new THREE.LatheGeometry(pts, 56);
    const acaiGloss = new THREE.MeshPhysicalMaterial({ color: '#3a0c33', roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.5, sheenColor: new THREE.Color('#b0589e'), envMap: ENV, envMapIntensity: 0.9 });
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
    const l = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ color: '#3f9a3a', roughness: 0.4, clearcoat: 0.6, side: THREE.DoubleSide, envMap: ENV, envMapIntensity: 0.6 })); l.rotation.set(-0.6, 0.3, 0.4); l.position.y = -0.15; grp.add(l);
  }
  applyShadows(grp);
  return grp;
}

// ---------------------------------------------------------------- estúdio
let renderer, scene, glassScene, camera, key, rim, sky, hemi, current, ENV = null;
let glassLinks = [];
const keyBase = new THREE.Vector3(-6, 6.5, 5);
const TARGET = new THREE.Vector3(0, 1.5, 0);
let PASSES = 24, KEY_SOFT = 1.1;
export function setQuality({ passes, keySoft } = {}) { if (passes) PASSES = passes; if (keySoft) KEY_SOFT = keySoft; }

function studioEnvironment() {
  const s = new THREE.Scene();
  const dome = new THREE.SphereGeometry(40, 64, 32);
  const cols = []; const p = dome.attributes.position;
  const top = new THREE.Color(0.16, 0.15, 0.15), mid = new THREE.Color(0.055, 0.05, 0.055), low = new THREE.Color(0.02, 0.018, 0.022);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 40; if (y > 0) c.copy(mid).lerp(top, Math.pow(y, 0.8)); else c.copy(mid).lerp(low, Math.pow(-y, 0.5)); cols.push(c.r, c.g, c.b); }
  dome.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  s.add(new THREE.Mesh(dome, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const box = (w, h, intensity, color, pos) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    mesh.position.set(...pos); mesh.lookAt(0, 1.5, 0); s.add(mesh);
  };
  // faixas altas: em superfície vertical o reflexo olha para baixo, então descem bem
  box(4.5, 34, 16, '#fff3e8', [-10, 0, 6]);  // softbox principal (esquerda)
  box(1.6, 34, 12, '#ffffff', [10, 0, 2.5]); // faixa da direita
  box(2.2, 30, 7, '#ffd6ec', [6, 0, -10]);   // contraluz rosado
  box(9, 9, 3.2, '#ffffff', [0, 14, 0]);     // teto
  box(4, 3, 1.2, '#ffffff', [0, 1, 12]);     // rebatedor frontal
  return s;
}

export function setup({ width = 1000, height = 1250, ss = 1.25 } = {}) {
  renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1);
  renderer.setSize(Math.round(width * ss), Math.round(height * ss), false);
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x000000, 0);
  document.body.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  ENV = pm.fromScene(studioEnvironment(), 0.0).texture;
  scene.environment = ENV;
  glassScene = new THREE.Scene(); glassScene.environment = ENV;
  scene.environmentIntensity = 1.0;
  camera = new THREE.PerspectiveCamera(20, width / height, 0.1, 100);
  const shadowed = (l, size = 2048, ext = 2.4) => {
    l.castShadow = true; l.shadow.mapSize.set(size, size);
    Object.assign(l.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 0.5, far: 30 });
    l.shadow.bias = -0.0003; l.shadow.normalBias = 0.015; l.shadow.radius = 3;
    l.target.position.copy(TARGET); scene.add(l.target);
  };
  key = new THREE.DirectionalLight('#fff2e4', 2.3); key.position.copy(keyBase); shadowed(key, 1536); scene.add(key);
  rim = new THREE.DirectionalLight('#ffd3ea', 2.0); rim.position.set(5.5, 3.5, -5.5); rim.target.position.copy(TARGET); scene.add(rim.target); scene.add(rim);
  sky = new THREE.DirectionalLight('#f3efff', 1.25); sky.position.set(0, 10, 0); shadowed(sky, 1024, 2.6); scene.add(sky);
  hemi = new THREE.HemisphereLight('#fff6ee', '#2a1530', 0.12); scene.add(hemi);
  window.__three = { renderer, scene, camera };
  return true;
}

export function show(obj) {
  if (current) scene.remove(current);
  for (const { glass } of glassLinks) glassScene.remove(glass);
  glassLinks = [];
  current = obj; scene.add(obj);
  obj.traverse((o) => { const g = o.userData.glass; if (g) { g.matrixAutoUpdate = false; glassScene.add(g); glassLinks.push({ owner: o, glass: g }); } });
}
function syncGlass() {
  scene.updateMatrixWorld(true);
  for (const { owner, glass } of glassLinks) { glass.matrix.copy(owner.matrixWorld); glass.matrixWorldNeedsUpdate = true; }
}
function renderAll() {
  syncGlass();
  renderer.autoClear = true; renderer.render(scene, camera);
  renderer.autoClear = false; renderer.render(glassScene, camera);
  renderer.autoClear = true;
}

export function view({ angle = 0, elevation = 12, distance = 9.4, target = [0, 1.32, 0], fov = 20, aspect } = {}) {
  current.rotation.y = (angle * Math.PI) / 180;
  camera.fov = fov; if (aspect) camera.aspect = aspect; camera.updateProjectionMatrix();
  const el = (elevation * Math.PI) / 180;
  camera.position.set(0, target[1] + Math.sin(el) * distance, Math.cos(el) * distance);
  camera.lookAt(new THREE.Vector3(...target));
}

export function setLights({ keyI = 2.3, rimI = 2.0, skyI = 1.25, env = 1.0, exposure = 1.0 } = {}) {
  key.intensity = keyI; rim.intensity = rimI; sky.intensity = skyI; scene.environmentIntensity = env; renderer.toneMappingExposure = exposure;
}

export function resize(width, height, ss = 1.25) {
  renderer.setSize(Math.round(width * ss), Math.round(height * ss), false);
  camera.aspect = width / height; camera.updateProjectionMatrix();
}

const LIN = new Float32Array(256); for (let i = 0; i < 256; i++) { const c = i / 255; LIN[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
const ENC = new Uint8ClampedArray(4097); for (let i = 0; i <= 4096; i++) { const l = i / 4096; ENC[i] = Math.round(255 * (l <= 0.0031308 ? l * 12.92 : 1.055 * Math.pow(l, 1 / 2.4) - 0.055)); }
const keyU = new THREE.Vector3(), keyV = new THREE.Vector3();

// Renderiza PASSES vezes variando subpixel, posição da luz principal (sombra suave) e
// direção da luz do céu (oclusão), e tira a média em espaço linear com alfa pré-multiplicado.
export function capture(width, height, type = 'image/webp', quality = 0.86, passes = PASSES) {
  const W = renderer.domElement.width, Hh = renderer.domElement.height;
  const gl = renderer.getContext();
  const acc = new Float32Array(W * Hh * 4); const buf = new Uint8Array(W * Hh * 4);
  const dir = keyBase.clone().sub(TARGET).normalize();
  keyU.crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize(); keyV.crossVectors(keyU, dir).normalize();
  for (let i = 0; i < passes; i++) {
    const k = i + 1;
    if (passes > 1) camera.setViewOffset(W, Hh, halton(k, 2) - 0.5, halton(k, 3) - 0.5, W, Hh);
    const a = 2 * Math.PI * halton(k, 5), rr = Math.sqrt(halton(k, 7)) * KEY_SOFT;
    key.position.copy(keyBase).addScaledVector(keyU, Math.cos(a) * rr).addScaledVector(keyV, Math.sin(a) * rr);
    const phi = 2 * Math.PI * halton(k, 11), ct = Math.sqrt(1 - halton(k, 13) * 0.92), st = Math.sqrt(1 - ct * ct);
    sky.position.set(TARGET.x + st * Math.cos(phi) * 12, TARGET.y + ct * 12, TARGET.z + st * Math.sin(phi) * 12);
    renderAll();
    gl.readPixels(0, 0, W, Hh, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    for (let j = 0; j < buf.length; j += 4) {
      const al = buf[j + 3] / 255; if (al === 0) continue;
      acc[j] += LIN[buf[j]] * al; acc[j + 1] += LIN[buf[j + 1]] * al; acc[j + 2] += LIN[buf[j + 2]] * al; acc[j + 3] += al;
    }
  }
  camera.clearViewOffset();
  const [full, fctx] = canvas(W, Hh); const img = fctx.createImageData(W, Hh); const d = img.data;
  for (let y = 0; y < Hh; y++) {
    const src = (Hh - 1 - y) * W * 4, dst = y * W * 4;
    for (let x = 0; x < W * 4; x += 4) {
      const A = acc[src + x + 3];
      if (A <= 0) { d[dst + x + 3] = 0; continue; }
      d[dst + x] = ENC[Math.min(4096, Math.round((acc[src + x] / A) * 4096))];
      d[dst + x + 1] = ENC[Math.min(4096, Math.round((acc[src + x + 1] / A) * 4096))];
      d[dst + x + 2] = ENC[Math.min(4096, Math.round((acc[src + x + 2] / A) * 4096))];
      d[dst + x + 3] = Math.round((A / passes) * 255);
    }
  }
  fctx.putImageData(img, 0, 0);
  const [c, ctx] = canvas(width, height);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if (bgCanvas) ctx.drawImage(bgCanvas, 0, 0, width, height);
  ctx.drawImage(full, 0, 0, width, height);
  return c.toDataURL(type, quality);
}

export function frameObject(obj, { margin = 1.12, elevation = 12, fov = 30, aspect = 1 } = {}) {
  const box = new THREE.Box3().setFromObject(obj); const size = box.getSize(new THREE.Vector3()); const center = box.getCenter(new THREE.Vector3());
  const r = Math.max(size.x, size.y, size.z * 0.8) / 2 * margin;
  const dist = r / Math.tan((fov * Math.PI) / 360) / Math.min(1, aspect);
  return { distance: dist, target: [center.x, center.y, center.z], fov, elevation };
}

// Fundo opcional (imagens com cenário). Desenhado atrás no capture; a cena continua com alfa.
let bgCanvas = null;
export function setBackground(spec) {
  if (!spec) { bgCanvas = null; return; }
  const [c, ctx] = canvas(1024, 1024);
  if (spec.type === 'radial') { const g = ctx.createRadialGradient(512, spec.cy ?? 420, 30, 512, 512, 760); g.addColorStop(0, spec.inner); g.addColorStop(1, spec.outer); ctx.fillStyle = g; }
  else { const g = ctx.createLinearGradient(0, 0, 0, 1024); g.addColorStop(0, spec.top); g.addColorStop(1, spec.bottom); ctx.fillStyle = g; }
  ctx.fillRect(0, 0, 1024, 1024);
  bgCanvas = c;
}
export function group(...objs) { const g = new THREE.Group(); objs.forEach((o) => g.add(o)); return g; }
window.SCENE = { setBackground, group, setTopRes, setup, setQuality, buildCup, buildSprite, show, view, setLights, resize, capture, frameObject, THREE };
window.sceneReady = true;
