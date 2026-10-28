// Gera todos os renders do copo usados no site (v2 realista).
// Uso: node drive.js job_all.js   (ONLY=spin,closeup,... para gerar só parte)
// Depois: python3 make_mobile.py  (cria as variantes de 540 px a partir dos frames desktop)
const OUT = require('path').resolve(__dirname, '../../public');
const pad = (n) => String(n).padStart(3, '0');
const LOADED = { toppings: { strawberries: 5, bananas: 6, granola: 220 }, drizzle: 'condensed', drips: 3 };
const ESPECIAL = { toppings: { strawberries: 4, bananas: 4, kiwi: 2, granola: 170, mint: true }, drizzle: 'condensed', drizzle2: 'chocolate', drips: 3, seed: 37 };
const SPRITES = ['strawberry', 'strawberry-half', 'banana-slice', 'granola', 'granola-bit', 'milk-drop', 'choc-drop', 'acai-drop', 'acai-berries', 'kiwi-slice', 'mango', 'powder', 'pacoca', 'mint'];
const SEQ_PASSES = Number(process.env.PASSES || 10);
const only = (process.env.ONLY || '').split(',').filter(Boolean);
const want = (k) => !only.length || only.includes(k);

module.exports = async (p, save) => {
  const t0 = Date.now();
  const log = (...a) => console.log(new Date().toISOString().slice(11, 19), `+${Math.round((Date.now() - t0) / 1000)}s`, ...a);
  await p.evaluate(() => { SCENE.setup({ width: 900, height: 1125, ss: 1 }); });
  const shot = (file, w, h, fn, arg, { type = 'image/webp', q = 0.82, passes = SEQ_PASSES } = {}) =>
    p.evaluate(({ fn, arg, w, h, type, q, passes }) => { (new Function('S', 'arg', fn))(SCENE, arg); return SCENE.capture(w, h, type, q, passes); }, { fn, arg, w, h, type, q, passes })
      .then((u) => save(file, u));

  if (want('sprites')) {
    for (const k of SPRITES) {
      await shot(`${OUT}/images/ingredients/${k}.webp`, 512, 512, `
        S.resize(512, 512, 1); const g = S.buildSprite(arg); S.show(g);
        const f = S.frameObject(g, { margin: 1.08, elevation: 14, fov: 22, aspect: 1 }); S.view({ angle: 0, ...f, aspect: 1 });`, k, { q: 0.86, passes: 12 });
    }
    log('sprites');
  }
  if (want('top')) {
    await shot(`${OUT}/images/ingredients/acai-top.webp`, 1000, 1000, `S.resize(1000, 1000, 1); S.setLights({ keyI: 2.7, rimI: 1.5, skyI: 1.3, exposure: 1.05 });
      const c = S.buildCup({ base: 'acaiTop', bare: true, droplets: false, matteTop: true }); S.show(c);
      S.view({ angle: 0, elevation: 89.5, distance: 9.0, target: [0, 2.3, 0], fov: 15, aspect: 1 });`, null, { q: 0.84, passes: 12 });
    await p.evaluate(() => SCENE.setLights());
    log('top');
  }
  if (want('builder')) {
    for (const base of ['acai', 'cupuacu', 'mix']) {
      await shot(`${OUT}/images/builder/base-${base}.webp`, 700, 875, `S.resize(700, 875, 1); const c = S.buildCup({ base: arg, bare: true, layered: false }); S.show(c); S.view({ angle: 0, elevation: 19, distance: 9.8, target: [0, 1.4, 0], aspect: 700 / 875 });`, base, { q: 0.84 });
    }
    log('builder');
  }
  if (want('contact')) {
    await shot(`${OUT}/images/menu/especial.webp`, 800, 1000, `S.resize(800, 1000, 1); const c = S.buildCup(arg); S.show(c); S.view({ angle: 30, elevation: 25, distance: 9.5, target: [0, 1.5, 0], aspect: 0.8 });`, ESPECIAL, { q: 0.84, passes: 12 });
    log('contact');
  }
  if (want('spin') || want('closeup')) {
    await p.evaluate((cfg) => { window.cupL = SCENE.buildCup(cfg); SCENE.show(window.cupL); SCENE.resize(900, 1125, 1); }, LOADED);
  }
  if (want('spin')) {
    const from = Number(process.env.FROM || 0);
    for (let i = from; i < 60; i++) {
      await shot(`${OUT}/sequence/spin/desktop/f${pad(i)}.webp`, 900, 1125, `S.view({ angle: arg * 6, elevation: 19, distance: 9.8, target: [0, 1.4, 0], aspect: 0.8 });`, i);
      if (i % 5 === 0) log('spin', i);
    }
  }
  if (want('closeup')) {
    await p.evaluate(() => { SCENE.show(window.cupL); SCENE.resize(900, 1125, 1); });
    for (let i = 0; i < 24; i++) {
      await shot(`${OUT}/sequence/closeup/desktop/f${pad(i)}.webp`, 900, 1125, `
        const e = arg / 23; const d = 9.8 * Math.pow(4.1 / 9.8, e);
        S.view({ angle: 90, elevation: 19 + 13 * e, distance: d, target: [0, 1.4 + 0.88 * e, 0.22 * e], aspect: 0.8 });`, i);
      if (i % 6 === 0) log('closeup', i);
    }
  }
  if (want('bare')) {
    await p.evaluate(() => { window.cupB = SCENE.buildCup({ bare: true }); SCENE.show(window.cupB); SCENE.resize(900, 1125, 1); });
    for (let i = 6; i <= 16; i++) await shot(`${OUT}/sequence/bare/desktop/f${pad(i)}.webp`, 900, 1125, `S.view({ angle: arg * 6, elevation: 19, distance: 9.8, target: [0, 1.4, 0], aspect: 0.8 });`, i);
    log('bare');
  }
  log('ALL DONE');
};
