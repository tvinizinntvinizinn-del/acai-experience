# Geração dos renders provisórios

Os frames em `public/sequence` e as imagens em `public/images` foram gerados por
este script: um copo de açaí modelado proceduralmente em three.js (copo PET com
condensação, camadas visíveis, morango, banana, granola, caldas) renderizado
offline no Chromium headless.

**São placeholders de layout**, não fotos nem renders de produção. Use-os até ter
o material final (veja `public/sequence/README.md` e `public/models/README.md`).

## Regerar (opcional)

```bash
npm install                      # garante three em node_modules
npm i -D playwright && npx playwright install chromium
python -m http.server 8765       # na raiz do projeto, em outro terminal
node tools/render-placeholders/drive.js tools/render-placeholders/job_all.js
# Só uma parte:  ONLY=spin,closeup node tools/render-placeholders/drive.js tools/render-placeholders/job_all.js
```

Depois gere as variantes mobile (540 × 675) dos frames, por exemplo com
ImageMagick: `magick mogrify -path public/sequence/spin/mobile -resize 540x675 -quality 76 public/sequence/spin/desktop/*.webp`.

Parâmetros de câmera, luz e coberturas estão em `scene.js` (`buildCup`, `setup`, `view`).
