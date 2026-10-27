const OUT = require('path').resolve(__dirname, '../../public');
const pad = (n) => String(n).padStart(3, '0');
const LOADED = { toppings: { strawberries: 5, bananas: 6, granola: 220 }, drizzle: 'condensed', drips: 3 };
const VARIANTS = {
  tradicional: { toppings: { granola: 300, bananas: 3 }, drizzle: 'condensed', drips: 2, seed: 31 },
  morango: { toppings: { strawberries: 6, granola: 90 }, drizzle: 'condensed', drips: 3, seed: 32 },
  banana: { toppings: { bananas: 7, granola: 150 }, drizzle: 'honey', drips: 2, seed: 33 },
  ninho: { toppings: { powder: true, strawberries: 2 }, drizzle: 'condensed', drips: 2, seed: 34 },
  nutella: { toppings: { strawberries: 3, bananas: 2 }, drizzle: 'chocolate', drips: 3, seed: 35 },
  tropical: { toppings: { kiwi: 3, mango: 6, bananas: 3, strawberries: 1 }, drizzle: 'honey', drips: 1, seed: 36 },
  especial: { toppings: { strawberries: 4, bananas: 4, kiwi: 2, granola: 170, mint: true }, drizzle: 'condensed', drizzle2: 'chocolate', drips: 3, seed: 37 },
};
const SPRITES = ['strawberry', 'strawberry-half', 'banana-slice', 'granola', 'granola-bit', 'milk-drop', 'choc-drop', 'acai-drop', 'acai-berries', 'kiwi-slice', 'mango', 'powder', 'pacoca', 'mint'];
const only = (process.env.ONLY || '').split(',').filter(Boolean);
const want = (k) => !only.length || only.includes(k);
module.exports = async (p, save) => {
  const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
  await p.evaluate(() => { SCENE.setTopRes(2048); SCENE.setup({ width: 900, height: 1125, ss: 1.25 }); });
  const shot = (file, w, h, fn, arg, type = 'image/webp', q = 0.8) => p.evaluate(({ fn, arg, w, h, type, q }) => { (new Function('S', 'arg', fn))(SCENE, arg); return SCENE.capture(w, h, type, q); }, { fn, arg, w, h, type, q }).then((u) => save(file, u));

  if (want('spin')) {
    await p.evaluate((cfg) => { window.cupL = SCENE.buildCup(cfg); SCENE.show(window.cupL); SCENE.resize(900, 1125, 1.25); }, LOADED);
    for (let i = 0; i < 60; i++) {
      await shot(`${OUT}/sequence/spin/desktop/f${pad(i)}.webp`, 900, 1125, `S.view({ angle: arg * 6, elevation: 19, distance: 9.8, target: [0, 1.4, 0] });`, i, 'image/webp', 0.8);
      if (i % 10 === 0) log('spin', i);
    }
  }
  if (want('closeup')) {
    await p.evaluate((cfg) => { if (!window.cupL) window.cupL = SCENE.buildCup(cfg); SCENE.show(window.cupL); SCENE.resize(900, 1125, 1.25); }, LOADED);
    for (let i = 0; i < 24; i++) {
      await shot(`${OUT}/sequence/closeup/desktop/f${pad(i)}.webp`, 900, 1125, `
        const t = arg / 23; const e = t;
        const d = 9.8 * Math.pow(4.1 / 9.8, e);
        S.view({ angle: 90, elevation: 19 + 13 * e, distance: d, target: [0, 1.4 + 0.88 * e, 0.22 * e] });`, i, 'image/webp', 0.82);
      if (i % 6 === 0) log('closeup', i);
    }
  }
  if (want('bare')) {
    await p.evaluate(() => { window.cupB = SCENE.buildCup({ bare: true }); SCENE.show(window.cupB); SCENE.resize(900, 1125, 1.25); });
    for (let i = 6; i <= 16; i++) await shot(`${OUT}/sequence/bare/desktop/f${pad(i)}.webp`, 900, 1125, `S.view({ angle: arg * 6, elevation: 19, distance: 9.8, target: [0, 1.4, 0] });`, i, 'image/webp', 0.8);
    log('bare done');
  }
  if (want('sprites')) {
    for (const k of SPRITES) {
      await shot(`${OUT}/images/ingredients/${k}.webp`, 512, 512, `
        S.resize(512, 512, 1.5); const g = S.buildSprite(arg); S.show(g);
        const f = S.frameObject(g, { margin: 1.08, elevation: 14, fov: 22, aspect: 1 }); S.view({ angle: 0, ...f, aspect: 1 });`, k, 'image/webp', 0.86);
    }
    log('sprites done');
  }
  if (want('menu')) {
    for (const [k, cfg] of Object.entries(VARIANTS)) {
      await shot(`${OUT}/images/menu/${k}.webp`, 800, 1000, `S.resize(800, 1000, 1.25); const c = S.buildCup(arg); S.show(c); S.view({ angle: 30, elevation: 25, distance: 9.5, target: [0, 1.5, 0] });`, cfg, 'image/webp', 0.84);
      log('menu', k);
    }
  }
  if (want('builder')) {
    for (const base of ['acai', 'cupuacu', 'mix']) {
      await shot(`${OUT}/images/builder/base-${base}.webp`, 700, 875, `S.resize(700, 875, 1.25); const c = S.buildCup({ base: arg, bare: true, layered: false }); S.show(c); S.view({ angle: 0, elevation: 19, distance: 9.8, target: [0, 1.4, 0] });`, base, 'image/webp', 0.84);
    }
    log('builder done');
  }
  if (want('top')) {
    await shot(`${OUT}/images/ingredients/acai-top.webp`, 1000, 1000, `S.resize(1000, 1000, 1.25); S.setLights({ keyI: 3.4, rimI: 2.4, env: 0.3, exposure: 1.08 }); const c = S.buildCup({ base: 'acaiTop', bare: true, droplets: false, matteTop: true }); S.show(c); S.view({ angle: 0, elevation: 89.5, distance: 9.0, target: [0, 2.3, 0], fov: 15, aspect: 1 });`, null, 'image/webp', 0.84);
    log('top done');
  }
  if (want('macro')) {
    await p.evaluate(() => SCENE.setGround(true, 0.26));
    const purple = { type: 'radial', inner: '#5a1d80', outer: '#1d0a2e', cy: 380 };
    const cream = { type: 'radial', inner: '#fff8ea', outer: '#f3dfbf', cy: 380 };
    const pink = { type: 'radial', inner: '#ff7dbb', outer: '#c92f7e', cy: 380 };
    const graph = { type: 'radial', inner: '#2a2533', outer: '#0d0c11', cy: 380 };
    const jobs = [
      ['experience/acai-macro.webp', 1400, 1000, { bg: purple, cfg: { toppings: { strawberries: 2, granola: 70 }, drizzle: 'condensed', drips: 3 }, v: { angle: 200, elevation: 36, distance: 4.4, target: [0.05, 2.3, 0.1], fov: 24 } }],
      ['experience/morango-macro.webp', 1000, 1250, { bg: pink, cfg: VARIANTS.morango, v: { angle: 120, elevation: 30, distance: 3.2, target: [0, 2.5, 0.1], fov: 22 } }],
      ['experience/granola-macro.webp', 1000, 1250, { bg: cream, cfg: VARIANTS.tradicional, v: { angle: 300, elevation: 34, distance: 4.6, target: [0, 2.2, 0.2], fov: 22 } }],
      ['experience/coberturas-macro.webp', 1400, 1000, { bg: graph, cfg: VARIANTS.nutella, v: { angle: 60, elevation: 24, distance: 4.4, target: [0.2, 2.1, 0.4], fov: 24 } }],
      ['gallery/g1.webp', 1000, 1250, { bg: pink, cfg: LOADED, v: { angle: 150, elevation: 16, distance: 10.5, target: [0, 1.35, 0], fov: 20 } }],
      ['gallery/g2.webp', 1000, 1250, { bg: cream, cfg: VARIANTS.tropical, v: { angle: 30, elevation: 22, distance: 10.2, target: [0, 1.4, 0], fov: 20 } }],
      ['gallery/g3.webp', 1000, 1000, { bg: purple, cfg: VARIANTS.especial, v: { angle: 0, elevation: 89.5, distance: 9.0, target: [0, 2.3, 0], fov: 15 } }],
      ['gallery/g4.webp', 1000, 1250, { bg: graph, cfg: VARIANTS.nutella, v: { angle: 210, elevation: 18, distance: 10.2, target: [0, 1.38, 0], fov: 20 } }],
    ];
    for (const [file, w, h, spec] of jobs) {
      await shot(`${OUT}/images/${file}`, w, h, `S.resize(${w}, ${h}, 1.25); S.setBackground(arg.bg); const c = S.buildCup(arg.cfg); S.show(c); S.view({ ...arg.v, aspect: ${w}/${h} });`, spec, 'image/webp', 0.84);
      log('macro', file);
    }
    // lineup
    for (const [file, w, h, bg] of [['experience/copos-prontos.webp', 1600, 1000, purple], ['gallery/g5.webp', 1600, 1000, cream]]) {
      await shot(`${OUT}/images/${file}`, w, h, `S.resize(${w}, ${h}, 1.2); S.setBackground(arg.bg);
        const a = S.buildCup(arg.v1), b = S.buildCup(arg.v2), c = S.buildCup(arg.v3);
        a.position.x = -2.35; c.position.x = 2.35; a.rotation.y = 0.6; c.rotation.y = -0.5; b.position.z = 0.4;
        const g = S.group(a, b, c); S.show(g); S.view({ angle: 0, elevation: 15, distance: 15.5, target: [0, 1.25, 0], fov: 22, aspect: ${w}/${h} }); g.rotation.y = 0;`,
        { bg, v1: VARIANTS.morango, v2: VARIANTS.especial, v3: VARIANTS.tropical }, 'image/webp', 0.84);
      log('lineup', file);
    }
    await shot(`${OUT}/images/og.jpg`, 1200, 630, `S.resize(1200, 630, 1.2); S.setBackground(arg); const c = S.buildCup(${JSON.stringify(LOADED)}); S.show(c); S.view({ angle: 40, elevation: 18, distance: 11.5, target: [0, 1.38, 0], fov: 20, aspect: 1200/630 });`, purple, 'image/jpeg', 0.86);
    log('og done');
  }
  log('ALL DONE');
};
