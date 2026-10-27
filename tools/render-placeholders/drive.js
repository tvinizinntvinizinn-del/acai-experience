// usage: node drive.js job.js  -> job exports async (page, save) => {}
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
(async () => {
  const job = require(path.resolve(process.argv[2]));
  const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1200, height: 1200 } });
  p.on('console', m => { if (m.type() === 'error' || m.type()==='warning') console.log('console:', m.text().slice(0, 300)); });
  p.on('pageerror', e => console.log('pageerror', e.message));
  await p.goto('http://127.0.0.1:8765/tools/render-placeholders/render.html');
  await p.waitForFunction(() => window.sceneReady, null, { timeout: 60000 });
  const save = (file, dataUrl) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64')); };
  await job(p, save);
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
