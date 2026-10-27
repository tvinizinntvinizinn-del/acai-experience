"use client";

import { useRef, useState } from "react";
import { copy } from "@/config/copy";
import { EXPERIENCE_MEDIA, type MediaItem } from "@/data/media";
import { EASE, gsap } from "@/lib/gsap";
import { useIsoLayoutEffect } from "@/lib/hooks";
import { PlaceholderBadge } from "@/components/ui/PlaceholderBadge";
import { Photo } from "@/components/ui/Photo";

/** Grade editorial com parallax: cada imagem tem um "peso" diferente. */
const LAYOUT = [
  { cls: "md:col-span-7", speed: 10 },
  { cls: "md:col-span-5 md:mt-40", speed: -14 },
  { cls: "md:col-span-4 md:-mt-16", speed: 16 },
  { cls: "md:col-span-8 md:mt-24", speed: -8 },
  { cls: "md:col-span-10 md:col-start-2 md:mt-10", speed: 6 },
];

export function ExperienceSection() {
  const rootRef = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-exp-title] [data-line]", {
          yPercent: 130,
          duration: 1.2,
          ease: EASE.out,
          stagger: 0.12,
          scrollTrigger: { trigger: root, start: "top 70%", once: true },
        });
        gsap.utils.toArray<HTMLElement>("[data-media]").forEach((el) => {
          const frame = el.querySelector("[data-frame]");
          const img = el.querySelector("[data-parallax]");
          const speed = Number(el.dataset.speed ?? 0);
          gsap.fromTo(frame, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: el, start: "top 85%", once: true } });
          gsap.fromTo(img, { yPercent: -speed / 2, scale: 1.14 }, { yPercent: speed / 2, scale: 1.14, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="experiencia" ref={rootRef} data-header="dark" aria-labelledby="experiencia-titulo" className="relative overflow-hidden bg-graphite py-24 text-cream md:py-36">
      <div className="px-6 md:px-[5vw]">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <h2 id="experiencia-titulo" data-exp-title className="type-display whitespace-nowrap text-[clamp(2.6rem,8vw,9.5rem)] md:col-span-8">
            {copy.experienceSection.title.map((line) => (
              <span key={line} className="line-mask">
                <span data-line className="block">
                  {line}
                </span>
              </span>
            ))}
          </h2>
          <p className="max-w-[24rem] text-base text-cream/70 md:col-span-4 md:justify-self-end md:text-lg">{copy.experienceSection.lead}</p>
        </div>

        <div className="mt-16 grid gap-6 md:mt-24 md:grid-cols-12 md:gap-8">
          {EXPERIENCE_MEDIA.map((m, i) => (
            <Media key={m.src} item={m} className={LAYOUT[i % LAYOUT.length].cls} speed={LAYOUT[i % LAYOUT.length].speed} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Media({ item, className, speed }: { item: MediaItem; className: string; speed: number }) {
  const [usingFallback, setUsingFallback] = useState(false);
  return (
    <figure data-media data-speed={speed} className={className}>
      <div data-frame className="relative overflow-hidden rounded-[1.75rem]" style={{ aspectRatio: `${item.width} / ${item.height}` }}>
        <span data-parallax className="absolute inset-0 block">
          <Photo src={item.src} fallbackSrc={item.fallback} onFallback={() => setUsingFallback(true)} alt={item.alt} fill sizes="(min-width: 768px) 60vw, 100vw" className="object-cover" />
        </span>
        {item.placeholder && <PlaceholderBadge className="left-4 top-4" />}
      </div>
      {(item.caption || item.credit) && (
        <figcaption className="mt-3 flex items-baseline justify-between gap-4 text-sm text-cream/55">
          <span>{item.caption}</span>
          {item.credit && !usingFallback && (
            <a href={item.page} target="_blank" rel="noopener noreferrer" className="text-xs text-cream/35 hover:text-cream/70">
              Foto: {item.credit}
            </a>
          )}
        </figcaption>
      )}
    </figure>
  );
}
