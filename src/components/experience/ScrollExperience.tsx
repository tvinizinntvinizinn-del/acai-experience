"use client";

import type { CSSProperties } from "react";
import { useRef } from "react";
import { copy } from "@/config/copy";
import { experience } from "@/config/experience";
import { EASE, gsap, ScrollTrigger } from "@/lib/gsap";
import { useIsoLayoutEffect } from "@/lib/hooks";
import { heroStage, lerpWrap, setStage } from "@/lib/stage";
import { headerTheme, introActive } from "@/lib/ui-bus";
import { AcaiCanvas } from "./AcaiCanvas";
import { Hero3D } from "./Hero3D";

/* -------------------------------------------------------------------------- */
/* Ingredientes que "explodem" do copo (posições em fração do palco 4:5).      */
/* -------------------------------------------------------------------------- */
type Pos = { x: number; y: number; s: number };
type Orbit = {
  id: string;
  src: string;
  rot: number;
  layer: "back" | "front";
  float: number;
  desktop: Pos;
  mobile: Pos | null;
};

const L = copy.experience.labels;

const ORBIT: Orbit[] = [
  { id: "morango", src: "strawberry-half", rot: -14, layer: "front", float: 3.4, desktop: { x: -0.38, y: 0.26, s: 0.48 }, mobile: { x: 0.06, y: 0.3, s: 0.38 } },
  { id: "banana", src: "banana-slice", rot: 18, layer: "front", float: 3.9, desktop: { x: 1.32, y: 0.1, s: 0.36 }, mobile: { x: 0.93, y: 0.1, s: 0.28 } },
  { id: "granola", src: "granola", rot: -6, layer: "back", float: 4.4, desktop: { x: 1.4, y: 0.6, s: 0.5 }, mobile: { x: 0.95, y: 0.62, s: 0.34 } },
  { id: "morango-inteiro", src: "strawberry", rot: 10, layer: "back", float: 4.1, desktop: { x: -0.3, y: 0.76, s: 0.32 }, mobile: { x: 0.06, y: 0.78, s: 0.24 } },
  { id: "banana-2", src: "banana-slice", rot: -28, layer: "back", float: 3.6, desktop: { x: 0.1, y: -0.2, s: 0.21 }, mobile: null },
  { id: "leite", src: "milk-drop", rot: 8, layer: "front", float: 3.2, desktop: { x: 0.92, y: -0.2, s: 0.17 }, mobile: { x: 0.76, y: -0.1, s: 0.15 } },
  { id: "granola-bit-1", src: "granola-bit", rot: 0, layer: "front", float: 2.9, desktop: { x: -0.12, y: -0.06, s: 0.12 }, mobile: null },
  { id: "granola-bit-2", src: "granola-bit", rot: 40, layer: "back", float: 3.1, desktop: { x: 1.1, y: 0.36, s: 0.1 }, mobile: null },
];

/** Etiquetas do "desenho técnico" (desktop largo). Coordenadas do palco: x 0–100, y 0–125. */
const LABELS = [
  { text: L.strawberry, from: [-62, 7], to: [-44, 27], align: "end" },
  { text: L.banana, from: [162, 0], to: [140, 11], align: "start" },
  { text: L.milk, from: [118, -36], to: [95, -25], align: "start" },
  { text: L.granola, from: [172, 96], to: [150, 79], align: "start" },
  { text: L.acai, from: [-50, 112], to: [16, 96], align: "end" },
] as const;

const CUP_TOP = { x: 0.5, y: 0.15 };

