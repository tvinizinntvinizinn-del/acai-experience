# Açaí Point 92

Site cinematográfico da açaiteria Açaí Point 92: copo de açaí como protagonista, intro animada,
coreografia de scroll com GSAP, cardápio, montador de copo, carrinho e pedido pelo
WhatsApp.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · GSAP +
ScrollTrigger · Lenis · React Three Fiber + Drei · Lucide.

## Rodando

Requer Node.js 20.9 ou superior.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # build de produção (inclui checagem de tipos)
npm start
```

Para rever a intro depois da primeira visita, abra uma aba anônima (ela roda uma vez
por sessão) ou limpe o `sessionStorage`.

## Configurando a loja

| O quê | Onde |
| --- | --- |
| Nome, WhatsApp, Instagram, endereço, horários, retirada/entrega | `src/config/site.ts` |
| Títulos, frases e botões | `src/config/copy.ts` |
| Produtos, tamanhos e preços | `src/data/menu.ts` |
| Bases, complementos, coberturas e limites do montador | `src/data/builder.ts` |
| Fotos (cardápio, Experiência, Galeria) | `src/data/photos.json`, `src/data/media.ts`, `src/data/menu.ts` |

- **WhatsApp:** só dígitos com DDI e DDD (`"5511912345678"`). Enquanto estiver vazio, o botão de finalizar fica desativado e os atalhos flutuantes não aparecem em produção.
- **Preços:** os valores atuais são **de demonstração** e o site avisa isso. Troque pelos reais e mude `demoPrices` para `false`.
- **Endereço e horários:** só aparecem quando preenchidos.

## Fotos, logo e o copo 3D

**Logo:** arte oficial da loja com o fundo recortado em `public/images/brand/logo.webp`, usada pelo componente `src/components/ui/Logo.tsx` (header, menu do celular, rodapé e reserva das fotos). Ícone da aba em `src/app/icon.png` e ícone do iPhone em `src/app/apple-icon.png`. Os originais ficam em `tools/brand/` (`logo-original.png` com fundo, `logo-recortada.webp` sem fundo). Para trocar a logo, substitua `logo.webp` por outra com fundo transparente e ajuste `LOGO.width/height` em `Logo.tsx`.

**Fotos (cardápio, Experiência e Galeria):** fotos reais de açaí de bancos gratuitos, listadas em `src/data/photos.json` com o link da página original de cada uma.

- Licenças: [Unsplash License](https://unsplash.com/license) e [Pexels License](https://www.pexels.com/license/) — uso comercial gratuito, sem atribuição obrigatória (o site dá o crédito mesmo assim).
- São **ilustrativas**: não são fotos da loja nem dos produtos exatos (o cardápio avisa "Imagens meramente ilustrativas"). Troque por fotos próprias assim que tiver.
- Por padrão o site carrega as fotos dos servidores do Unsplash/Pexels e o `next/image` otimiza e guarda em cache. Para hospedar as cópias no próprio projeto: `npm run fotos` (baixa para `public/images/fotos/`) e depois `localPhotos: true` em `src/config/site.ts`.
- Se uma foto não carregar (sem internet, prévia, link removido), entra no lugar um render 3D local de `public/images/fallback/` com o mesmo tema. Se nem esse carregar, aparece um painel roxo com a logo.

**Copo 3D (renders):** o copo do Hero, os ingredientes animados, a prévia do montador e o copo do contato são renders gerados por código (copo de plástico transparente com reflexo de estúdio, açaí cremoso, banana e morango encostados na parede, granola 3D, leite condensado e gotas de condensação):

| Arquivo | Para quê |
| --- | --- |
| `public/sequence/spin/**` | 60 frames da volta de 360° do copo (Hero e scroll) |
| `public/sequence/bare/**` | Mesmos ângulos sem coberturas (ingredientes saindo do copo) |
| `public/sequence/closeup/**` | Aproximação da câmera na textura |
| `public/images/ingredients/*.webp` | Recortes dos ingredientes (fundo transparente) |
| `public/images/builder/base-*.webp` | Copo sem coberturas por base (prévia do montador) |
| `public/images/menu/especial.webp` | Copo flutuante da seção de contato |
| `public/images/og.jpg` | Imagem de compartilhamento (1200 × 630) |

Para a versão final do copo:

1. **Sequência renderizada (recomendado):** exporte os frames com as especificações de `public/sequence/README.md` e substitua os arquivos com os mesmos nomes.
2. **Modelo 3D:** coloque `public/models/acai-cup.glb` (convenções em `public/models/README.md`) e mude `renderer: "model"` em `src/config/experience.ts`.

O script que gerou os renders está em `tools/render-placeholders` (veja o README de lá).

## O que cada seção faz

- **Intro:** gota flutuando → câmera se aproxima → queda em câmera lenta → onda roxa → o copo surge girando sob luz lateral → "NÃO É SÓ AÇAÍ." / "É UMA EXPERIÊNCIA." → a câmera se afasta e o copo pousa no Hero. Pode ser pulada (botão ou Esc), não bloqueia o carregamento e é ignorada com movimento reduzido.
- **Hero + ScrollExperience (pin):** 0% copo flutuando · 20% gira ~45° e o fundo vira roxo · 40% morango, banana, granola e leite condensado saem do copo e flutuam com etiquetas · 60% voltam e se encaixam · 80% close-up na textura · 100% o copo vai para a direita e abre a seção seguinte.
- **Ingredientes:** o açaí fica no centro (visto de cima); morango entra pela esquerda, banana pela direita, granola cai e o leite condensado é desenhado em espiral.
- **Cardápio:** 7 produtos com tamanhos, preço por tamanho, "Personalizar" (abre o montador já com a combinação) e "Adicionar".
- **Monte seu açaí:** 5 etapas (tamanho, base, complementos, coberturas, revisão) com prévia ilustrativa que recebe cada ingrediente e preço atualizado.
- **Carrinho:** quantidades, observações por item, nome, retirada ou entrega, endereço, subtotal e mensagem organizada para o WhatsApp (ou "Copiar mensagem"). O carrinho fica salvo no navegador.
- **Experiência, Galeria (com lightbox) e Contato.**

## Desempenho e acessibilidade

- Frames carregados progressivamente; variante leve (540 px) no mobile e em conexões econômicas.
- O modelo 3D só é baixado no modo `"model"`, com WebGL e em aparelhos não fracos.
- `prefers-reduced-motion`: sem intro, sem pin, sem scroll suave; tudo visível.
- Funciona sem WebGL (sequência em `<canvas>` 2D) e o primeiro frame é um `<img>` (LCP e sem JS).
- Diálogos acessíveis (carrinho, menu, lightbox), foco visível, link "Pular para o conteúdo".
- SEO: metadados, Open Graph, `robots.txt`, `sitemap.xml` e dados estruturados só com o que estiver configurado. Ajuste `site.url` para o domínio real.

## Publicando

Funciona em qualquer host com suporte a Next.js (Vercel, por exemplo): conecte o
repositório e publique. Defina `site.url` antes.

## Regras para quem for editar

Leia `CLAUDE.md` — arquitetura, coreografia de scroll e regras de animação.
