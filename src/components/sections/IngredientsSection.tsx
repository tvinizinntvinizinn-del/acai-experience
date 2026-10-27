"use client";

import { useRef } from "react";
import { copy } from "@/config/copy";
import { INGREDIENTS } from "@/data/ingredients";
import { useSmoothScroll } from "@/context/smooth-scroll";
import { EASE, gsap } from "@/lib/gsap";
import { useIsoLayoutEffect } from "@/lib/hooks";

type Topping = {
  step: 1 | 2 | 3 | 4;
  src: string;
  /** Posição final no copo visto de cima (% da caixa). */
  x: number;
  y: number;
  /** Largura (% da caixa). */
  w: number;
  rot: number;
};

const TOPPINGS: Topping[] = [
  { step: 1, src: "strawberry-half", x: 31, y: 35, w: 27, rot: -24 },
  { step: 1, src: "strawberry-half", x: 38, y: 63, w: 24, rot: 150 },
  { step: 1, src: "strawberry", x: 21, y: 53, w: 18, rot: 32 },
  { step: 2, src: "banana-slice", x: 66, y: 31, w: 19, rot: 0 },
  { step: 2, src: "banana-slice", x: 73, y: 53, w: 17, rot: 40 },
  { step: 2, src: "banana-slice", x: 61, y: 69, w: 16, rot: 80 },
  { step: 2, src: "banana-slice", x: 52, y: 45, w: 15, rot: 12 },
  { step: 3, src: "granola", x: 45, y: 76, w: 30, rot: -8 },
  { step: 3, src: "granola-bit", x: 33, y: 81, w: 7, rot: 10 },
  { step: 3, src: "granola-bit", x: 58, y: 84, w: 6, rot: 60 },
  { step: 3, src: "granola-bit", x: 27, y: 70, w: 6, rot: 120 },
  { step: 3, src: "granola-bit", x: 64, y: 77, w: 7, rot: 200 },
  { step: 3, src: "granola-bit", x: 47, y: 89, w: 5, rot: 300 },
];

