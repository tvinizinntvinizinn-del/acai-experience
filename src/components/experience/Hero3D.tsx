"use client";

import { copy } from "@/config/copy";
import { useSmoothScroll } from "@/context/smooth-scroll";

/**
 * Camadas do Hero que vivem dentro do palco da ScrollExperience.
 * O título fica ATRÁS do copo (z-10) e a interface NA FRENTE (z-40).
 *
 * Cada bloco tem dois níveis: o externo ([data-hero]) é animado pelo scroll
 * (saída) e o interno ([data-hero-in]) pela entrada após a intro — assim as
 * duas animações nunca disputam a mesma propriedade.
 */
export function Hero3D() {
  const { scrollTo } = useSmoothScroll();
  const [line1, line2] = copy.hero.title;

  return (
    <>
      <h1 className="sr-only">
        {copy.hero.title.join(" ")} {copy.hero.subtitle}
      </h1>

      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[11svh] z-10 flex justify-center px-4 text-graphite">
        <div className="line-mask">
          <p data-hero="line1" className="type-display text-hero whitespace-nowrap">
            <span data-hero-in className="block">
              {line1}
            </span>
          </p>
        </div>
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[63.5svh] z-10 flex justify-center px-4 text-graphite md:top-[76svh]">
        <div className="line-mask">
          <p data-hero="line2" className="type-display text-hero whitespace-nowrap">
            <span data-hero-in className="block">
              {line2}
            </span>
          </p>
        </div>
      </div>

      <div
        data-hero="sub"
        className="absolute inset-x-6 top-[74.5svh] z-40 mx-auto max-w-[22rem] md:inset-x-auto md:left-[5vw] md:top-[44svh] md:mx-0 md:max-w-[19rem]"
      >
        <p data-hero-in className="text-center text-[1.02rem] leading-snug text-graphite/80 md:text-left md:text-lg">
          {copy.hero.subtitle}
        </p>
      </div>

      <div
        data-hero="ctas"
        className="absolute inset-x-6 bottom-[max(4svh,1.25rem)] z-40 md:inset-x-auto md:bottom-auto md:right-[5vw] md:top-[42svh]"
      >
        <div data-hero-in className="flex flex-col gap-3 sm:flex-row sm:justify-center md:flex-col md:items-end">
          <button type="button" onClick={() => scrollTo("#monte-seu-acai")} className="btn btn-primary w-full sm:w-auto">
            {copy.hero.primaryCta}
          </button>
          <button type="button" onClick={() => scrollTo("#cardapio")} className="btn btn-outline-dark w-full sm:w-auto">
            {copy.hero.secondaryCta}
          </button>
        </div>
      </div>

      <div data-hero="hint" aria-hidden="true" className="absolute bottom-[5svh] left-[5vw] z-40 hidden md:block">
        <div data-hero-in className="flex items-center gap-3 text-sm text-graphite/60">
          <span className="relative block h-10 w-px overflow-hidden bg-graphite/15">
            <span className="scroll-hint-dot absolute left-0 top-0 block h-3 w-px bg-graphite/70" />
          </span>
          {copy.hero.scrollHint}
        </div>
      </div>
    </>
  );
}
