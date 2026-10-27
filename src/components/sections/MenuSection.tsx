"use client";

import { useRef } from "react";
import { copy } from "@/config/copy";
import { site } from "@/config/site";
import { MENU } from "@/data/menu";
import { EASE, gsap } from "@/lib/gsap";
import { useIsoLayoutEffect } from "@/lib/hooks";
import { ProductCard } from "./ProductCard";

export function MenuSection() {
  const rootRef = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-card]");
        gsap.from(cards, {
          y: 70,
          autoAlpha: 0,
          duration: 1.1,
          ease: EASE.out,
          stagger: 0.09,
          scrollTrigger: { trigger: "[data-menu-grid]", start: "top 82%", once: true },
        });
        gsap.from("[data-menu-title] > span", {
          yPercent: 130,
          duration: 1.1,
          ease: EASE.out,
          stagger: 0.1,
          scrollTrigger: { trigger: root, start: "top 75%", once: true },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="cardapio" ref={rootRef} data-header="light" aria-labelledby="cardapio-titulo" className="relative bg-cream py-24 text-graphite md:py-32">
      <div className="px-6 md:px-[5vw]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 id="cardapio-titulo" data-menu-title className="type-display text-title line-mask">
            <span className="block">{copy.menu.title}</span>
          </h2>
          <div className="max-w-[24rem] text-graphite/70">
            <p className="text-base md:text-lg">{copy.menu.lead}</p>
            <p className="mt-2 text-sm text-graphite/50">{site.demoPrices ? "Preços de demonstração. " : ""}Imagens meramente ilustrativas.</p>
          </div>
        </div>
      </div>

      <div
        data-menu-grid
        className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-6 px-6 pb-4 md:mt-16 md:grid md:snap-none md:grid-cols-2 md:gap-x-6 md:gap-y-14 md:overflow-visible md:px-[5vw] xl:grid-cols-4"
      >
        {MENU.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