/** Fio de leite condensado em espiral irregular (viewBox 0–100). */
const DRIZZLE = (() => {
  const pts: string[] = [];
  const turns = 2.35;
  for (let i = 0; i <= 180; i++) {
    const t = i / 180;
    const wobble = Math.sin(t * 31) * 0.9 + Math.sin(t * 13 + 1.7) * 1.4;
    const r = 4 + 27 * t + wobble;
    const a = t * turns * Math.PI * 2 + 0.6 + Math.sin(t * 9) * 0.12;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(2)} ${(50 + Math.sin(a) * r * 0.94).toFixed(2)}`);
  }
  return `M ${pts.join(" L ")}`;
})();

export function IngredientsSection() {
  const rootRef = useRef<HTMLElement>(null);
  const { scrollTo } = useSmoothScroll();

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add({ motion: "(prefers-reduced-motion: no-preference)", mobile: "(max-width: 767px)" }, (c) => {
        const { motion, mobile } = c.conditions as { motion: boolean; mobile: boolean };
        if (!motion) return;

        const bowl = q('[data-ing="bowl"]')[0] as HTMLElement;
        const panels = q("[data-panel]");
        const bars = q("[data-bar]");
        const vw = () => window.innerWidth;
        const vh = () => window.innerHeight;

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: mobile ? "+=260%" : "+=320%",
            pin: true,
            scrub: mobile ? 0.6 : true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // O açaí permanece no centro, girando devagar durante toda a seção.
        tl.fromTo(bowl, { rotation: -8, scale: 0.92 }, { rotation: 46, scale: 1, duration: 100 }, 0);
        tl.fromTo(q('[data-ing="berries"]'), { autoAlpha: 0, scale: 0.6, y: 30 }, { autoAlpha: 1, scale: 1, y: 0, duration: 6, ease: EASE.out }, 1);
        tl.to(q('[data-ing="berries"]'), { autoAlpha: 0, y: -30, duration: 5, ease: EASE.in }, 12);

        const stepAt = [0, 12, 32, 52, 72];
        panels.forEach((panel, i) => {
          if (i > 0) {
            tl.fromTo(panel, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 5, ease: EASE.out }, stepAt[i] + 1);
            tl.to(panels[i - 1], { autoAlpha: 0, y: -40, duration: 4, ease: EASE.in }, stepAt[i] - 3);
          }
          if (bars[i]) tl.fromTo(bars[i], { scaleX: 0 }, { scaleX: 1, duration: (stepAt[i + 1] ?? 100) - stepAt[i] }, stepAt[i]);
        });

        // Morango entra pela esquerda, banana pela direita, granola cai.
        q("[data-top]").forEach((el, i) => {
          const step = Number((el as HTMLElement).dataset.step);
          const start = stepAt[step] + 2 + (i % 4) * 1.6;
          if (step === 1) {
            tl.fromTo(el, { x: () => -vw() * 0.75, y: () => -vh() * 0.1, rotation: -140, scale: mobile ? 1.4 : 1.9, autoAlpha: 0 }, { x: 0, y: 0, rotation: 0, scale: 1, autoAlpha: 1, duration: 11, ease: "power3.out" }, start);
          } else if (step === 2) {
            tl.fromTo(el, { x: () => vw() * 0.75, y: () => vh() * 0.08, rotation: 160, scale: mobile ? 1.4 : 1.9, autoAlpha: 0 }, { x: 0, y: 0, rotation: 0, scale: 1, autoAlpha: 1, duration: 11, ease: "power3.out" }, start);
          } else if (step === 3) {
            tl.fromTo(el, { y: () => -vh() * 0.9, rotation: -90, autoAlpha: 0 }, { y: 0, rotation: 0, autoAlpha: 1, duration: 10, ease: EASE.settle }, stepAt[3] + 2 + (i % 6) * 1.2);
          }
        });

        // Leite condensado: uma gota cai e o fio se desenha em espiral.
        tl.fromTo(q('[data-ing="drop"]'), { y: () => -vh() * 0.7, autoAlpha: 0, scaleY: 1.2 }, { y: 0, autoAlpha: 1, scaleY: 1, duration: 6, ease: "power2.in" }, stepAt[4] + 1);
        tl.to(q('[data-ing="drop"]'), { autoAlpha: 0, scale: 0.4, duration: 2 }, stepAt[4] + 7);
        tl.fromTo(q('[data-ing="drizzle"]'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 18, ease: "power1.inOut" }, stepAt[4] + 7);
        tl.set({}, {}, 100);
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="ingredientes"
      ref={rootRef}
      data-header="dark"
      aria-labelledby="ingredientes-titulo"
      className="relative overflow-hidden bg-night text-cream motion-safe:h-svh motion-safe:min-h-[34rem] motion-reduce:py-24"
    >
      <h2 id="ingredientes-titulo" className="motion-safe:sr-only motion-reduce:type-display motion-reduce:text-title motion-reduce:px-6 motion-reduce:pb-10 motion-reduce:md:px-[5vw]">
        {copy.ingredients.title.join(" ")}
      </h2>

      {/* Copo visto de cima */}
      <div className="flex items-center justify-center motion-safe:absolute motion-safe:inset-x-0 motion-safe:top-[12svh] motion-safe:h-[48svh] md:motion-safe:left-[40vw] md:motion-safe:right-[2vw] md:motion-safe:top-0 md:motion-safe:h-full motion-reduce:py-6">
        <div data-ing="bowl" className="relative aspect-square w-[min(86vw,46svh)] md:w-[min(46vw,74svh)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/ingredients/acai-top.webp" alt="Açaí cremoso no copo, visto de cima" width={1000} height={1000} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full" />
          {TOPPINGS.map((t, i) => (
            <div
              key={i}
              data-top
              data-step={t.step}
              className="absolute"
              style={{ left: `${t.x}%`, top: `${t.y}%`, width: `${t.w}%`, translate: "-50% -50%" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/images/ingredients/${t.src}.webp`} alt="" width={512} height={512} loading="lazy" decoding="async" style={{ rotate: `${t.rot}deg` }} className="h-auto w-full drop-shadow-[0_10px_14px_rgba(10,0,20,0.45)]" />
            </div>
          ))}
          <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
            <path d={DRIZZLE} fill="none" stroke="rgba(30,8,40,0.4)" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" transform="translate(0.6 1)" pathLength={1} strokeDasharray="1 1" data-ing="drizzle" className="motion-reduce:[stroke-dashoffset:0]" />
            <path d={DRIZZLE} fill="none" stroke="#EFD9A8" strokeOpacity={0.96} strokeWidth={0.95} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" data-ing="drizzle" className="motion-reduce:[stroke-dashoffset:0]" />
            <path d={DRIZZLE} fill="none" stroke="#FFFBF2" strokeOpacity={0.7} strokeWidth={0.25} strokeLinecap="round" strokeLinejoin="round" transform="translate(-0.4 -0.5)" pathLength={1} strokeDasharray="1 1" data-ing="drizzle" className="motion-reduce:[stroke-dashoffset:0]" />
          </svg>
          <div data-ing="drop" aria-hidden="true" className="invisible absolute left-1/2 top-[44%] w-[9%] -translate-x-1/2 opacity-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/ingredients/milk-drop.webp" alt="" width={512} height={512} loading="lazy" className="h-auto w-full" />
          </div>
          <div data-ing="berries" aria-hidden="true" className="invisible absolute -right-[4%] -top-[6%] w-[24%] opacity-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/ingredients/acai-berries.webp" alt="" width={512} height={512} loading="lazy" className="h-auto w-full" />
          </div>
        </div>
      </div>

      {/* Texto de cada camada */}
      <div className="motion-safe:absolute motion-safe:inset-x-6 motion-safe:bottom-[7svh] motion-safe:h-[30svh] md:motion-safe:inset-x-auto md:motion-safe:bottom-auto md:motion-safe:left-[5vw] md:motion-safe:top-1/2 md:motion-safe:h-[22rem] md:motion-safe:w-[34vw] md:motion-safe:-translate-y-1/2 motion-reduce:grid motion-reduce:gap-10 motion-reduce:px-6 motion-reduce:pt-8 motion-reduce:sm:grid-cols-2 motion-reduce:md:px-[5vw] motion-reduce:lg:grid-cols-3">
        {INGREDIENTS.map((ing, i) => (
          <article
            key={ing.id}
            data-panel
            className={`motion-safe:absolute motion-safe:inset-0 motion-safe:flex motion-safe:flex-col motion-safe:justify-end md:motion-safe:justify-center ${i === 0 ? "" : "motion-safe:invisible motion-safe:opacity-0"}`}
          >
            <p className="text-sm tabular-nums text-cream/55">
              Camada {i + 1} de {INGREDIENTS.length}
            </p>
            <h3 className="type-display text-big mt-2">{ing.name}</h3>
            <p className="mt-3 max-w-[28rem] text-base leading-relaxed text-cream/75 md:mt-4 md:text-lg">{ing.description}</p>
            {i === INGREDIENTS.length - 1 && (
              <div className="mt-6">
                <button type="button" onClick={() => scrollTo("#monte-seu-acai")} className="btn btn-primary">
                  MONTAR MEU AÇAÍ
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Progresso das camadas */}
      <div aria-hidden="true" className="absolute bottom-6 left-[5vw] hidden gap-2 motion-safe:md:flex">
        {INGREDIENTS.map((ing) => (
          <span key={ing.id} className="relative block h-[3px] w-10 overflow-hidden rounded-full bg-cream/15">
            <span data-bar className="absolute inset-0 origin-left scale-x-0 rounded-full bg-berry" />
          </span>
        ))}
      </div>
    </section>
  );
}
