"use client";

import { useEffect, useId, useState } from "react";
import { Check, Plus, SlidersHorizontal } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useSmoothScroll } from "@/context/smooth-scroll";
import { SIZES, sizeLabel, type MenuProduct, type SizeId } from "@/data/menu";
import { formatPrice } from "@/lib/format";
import { customizeRequest } from "@/lib/ui-bus";
import { PlaceholderBadge } from "@/components/ui/PlaceholderBadge";
import { Photo } from "@/components/ui/Photo";

export function ProductCard({ product }: { product: MenuProduct }) {
  const { add } = useCart();
  const { scrollTo } = useSmoothScroll();
  const available = SIZES.filter((s) => s.id in product.prices);
  const [size, setSize] = useState<SizeId>(available.find((s) => s.id === "500")?.id ?? available[0]?.id ?? "500");
  const [added, setAdded] = useState(false);
  const groupId = useId();
  const price = product.prices[size] ?? null;

  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 1800);
    return () => window.clearTimeout(t);
  }, [added]);

  const onAdd = () => {
    if (price === null) return;
    add({
      productId: product.id,
      name: product.name,
      sizeId: size,
      sizeLabel: sizeLabel(size),
      baseName: null,
      complements: [],
      toppings: [],
      unitPrice: price,
      note: "",
      image: product.image.src,
    });
    setAdded(true);
  };

  const onCustomize = () => {
    customizeRequest.set({ preset: product.preset, size, productName: product.name, stamp: Date.now() });
    scrollTo("#monte-seu-acai");
  };

  return (
    <article data-card className={`group flex w-[78vw] max-w-[22rem] shrink-0 snap-start flex-col sm:w-[46vw] md:w-auto md:max-w-none ${product.featured ? "md:col-span-2" : ""}`}>
      <div
        className={`relative overflow-hidden rounded-t-full rounded-b-[2rem] ${product.featured ? "aspect-[4/5] md:aspect-[8/5]" : "aspect-[4/5]"}`}
        style={{ background: product.tint }}
      >
        <Photo
          src={product.image.src}
          fallbackSrc={product.image.fallback}
          alt={product.image.alt}
          fill
          sizes={product.featured ? "(min-width: 768px) 50vw, 78vw" : "(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 78vw"}
          fallbackTone={product.tint}
          className="object-cover transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.05]"
        />
        {product.image.placeholder && <PlaceholderBadge className="bottom-4 left-1/2 -translate-x-1/2" />}
      </div>

      <div className="mt-5 flex items-start justify-between gap-4">
        <h3 className="type-display text-card">{product.name}</h3>
        <p className="mt-1 shrink-0 text-lg font-semibold tabular-nums">{price === null ? "Sob consulta" : formatPrice(price)}</p>
      </div>
      <p className="mt-2 text-[0.98rem] leading-relaxed text-graphite/70">{product.description}</p>

      <fieldset className="mt-4">
        <legend className="sr-only">Tamanho do {product.name}</legend>
        <div className="flex flex-wrap gap-2">
          {available.map((s) => (
            <label key={s.id} className={`size-pill ${size === s.id ? "is-selected" : ""}`}>
              <input type="radio" name={groupId} value={s.id} checked={size === s.id} onChange={() => setSize(s.id)} className="sr-only" />
              {s.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 flex gap-2 md:mt-auto md:pt-5">
        <button type="button" onClick={onCustomize} className="btn btn-outline-dark flex-1 px-4">
          <SlidersHorizontal aria-hidden="true" className="size-4" /> Personalizar
        </button>
        <button type="button" onClick={onAdd} disabled={price === null} className="btn btn-primary flex-1 px-4" aria-live="polite">
          {added ? (
            <>
              <Check aria-hidden="true" className="size-4" /> Adicionado
            </>
          ) : (
            <>
              <Plus aria-hidden="true" className="size-4" /> Adicionar
            </>
          )}
        </button>
      </div>
    </article>
  );
}
