# CLAUDE.md — Açaí Point 92

Regras técnicas e de animação do projeto. Leia antes de alterar qualquer componente.

## Stack

- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript estrito
- Tailwind CSS v4 (tokens em `src/app/globals.css`, bloco `@theme`)
- GSAP 3 + ScrollTrigger (todas as animações de scroll) · Lenis (rolagem suave)
- React Three Fiber + Drei (apenas no modo `renderer: "model"`)
- Lucide React (ícones — sem ícones de marca; WhatsApp = `MessageCircle`, Instagram = `Camera`)

## Onde editar o quê

| O quê | Arquivo |
| --- | --- |
| Nome da marca, WhatsApp, Instagram, endereço, horários, retirada/entrega | `src/config/site.ts` |
| Textos de marca (títulos, CTAs, frases) | `src/config/copy.ts` |
| Renderizador do copo (sequência × modelo 3D), frames, velocidade | `src/config/experience.ts` |
| Cardápio, tamanhos, preços | `src/data/menu.ts` |
| Montador: bases, complementos, coberturas, limites, preços | `src/data/builder.ts` |
| Ingredientes da seção "Cada camada" | `src/data/ingredients.ts` |
| Fotos ilustrativas (banco de imagens) | `src/data/photos.json` (+ `media.ts`, `menu.ts`) |
| Logo | `public/images/brand/logo.webp` (via `src/components/ui/Logo.tsx`), `src/app/icon.png`, `src/app/apple-icon.png` |
| Links do menu | `src/config/nav.ts` |

Fotos: só de bancos com licença comercial (Unsplash, Pexels) ou da própria loja, sempre registradas em `photos.json` com a página de origem. Use `<Photo>` (`components/ui/Photo.tsx`), que mostra a logo se a imagem falhar. Novos hosts remotos precisam entrar em `images.remotePatterns` no `next.config.ts`.

Regras de conteúdo: **nunca inventar** preços reais, telefone, endereço, horários, fotos da loja ou links de imagens. Campos vazios simplesmente não aparecem. Preços são demonstrativos enquanto `site.demoPrices = true` (o site avisa isso).

## Arquitetura

```
src/
  app/            layout (fontes, SEO, script da intro no <head>), page, robots, sitemap, ícone
  config/         site, copy, experience, nav
  data/           menu, builder, ingredients, media
  context/        cart-context (carrinho + localStorage), smooth-scroll (Lenis + lock)
  lib/            gsap (registro + EASE), stage (estado do palco), sequence (frames),
                  whatsapp (mensagem), ui-bus (canais leves), hooks, format, webgl
  components/
    intro/        IntroAnimation
    experience/   ScrollExperience (pin), Hero3D, AcaiCanvas (sequência), AcaiModel (R3F)
    sections/     IngredientsSection, MenuSection, ProductCard, AcaiBuilder, BuilderPreview,
                  ExperienceSection, Gallery, ContactSection
    cart/         CartDrawer
    layout/       Header, Footer, FloatingSocialButtons
```

### O palco do copo

- `lib/stage.ts` guarda um objeto **mutável** (`frame`, `bareMix`, `closeMix`, `closeFrame`, `sweep`). A timeline do GSAP escreve; o renderizador lê a cada tick do `gsap.ticker`. Não coloque esse estado em `useState` — isso re-renderizaria o React a 60 fps.
- `AcaiCanvas` decide o renderizador: `SequencePlayer` (padrão) ou `AcaiModel` (R3F, carregado com `next/dynamic` + `ssr: false`, só com WebGL e aparelho não fraco). Erro no modelo → volta para a sequência (error boundary).
- O `SequencePlayer` desenha em `<canvas>` com mistura `lighter` entre frames vizinhos (rotação suave com poucos frames) e entre sequências (completo ↔ sem coberturas ↔ close-up). O frame 0 também é um `<img>` (LCP e fallback sem JS).
- Frames são carregados progressivamente (0, depois saltos de 12, 6, 3, 1) e compartilhados entre intro e Hero (`getFrameSet`). Mobile usa a variante de 540 px.

### Coreografia da ScrollExperience (timeline de 0 a 100, pin `+=420%` desktop / `+=330%` mobile)

