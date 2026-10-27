// Baixa as fotos ilustrativas (src/data/photos.json) para public/images/fotos/<id>.jpg.
// Depois, mude `localPhotos` para true em src/config/site.ts para servir as cópias locais.
// Uso: npm run fotos
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { photos } = JSON.parse(await readFile(path.join(root, "src/data/photos.json"), "utf8"));
const outDir = path.join(root, "public/images/fotos");
await mkdir(outDir, { recursive: true });

let ok = 0;
for (const photo of photos) {
  const file = path.join(outDir, `${photo.id}.jpg`);
  if (existsSync(file)) {
    ok++;
    continue;
  }
  const url = new URL(photo.remote);
  if (url.hostname === "images.unsplash.com") url.searchParams.set("fm", "jpg");
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
    ok++;
    console.log(`✔ ${photo.id}`);
  } catch (err) {
    console.error(`✖ ${photo.id}: ${err.message} (${photo.page})`);
  }
}
console.log(`\n${ok}/${photos.length} fotos em public/images/fotos.`);
if (ok === photos.length) console.log('Agora mude localPhotos para true em src/config/site.ts.');
