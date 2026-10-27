# Sequências de imagens do copo

Os frames atuais são **renders provisórios** gerados proceduralmente (veja
`tools/render-placeholders`). Substitua por renders profissionais (Blender,
Cinema 4D, KeyShot) ou fotos em mesa giratória mantendo os nomes abaixo.

## Especificação

| Pasta | Quantidade | Conteúdo |
| --- | --- | --- |
| `spin/desktop/f000…f059.webp` | 60 | Volta de 360° do copo completo, 6° por frame, sentido anti-horário visto de cima. `f000` = frente. |
| `bare/desktop/f006…f016.webp` | 11 | Mesmos ângulos (36°–96°) **sem as coberturas do topo** (usado quando os ingredientes "saem" do copo). |
| `closeup/desktop/f000…f023.webp` | 24 | Câmera aproximando do topo no ângulo do frame 15 (90°). `f000` idêntico a `spin/f015`. |
| `*/mobile/…` | iguais | Mesmos frames em 540 × 675 px (qualidade ~75). |

- Tamanho: **900 × 1125 px** (4:5) no desktop, 540 × 675 px no mobile.
- Fundo **transparente** (WebP com alfa) — o site troca o fundo creme/roxo por trás.
- Sem sombra no chão (o site desenha a sombra e a flutuação).
- Câmera: lente tele (~20° de FOV vertical), elevação ~19°, copo ocupando ~92% da altura, mesmo enquadramento em todos os frames.
- Iluminação: luz principal lateral (esquerda), contraluz rosada à direita, reflexos de estúdio.

Se mudar a quantidade de frames ou a proporção, ajuste `src/config/experience.ts`.
