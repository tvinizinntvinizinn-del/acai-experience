"use client";

import { useEffect, useRef } from "react";
import { basePreviewImage, COMPLEMENTS, SIZE_PREVIEW_SCALE, TOPPINGS, type BaseId } from "@/data/builder";
import type { SizeId } from "@/data/menu";
import { EASE, gsap } from "@/lib/gsap";
import { prefersReducedMotion, useIsoLayoutEffect } from "@/lib/hooks";

/**
 * Prévia 2D do copo montado: render do copo (por base) + recortes dos
 * complementos posicionados no topo + caldas desenhadas em SVG.
 * É uma ilustração — não uma simulação 3D.
 *
 * Coordenadas em % da imagem 4:5. O topo do copo é uma elipse com centro em
 * (50%, 25%), raio horizontal ~37% e vertical ~7% (medido no render).
 */
type Slot = { x: number; y: number; w: number; rot: number };

const SLOTS: Record<string, Slot[]> = {
  granola: [
    { x: 50, y: 31, w: 32, rot: 0 },
    { x: 38, y: 29, w: 9, rot: 40 },
  ],
  banana: [
    { x: 69, y: 27, w: 19, rot: 12 },
    { x: 58, y: 23, w: 16, rot: -18 },
  ],
  morango: [
    { x: 31, y: 27, w: 23, rot: -10 },
    { x: 44, y: 22, w: 20, rot: 14 },
  ],
  kiwi: [
    { x: 76, y: 30, w: 18, rot: 20 },
    { x: 61, y: 31, w: 16, rot: -6 },
  ],
  manga: [
    { x: 24, y: 30, w: 14, rot: 8 },
    { x: 53, y: 25, w: 13, rot: -20 },
  ],
  "leite-em-po": [{ x: 50, y: 25, w: 34, rot: 0 }],
  pacoca: [
    { x: 64, y: 30, w: 17, rot: 0 },
    { x: 36, y: 31, w: 15, rot: 30 },
  ],
};

const DRIZZLES = [
  "M24 37 C 33 31, 40 43, 48 36 S 62 31, 70 38 S 79 41, 76 36 M30 32 C 40 27, 52 38, 60 31 S 72 29, 74 33",
  "M27 34 C 36 39, 44 29, 52 35 S 66 40, 73 33 M70 38 C 72 44, 71 50, 72 56",
];

export function BuilderPreview({ size, base, complements, toppings }: { size: SizeId; base: BaseId; complements: string[]; toppings: string[] }) {
  const cupRef = useRef<HTMLDivElement>(null);

  // Troca de tamanho: o copo "respira" até a nova escala.
  useIsoLayoutEffect(() => {
    const el = cupRef.current;
    if (!el) return;
    const scale = SIZE_PREVIEW_SCALE[size];
    if (prefersReducedMotion()) gsap.set(el, { scale });
    else gsap.to(el, { scale, duration: 0.7, ease: "back.out(1.4)" });
  }, [size]);

  const items = complements.flatMap((id) => {
    const option = COMPLEMENTS.find((c) => c.id === id);
    return option ? (SLOTS[id] ?? []).map((slot, i) => ({ key: `${id}-${i}`, src: option.sprite, slot })) : [];
  });
  items.sort((a, b) => a.slot.y - b.slot.y);

  const sauces = toppings.map((id, i) => ({ id, option: TOPPINGS.find((t) => t.id === id), d: DRIZZLES[i % DRIZZLES.length] }));

  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[30rem]">
      <div aria-hidden="true" className="absolute inset-x-[18%] bottom-[2%] h-[5%] rounded-[50%] bg-black/45 blur-xl" />
      <div ref={cupRef} className="absolute inset-0 origin-[50%_96%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={basePreviewImage(base)} alt="" width={700} height={875} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full" />
        {items.map((item) => (
          <DropIn key={item.key} slot={item.slot} src={item.src} />
        ))}
        <svg viewBox="0 0 100 125" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
          {sauces.map(
            (s) =>
              s.option && (
                <Sauce key={s.id} d={s.d} color={s.option.color} shine={s.option.shine} />
              ),
          )}
        </svg>
      </div>
    </div>
  );
}

function DropIn({ slot, src }: { slot: Slot; src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useIsoLayoutEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;
    const tween = gsap.from(ref.current, { y: -90, autoAlpha: 0, rotation: -40, duration: 0.75, ease: EASE.settle });
    return () => {
      tween.kill();
    };
  }, []);
  return (
    <div
      ref={ref}
      className="absolute"
      style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.w}%`, translate: "-50% -82%" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" width={512} height={512} loading="lazy" decoding="async" style={{ rotate: `${slot.rot}deg` }} className="h-auto w-full drop-shadow-[0_6px_8px_rgba(10,0,20,0.4)]" />
    </div>
  );
}

function Sauce({ d, color, shine }: { d: string; color: string; shine: string }) {
  const ref = useRef<SVGGElement>(null);
  useEffect(() => {
    const paths = ref.current?.querySelectorAll("path");
    if (!paths || prefersReducedMotion()) return;
    const tween = gsap.fromTo(paths, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut" });
    return () => {
      tween.kill();
    };
  }, [d]);
  return (
    <g ref={ref}>
      <path d={d} fill="none" stroke="rgba(20,4,28,0.35)" strokeWidth={2.4} strokeLinecap="round" transform="translate(0.4 0.8)" pathLength={1} strokeDasharray="1 1" />
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" />
      <path d={d} fill="none" stroke={shine} strokeOpacity={0.75} strokeWidth={0.55} strokeLinecap="round" transform="translate(-0.3 -0.4)" pathLength={1} strokeDasharray="1 1" />
    </g>
  );
}