export function ScrollExperience() {
  const rootRef = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);
      const stageEl = q('[data-exp="stage"]')[0] as HTMLElement;
      const floatEl = q('[data-exp="float"]')[0] as HTMLElement;
      const shadowEl = q('[data-exp="shadow"]')[0] as HTMLElement;
      const stageW = () => stageEl.offsetWidth;
      const stageH = () => stageEl.offsetHeight;

      // Flutuação contínua do copo (independe do scroll).
      const bob = gsap.timeline({ repeat: -1, yoyo: true, defaults: { duration: 2.8, ease: EASE.inOut } });
      bob.to(floatEl, { y: "-2.2%" }, 0).to(shadowEl, { scaleX: 0.86, opacity: 0.7 }, 0);

      // Hero entra depois da intro (quando ela está rodando).
      const heroUi = q('[data-hero="sub"], [data-hero="ctas"], [data-hero="hint"]');
      const inLines = q('[data-hero="line1"] [data-hero-in], [data-hero="line2"] [data-hero-in]');
      const inUi = q('[data-hero="sub"] [data-hero-in], [data-hero="ctas"] [data-hero-in], [data-hero="hint"] [data-hero-in]');
      let unsubIntro: (() => void) | undefined;
      let entranceTimer: number | undefined;
      if (document.documentElement.dataset.intro === "play") {
        gsap.set(inLines, { yPercent: 130 });
        gsap.set(inUi, { autoAlpha: 0, y: 24 });
        let entered = false;
        const enter = () => {
          if (entered) return;
          entered = true;
          gsap.to(inLines, { yPercent: 0, duration: 1.3, ease: EASE.out, stagger: 0.12 });
          gsap.to(inUi, { autoAlpha: 1, y: 0, duration: 1, ease: EASE.out, stagger: 0.08, delay: 0.35 });
        };
        unsubIntro = introActive.subscribe((active) => {
          if (!active) enter();
        });
        // Rede de segurança: nunca deixa o Hero escondido se a intro não rodar.
        entranceTimer = window.setTimeout(() => {
          if (!introActive.get()) enter();
        }, 9000);
      }

      const mm = gsap.matchMedia();
      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          mobile: "(max-width: 767px)",
        },
        (mmCtx) => {
          const { motion, mobile } = mmCtx.conditions as { motion: boolean; mobile: boolean };
          if (!motion) {
            setStage(heroStage, { frame: 0, bareMix: 0, closeMix: 0, closeFrame: 0 });
            headerTheme.set("light");
            return;
          }

          const N = experience.spin.count;
          const proxy = { k: 0, rot: 8, bare: 0, close: 0, cf: 0 };
          let idle = 0;
          let idlePaused = introActive.get();
          const unsub = introActive.subscribe((active) => {
            idlePaused = active;
            if (!active) idle = 0;
          });

          const apply = () => {
            const ke = proxy.k * proxy.k * (3 - 2 * proxy.k);
            const frame = proxy.k >= 1 ? proxy.rot : lerpWrap(idle, proxy.rot, ke, N);
            setStage(heroStage, { frame, bareMix: proxy.bare, closeMix: proxy.close, closeFrame: proxy.cf });
          };
          const idleTick = (_t: number, dt: number) => {
            if (proxy.k >= 1 || idlePaused) return;
            idle += (Math.min(dt, 100) / 1000) * experience.idleFramesPerSecond * (1 - proxy.k);
            apply();
          };
          gsap.ticker.add(idleTick);

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: root,
              start: "top top",
              end: mobile ? "+=330%" : "+=420%",
              pin: true,
              scrub: mobile ? 0.6 : true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => headerTheme.set(self.progress < 0.07 ? "light" : "dark"),
              onEnterBack: () => headerTheme.set("dark"),
            },
            onUpdate: apply,
          });

          const pos = (o: Orbit) => (mobile ? o.mobile : o.desktop);

          /* ---------- 0 → 20 %: Hero sai, copo gira ~45°, fundo creme → roxo ---------- */
          tl.to(proxy, { k: 1, duration: 20 }, 0);
          tl.to(q('[data-hero="line1"]'), { yPercent: -135, duration: 10, ease: EASE.in }, 1);
          tl.to(q('[data-hero="line2"]'), { yPercent: 135, duration: 10, ease: EASE.in }, 1);
          tl.to(heroUi, { autoAlpha: 0, y: -20, duration: 6, stagger: 1 }, 0);
          // Transição claro → escuro: um círculo roxo se abre a partir do copo.
          tl.fromTo(q('[data-exp="dark"]'), { clipPath: "circle(0% at 50% 54%)" }, { clipPath: "circle(80% at 50% 54%)", duration: 13, ease: "power2.in" }, 4);
          tl.to(shadowEl, { backgroundColor: "rgba(0,0,0,0.55)", duration: 13 }, 4);
          tl.to(q('[data-exp="glow"]'), { autoAlpha: 1, duration: 10 }, 11);
          tl.set(q('[data-exp="s1"]'), { autoAlpha: 1 }, 9);
          tl.fromTo(q('[data-exp="s1"] [data-line]'), { yPercent: 130 }, { yPercent: 0, duration: 5, stagger: 1, ease: EASE.out }, 9);
          tl.to(q('[data-exp="s1"] [data-line]'), { yPercent: -130, duration: 4, stagger: 0.6, ease: EASE.in }, 19.5);
          tl.set(q('[data-exp="s1"]'), { autoAlpha: 0 }, 25);

          /* ---------- 20 → 40 %: ingredientes saem do copo e flutuam ao redor ---------- */
          tl.to(proxy, { rot: 12, duration: 20 }, 20);
          tl.to(proxy, { bare: 1, duration: 7 }, 23);
          ORBIT.forEach((o, i) => {
            const p = pos(o);
            if (!p) return;
            const el = q(`[data-orbit="${o.id}"]`)[0];
            tl.fromTo(
              el,
              { x: () => (CUP_TOP.x - p.x) * stageW(), y: () => (CUP_TOP.y - p.y) * stageH(), scale: 0.18, rotation: o.rot - 70, autoAlpha: 0 },
              { x: 0, y: 0, scale: 1, rotation: o.rot, autoAlpha: 1, duration: 12, ease: "power2.out" },
              23 + i * 0.7,
            );
            /* 40 → 60 %: voltam e se encaixam no topo */
            tl.to(el, { x: () => (CUP_TOP.x - p.x) * stageW(), y: () => (CUP_TOP.y + 0.03 - p.y) * stageH(), scale: 0.16, rotation: o.rot + 50, duration: 9, ease: "power2.in" }, 42 + i * 0.4);
            tl.to(el, { autoAlpha: 0, duration: 2 }, 49 + i * 0.4);
          });
          if (!mobile) {
            tl.fromTo(q("[data-label-line]"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 5, stagger: 0.8 }, 31);
            tl.fromTo(q("[data-label]"), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 4, stagger: 0.8 }, 32);
            tl.to(q("[data-label], [data-label-line]"), { autoAlpha: 0, duration: 3 }, 41);
          }

          /* ---------- 40 → 60 %: montagem ---------- */
          tl.to(proxy, { rot: 15, duration: 20 }, 40);
          tl.to(proxy, { bare: 0, duration: 6 }, 47);
          tl.set(q('[data-exp="s2"]'), { autoAlpha: 1 }, 50);
          tl.fromTo(q('[data-exp="s2"] [data-line]'), { yPercent: 130 }, { yPercent: 0, duration: 5, stagger: 1, ease: EASE.out }, 50);
          tl.to(q('[data-exp="s2"] [data-line]'), { yPercent: -130, duration: 3.5, stagger: 0.5, ease: EASE.in }, 58.5);
          tl.set(q('[data-exp="s2"]'), { autoAlpha: 0 }, 63);

          /* ---------- 60 → 80 %: close-up na textura ---------- */
          tl.set(proxy, { close: 1, cf: 0 }, 60);
          tl.to(proxy, { cf: experience.closeup.count - 1, duration: 18, ease: "sine.inOut" }, 60.5);
          tl.to(shadowEl, { autoAlpha: 0, duration: 4 }, 60);
          tl.to(q('[data-exp="glow"]'), { scale: 1.35, xPercent: mobile ? 0 : 12, duration: 18 }, 60);
          tl.to(stageEl, mobile ? { y: () => -0.07 * window.innerHeight, scale: 1.08, duration: 10, ease: "power2.inOut" } : { x: () => window.innerWidth * 0.13, scale: 1.14, duration: 10, ease: "power2.inOut" }, 60);
          tl.set(q('[data-exp="close"]'), { autoAlpha: 1 }, 64);
          tl.fromTo(q('[data-exp="close"] [data-line]'), { yPercent: 130 }, { yPercent: 0, duration: 6, stagger: 1.2, ease: EASE.out }, 64);
          tl.fromTo(q('[data-exp="close"] [data-caption]'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 5 }, 68);
          tl.to(q('[data-exp="close"]'), { autoAlpha: 0, duration: 4 }, 79);

          /* ---------- 80 → 100 %: afasta, gira e abre espaço à direita ---------- */
          tl.to(proxy, { cf: 0, duration: 8, ease: "sine.inOut" }, 80);
          tl.set(proxy, { close: 0 }, 88);
          tl.to(proxy, { rot: 20, duration: 12 }, 88);
          tl.to(shadowEl, { autoAlpha: 1, duration: 4 }, 88);
          tl.to(q('[data-exp="glow"]'), { scale: 1, xPercent: mobile ? 0 : 22, yPercent: mobile ? -12 : 0, duration: 12 }, 86);
          tl.to(stageEl, mobile ? { y: () => -0.16 * window.innerHeight, scale: 0.7, duration: 12, ease: "power2.inOut" } : { x: () => window.innerWidth * 0.22, scale: 0.88, duration: 12, ease: "power2.inOut" }, 84);
          tl.set(q('[data-exp="outro"]'), { autoAlpha: 1 }, 90);
          tl.fromTo(q('[data-exp="outro"] [data-line]'), { yPercent: 130 }, { yPercent: 0, duration: 6, stagger: 1.4, ease: EASE.out }, 90);
          tl.fromTo(q('[data-exp="outro"] [data-caption]'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 5 }, 94);
          tl.set({}, {}, 100);

          return () => {
            gsap.ticker.remove(idleTick);
            unsub();
          };
        },
      );

      return () => {
        unsubIntro?.();
        window.clearTimeout(entranceTimer);
      };
    }, root);

    // Recalcula posições quando as fontes terminam de carregar.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="inicio"
      ref={rootRef}
      aria-label="Apresentação"
      data-header="auto"
      className="relative h-svh min-h-[34rem] w-full overflow-hidden bg-cream"
    >
      <div data-exp="dark" aria-hidden="true" className="pointer-events-none absolute inset-0 bg-night" style={{ clipPath: "circle(0% at 50% 54%)" }} />
      <div
        data-exp="glow"
        aria-hidden="true"
        className="exp-glow pointer-events-none invisible absolute inset-0 opacity-0"
      />

      <Hero3D />

      {/* Frases grandes que aparecem ao lado do copo */}
      <Statement id="s1" lines={copy.experience.statement1} className="left-[5vw] top-[50svh] -translate-y-1/2 text-left max-md:inset-x-0 max-md:top-[9svh] max-md:translate-y-0 max-md:text-center" />
      <Statement id="s2" lines={copy.experience.statement2} className="right-[5vw] top-[50svh] -translate-y-1/2 text-right max-md:inset-x-0 max-md:top-[9svh] max-md:translate-y-0 max-md:text-center" />

      {/* Palco do copo */}
      <div
        data-exp="stage"
        className="exp-stage absolute left-1/2 top-[45svh] z-20 aspect-[4/5] h-[min(42svh,112vw)] md:top-[54svh] md:h-[56svh]"
      >
        <OrbitLayer layer="back" />
        <div data-exp="float" className="absolute inset-0">
          <div data-exp="shadow" aria-hidden="true" className="absolute bottom-[1%] left-1/2 h-[6%] w-[64%] -translate-x-1/2 rounded-[50%] bg-night/25 blur-xl" />
          <AcaiCanvas stage={heroStage} className="stage-feather h-full w-full" />
        </div>
        <OrbitLayer layer="front" />
        <svg aria-hidden="true" viewBox="0 0 100 125" className="pointer-events-none absolute inset-0 hidden h-full w-full overflow-visible min-[1100px]:block">
          {LABELS.map((l) => (
            <g key={l.text}>
              <line data-label-line x1={l.from[0]} y1={l.from[1]} x2={l.to[0]} y2={l.to[1]} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} className="stroke-cream/55" strokeWidth={0.28} />
              <circle data-label cx={l.to[0]} cy={l.to[1]} r={0.9} className="invisible fill-berry opacity-0" />
            </g>
          ))}
        </svg>
        {LABELS.map((l) => (
          <span
            key={l.text}
            aria-hidden="true"
            className="absolute hidden whitespace-nowrap text-[0.95rem] font-medium text-cream min-[1100px]:block"
            style={{
              left: `${l.from[0]}%`,
              top: `${(l.from[1] / 125) * 100}%`,
              translate: l.align === "end" ? "calc(-100% - 0.6rem) -50%" : "0.6rem -50%",
            }}
          >
            <span data-label className="invisible block opacity-0">
              {l.text}
            </span>
          </span>
        ))}
      </div>

      {/* Close-up */}
      <div data-exp="close" aria-hidden="true" className="invisible absolute bottom-[7svh] left-[5vw] right-[5vw] z-30 text-cream opacity-0 md:right-auto md:max-w-[46vw]">
        <p className="type-display text-big">
          {copy.experience.closeup.map((line) => (
            <span key={line} className="line-mask">
              <span data-line className="block">
                {line}
              </span>
            </span>
          ))}
        </p>
        <p data-caption className="mt-4 max-w-[26rem] text-base text-cream/75 md:text-lg">
          {copy.experience.closeupCaption}
        </p>
      </div>

      {/* Fechamento: abre espaço para a seção de ingredientes */}
      <div data-exp="outro" aria-hidden="true" className="invisible absolute inset-x-6 top-[60svh] z-30 text-cream opacity-0 md:inset-x-auto md:left-[5vw] md:top-1/2 md:max-w-[44vw] md:-translate-y-1/2">
        <p className="type-display text-big">
          {copy.ingredients.title.map((line) => (
            <span key={line} className="line-mask">
              <span data-line className="block">
                {line}
              </span>
            </span>
          ))}
        </p>
        <p data-caption className="mt-5 max-w-[27rem] text-base text-cream/75 md:text-lg">
          {copy.ingredients.lead}
        </p>
      </div>
    </section>
  );
}