| Faixa | O que acontece |
| --- | --- |
| 0–20 | Título sai, copo vai da rotação ociosa até o frame 8 (~48°), círculo roxo cobre o creme, frase 1 |
| 20–40 | `bareMix` → 1; ingredientes saem do topo do copo e orbitam; etiquetas com linhas (desktop ≥ 1100 px) |
| 40–60 | Ingredientes voltam e se encaixam; `bareMix` → 0; frase 2 |
| 60–80 | `closeMix` = 1, câmera aproxima (frames do close-up); palco desliza para a direita |
| 80–100 | Afasta, gira e o copo vai para a direita (mobile: sobe); título da seção de ingredientes |

Ao mexer nos tempos, mantenha a sequência do briefing (0/20/40/60/80/100) e confira em 1440×900 e 390×844.

## Regras de animação

1. **Scroll = GSAP + ScrollTrigger com `scrub`.** Nada de listeners de scroll manuais para animar (exceção: visibilidade dos botões flutuantes).
2. **Todo efeito GSAP dentro de `gsap.context(..., root)`** e revertido no cleanup (`ctx.revert()`). Use `gsap.matchMedia()` para variar por breakpoint e para `prefers-reduced-motion`.
3. **Movimento reduzido**: com `reduce`, não há intro, pin, Lenis nem scrub. Todo conteúdo precisa estar visível no estado padrão do CSS; o JS só esconde para animar (via `fromTo`/`immediateRender`).
4. **Curvas** (`EASE` em `lib/gsap.ts`): entradas `expo.out`, saídas `power2.in`, flutuação `sine.inOut`, itens que "pousam" `back.out(1.6)`. Dentro de timelines com scrub, use `ease: "none"` por padrão e curva só onde a mudança precisa de peso.
5. **Duração**: interações de UI 160–450 ms; revelações de seção ~1–1,3 s; nada de animação em loop chamando atenção além da flutuação do copo.
6. **Nunca combine `translate` do CSS com `xPercent`/`yPercent` do GSAP no mesmo elemento.** O GSAP 3.13+ incorpora o `translate` do CSS na própria transformação e um `yPercent` explícito substitui o −50% de centralização. Padrão do projeto: wrapper posiciona (CSS), filho anima (GSAP). Rotação base também vai no filho (`style={{ rotate }}` na `<img>`).
7. **Máscaras de linha** usam a utility `line-mask` (folga para acentos) e o deslocamento de entrada/saída é ±130%.
8. **Ordem dos ScrollTriggers**: pins são criados no `useLayoutEffect` das seções (ordem da página). Gatilhos que dependem das posições finais (tema do header) são criados depois, em `requestAnimationFrame`, seguidos de `ScrollTrigger.refresh()`.
9. **Lenis** roda no `gsap.ticker` (`lagSmoothing(0)`). Para travar a rolagem use `lock()/unlock()` do `useSmoothScroll` (contagem de referências; callbacks estáveis). Áreas roláveis internas recebem `data-lenis-prevent`.
10. **Nada de animar layout** (`top`, `width`, `height`). Só `transform`, `opacity`, `clip-path` e variáveis de desenho do canvas.

## Qualidade

- Sem overflow horizontal (`body { overflow-x: clip }`); teste 390, 768, 1024, 1440 e 1920 px.
- Foco visível, `aria-*` nos diálogos (carrinho, menu, lightbox), Esc fecha, foco volta ao gatilho.
- Imagens marcadas `placeholder: true` mostram o selo "Imagem provisória" (desligue em `site.showPlaceholderBadges`).
- O pedido só é "enviado" quando o cliente envia a mensagem no WhatsApp — o site nunca afirma que o pedido foi recebido.
- `npm run typecheck` e `npm run build` precisam passar sem erros antes de publicar.

## Skills de referência

As skills "Emil Kowalski", "Impeccable" e "Taste" **não estavam instaladas** quando o projeto foi criado. Os princípios equivalentes (curvas e ritmo de movimento, refinamento tipográfico e de alinhamento, direção de arte) foram aplicados manualmente e estão descritos nas regras acima. Se forem instaladas depois, consulte-as antes de grandes mudanças visuais.
