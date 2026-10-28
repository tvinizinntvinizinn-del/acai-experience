# Geração dos renders do copo

Os frames em `public/sequence` e os recortes em `public/images` (ingredientes,
bases do montador, copo do contato) são gerados por este script: um copo de açaí
modelado em three.js e renderizado offline no Chromium headless.

O que deixa o resultado realista (v2):

- **Estúdio:** ambiente escuro com softboxes altos (reflexos verticais no copo, brilho
  molhado nas frutas e caldas).
- **Copo:** reflexos do estúdio somados por cima do conteúdo numa cena separada, sem
  luzes diretas (luz pontual em plástico liso vira faixa estourada) e sem o passe de
  transmissão do three (muito lento no SwiftShader).
- **Conteúdo:** açaí roxo-vinho com manchas e bolhinhas contra o plástico; banana e
  morango cortado encostados na parede; faixa de granola 3D; leite condensado; topo
  cremoso com dobras de colherada e cor por cavidade.
- **Captura com acúmulo:** cada imagem é a média de vários passes (padrão 10) variando
  subpixel (antisserrilhado), posição da luz principal (sombra suave) e direção de uma
  luz de céu com sombra (oclusão entre os ingredientes).

## Regerar (opcional)

```bash
npm install                      # garante three em node_modules
npm i -D playwright && npx playwright install chromium
python -m http.server 8765       # na raiz do projeto, em outro terminal
node tools/render-placeholders/drive.js tools/render-placeholders/job_all.js
# Só uma parte:  ONLY=spin,closeup node tools/render-placeholders/drive.js tools/render-placeholders/job_all.js
# Menos passes (mais rápido, mais serrilhado):  PASSES=4 ...
python3 tools/render-placeholders/make_mobile.py   # variantes 540 × 675 dos frames
```

Num computador sem GPU (SwiftShader) cada frame leva ~40 s com 10 passes; com GPU é
bem mais rápido. Parâmetros de câmera, luz e coberturas estão em `scene.js`
(`buildCup`, `setup`, `view`, `capture`).

Para a versão final com fotos ou renders de estúdio da própria loja, substitua os
arquivos mantendo os nomes (veja `public/sequence/README.md` e `public/models/README.md`).
