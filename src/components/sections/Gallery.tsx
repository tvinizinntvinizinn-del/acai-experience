"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { copy } from "@/config/copy";
import { useSmoothScroll } from "@/context/smooth-scroll";
import { GALLERY } from "@/data/media";
import { EASE, gsap } from "@/lib/gsap";
import { useIsoLayoutEffect } from "@/lib/hooks";
import { PlaceholderBadge } from "@/components/ui/PlaceholderBadge";
import { Photo } from "@/components/ui/Photo";

export function Gallery() {
  const rootRef = useRef<HTMLElement>(null);
  const [index, setIndex] = useState<number | null>(null);

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-gcard]");
        gsap.fromTo(
          cards,
          { clipPath: "inset(12% 12% 12% 12% round 2rem)", autoAlpha: 0, y: 60 },
          { clipPath: "inset(0% 0% 0% 0% round 1.75rem)", autoAlpha: 1, y: 0, duration: 1.3, ease: EASE.out, stagger: 0.1, scrollTrigger: { trigger: "[data-ggrid]", start: "top 80%", once: true } },
        );
        cards.forEach((card, i) => {
          const img = card.querySelector("[data-gimg]");
          gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: i % 2 ? 0.8 : true } });
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="galeria" ref={rootRef} data-header="light" aria-labelledby="galeria-titulo" className="relative bg-cream py-24 text-graphite md:py-32">
      <div className="px-6 md:px-[5vw]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 id="galeria-titulo" className="type-display text-title">
            {copy.gallery.title}
          </h2>
          <p className="text-graphite/60">{copy.gallery.lead}</p>
        </div>

        <div data-ggrid className="mt-12 columns-1 gap-5 sm:columns-2 md:mt-16 lg:columns-3 [&>*]:mb-5">
          {GALLERY.map((item, i) => (
            <button
              key={item.src + i}
              type="button"
              data-gcard
              onClick={() => setIndex(i)}
              className="group relative block w-full break-inside-avoid overflow-hidden rounded-[1.75rem] text-left"
              style={{ aspectRatio: `${item.width} / ${item.height}` }}
              aria-label={`Ampliar imagem: ${item.alt}`}
            >
              <span data-gimg className="absolute inset-[-5%] block">
                <Photo src={item.src} fallbackSrc={item.fallback} alt={item.alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.05]" />
              </span>
              <span className="absolute bottom-4 right-4 grid size-10 place-items-center rounded-full bg-cream/85 text-graphite opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                <Maximize2 aria-hidden="true" className="size-4" />
              </span>
              {item.placeholder && <PlaceholderBadge className="left-4 top-4" />}
            </button>
          ))}
        </div>
      </div>

      <Lightbox index={index} onChange={setIndex} />
    </section>
  );
}

function Lightbox({ index, onChange }: { index: number | null; onChange: (i: number | null) => void }) {
  const { lock, unlock } = useSmoothScroll();
  const closeRef = useRef<HTMLButtonElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const [fallbacks, setFallbacks] = useState<string[]>([]);
  const open = index !== null;
  const total = GALLERY.length;

  const step = useCallback(
    (dir: number) => {
      if (index === null) return;
      onChange((index + dir + total) % total);
    },
    [index, onChange, total],
  );

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    lock();
    closeRef.current?.focus();
    return () => {
      unlock();
      previous?.focus?.();
    };
  }, [open, lock, unlock]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onChange(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onChange, step]);

  useEffect(() => {
    if (index === null || !imgRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(imgRef.current, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: EASE.out });
  }, [index]);

  if (index === null) return null;
  const item = GALLERY[index];

  return (
    <div role="dialog" aria-modal="true" aria-label="Galeria ampliada" className="fixed inset-0 z-[110] flex items-center justify-center bg-night/95 p-4 text-cream md:p-10" onClick={() => onChange(null)}>
      <div ref={imgRef} className="relative h-full max-h-[86svh] w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
        <Photo key={item.src} src={item.src} fallbackSrc={item.fallback} onFallback={() => setFallbacks((f) => (f.includes(item.src) ? f : [...f, item.src]))} alt={item.alt} fill sizes="100vw" className="object-contain" />
      </div>
      <p className="absolute bottom-5 left-1/2 w-[min(90vw,40rem)] -translate-x-1/2 text-center text-sm text-cream/75">
        <span className="tabular-nums">
          {index + 1} / {total}
        </span>
        {" — "}
        {item.alt}
        {item.placeholder ? " (imagem provisória)" : ""}
        {item.credit && !fallbacks.includes(item.src) && (
          <>
            {" — "}
            <a href={item.page} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline" onClick={(e) => e.stopPropagation()}>
              Foto: {item.credit}
            </a>
          </>
        )}
      </p>
      <button ref={closeRef} type="button" onClick={() => onChange(null)} className="absolute right-4 top-4 grid size-12 place-items-center rounded-full bg-cream/10 hover:bg-cream/20" aria-label="Fechar">
        <X aria-hidden="true" className="size-6" />
      </button>
      <button type="button" onClick={(e) => { e.stopPropagation(); step(-1); }} className="absolute left-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-cream/10 hover:bg-cream/20 md:left-6" aria-label="Imagem anterior">
        <ChevronLeft aria-hidden="true" className="size-6" />
      </button>
      <button type="button" onClick={(e) => { e.stopPropagation(); step(1); }} className="absolute right-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-cream/10 hover:bg-cream/20 md:right-6" aria-label="Próxima imagem">
        <ChevronRight aria-hidden="true" className="size-6" />
      </button>
    </div>
  );
}