function Statement({ id, lines, className }: { id: string; lines: readonly string[]; className: string }) {
  return (
    <div data-exp={id} aria-hidden="true" className={`pointer-events-none invisible absolute z-10 text-cream opacity-0 ${className}`}>
      <p className="type-display text-statement">
        {lines.map((line) => (
          <span key={line} className="line-mask">
            <span data-line className="block">
              {line}
            </span>
          </span>
        ))}
      </p>
    </div>
  );
}

function OrbitLayer({ layer }: { layer: "back" | "front" }) {
  return (
    <>
      {ORBIT.filter((o) => o.layer === layer).map((o) => {
        const style = {
          "--x": o.desktop.x,
          "--y": o.desktop.y,
          "--s": o.desktop.s,
          "--mx": o.mobile?.x ?? 0,
          "--my": o.mobile?.y ?? 0,
          "--ms": o.mobile?.s ?? 0,
        } as CSSProperties;
        return (
          <div key={o.id} data-orbit={o.id} aria-hidden="true" className={`orbit invisible opacity-0 ${o.mobile ? "" : "max-md:hidden"} ${layer === "front" ? "z-10" : ""}`} style={style}>
            <div className="orbit-float" style={{ animationDuration: `${o.float}s` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/images/ingredients/${o.src}.webp`} alt="" width={512} height={512} loading="lazy" decoding="async" className="h-auto w-full" />
            </div>
          </div>
        );
      })}
    </>
  );
}
