"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Minus, Plus, RotateCcw, ShoppingBag } from "lucide-react";
import { copy } from "@/config/copy";
import { site } from "@/config/site";
import { useCart } from "@/context/cart-context";
import { BASES, COMPLEMENTS, LIMITS, SIZE_BASE_PRICE, TOPPINGS, type BaseId } from "@/data/builder";
import { SIZES, sizeLabel, type SizeId } from "@/data/menu";
import { formatDelta, formatPrice } from "@/lib/format";
import { EASE, gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/hooks";
import { customizeRequest } from "@/lib/ui-bus";
import { BuilderPreview } from "./BuilderPreview";

const STEPS = ["Tamanho", "Base", "Complementos", "Coberturas", "Revisão"] as const;

export function AcaiBuilder() {
  const { add, setOpen } = useCart();
  const [step, setStep] = useState(0);
  const [size, setSize] = useState<SizeId>("500");
  const [base, setBase] = useState<BaseId>("acai");
  const [complements, setComplements] = useState<string[]>([]);
  const [toppings, setToppings] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [presetName, setPresetName] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // "Personalizar" no cardápio carrega a combinação como ponto de partida.
  useEffect(
    () =>
      customizeRequest.subscribe((req) => {
        if (!req) return;
        setSize(req.size);
        setBase(req.preset.base);
        setComplements(req.preset.complements.slice(0, LIMITS.complements));
        setToppings(req.preset.toppings.slice(0, LIMITS.toppings));
        setPresetName(req.productName);
        setAdded(false);
        setStep(2);
      }),
    [],
  );

  // Transição entre etapas.
  useEffect(() => {
    const el = panelRef.current;
    if (!el || prefersReducedMotion()) return;
    const tween = gsap.fromTo(el, { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: EASE.out });
    return () => {
      tween.kill();
    };
  }, [step]);

  const baseOption = BASES.find((b) => b.id === base) ?? BASES[0];
  const unitPrice = useMemo(() => {
    const c = complements.reduce((sum, id) => sum + (COMPLEMENTS.find((o) => o.id === id)?.price ?? 0), 0);
    const t = toppings.reduce((sum, id) => sum + (TOPPINGS.find((o) => o.id === id)?.price ?? 0), 0);
    return SIZE_BASE_PRICE[size] + baseOption.price + c + t;
  }, [size, baseOption, complements, toppings]);

  const toggle = (list: string[], id: string, max: number) => (list.includes(id) ? list.filter((x) => x !== id) : list.length >= max ? list : [...list, id]);

  const reset = () => {
    setSize("500");
    setBase("acai");
    setComplements([]);
    setToppings([]);
    setQty(1);
    setNote("");
    setPresetName(null);
    setAdded(false);
    setStep(0);
  };

  const addToCart = () => {
    add({
      productId: null,
      name: presetName ? `${presetName} (personalizado)` : "Açaí do seu jeito",
      sizeId: size,
      sizeLabel: sizeLabel(size),
      baseName: baseOption.name,
      complements: complements.map((id) => COMPLEMENTS.find((c) => c.id === id)?.name ?? id),
      toppings: toppings.map((id) => TOPPINGS.find((t) => t.id === id)?.name ?? id),
      unitPrice,
      qty,
      note: note.trim(),
      image: baseOption.image,
    });
    setAdded(true);
  };

  const goTo = (i: number) => {
    setAdded(false);
    setStep(Math.max(0, Math.min(STEPS.length - 1, i)));
  };

  return (
    <section id="monte-seu-acai" data-header="dark" aria-labelledby={titleId} className="relative bg-night py-24 text-cream md:py-32">
      <div className="px-6 md:px-[5vw]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 id={titleId} className="type-display text-title">
            {copy.builder.title.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </h2>
          <div className="max-w-[24rem] text-cream/75">
            <p className="text-base md:text-lg">{copy.builder.lead}</p>
            {site.demoPrices && <p className="mt-2 text-sm text-cream/50">Preços de demonstração.</p>}
          </div>
        </div>

        <div className="mt-12 grid gap-10 md:mt-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
          {/* Prévia */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative rounded-[2.5rem] bg-[radial-gradient(70%_60%_at_50%_45%,rgba(129,55,200,0.45),rgba(75,23,104,0.15)_60%,transparent)] px-6 pb-4 pt-8">
              <BuilderPreview size={size} base={base} complements={complements} toppings={toppings} />
              <p className="mt-2 text-center text-xs text-cream/45">Prévia ilustrativa da sua combinação.</p>
            </div>
          </div>

          {/* Etapas */}
          <div>
            {presetName && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cream/15 px-4 py-3 text-sm">
                <span>
                  Partindo do <strong className="font-semibold">{presetName}</strong>
                </span>
                <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-cream/70 underline-offset-4 hover:text-cream hover:underline">
                  <RotateCcw aria-hidden="true" className="size-3.5" /> Começar do zero
                </button>
              </div>
            )}

            <ol className="grid grid-cols-5 gap-1.5" aria-label="Etapas">
              {STEPS.map((label, i) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-current={step === i ? "step" : undefined}
                    className={`group flex w-full flex-col gap-2 text-left text-[0.8rem] transition-colors sm:text-sm ${step === i ? "text-cream" : "text-cream/50 hover:text-cream/80"}`}
                  >
                    <span className={`block h-[3px] w-full rounded-full transition-colors duration-300 ${i <= step ? "bg-berry" : "bg-cream/15"}`} />
                    <span className="flex items-baseline gap-1.5">
                      <span className="tabular-nums">{i + 1}</span>
                      <span className="hidden sm:inline">{label}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            <div ref={panelRef} className="mt-8 min-h-[22rem]">
              <h3 className="type-display text-card mb-6">{["Escolha o tamanho", "Escolha a base", "Escolha os complementos", "Escolha as coberturas", "Revise o pedido"][step]}</h3>

              {step === 0 && (
                <fieldset>
                  <legend className="sr-only">Tamanho</legend>
                  <div className="grid grid-cols-3 gap-3">
                    {SIZES.map((s) => (
                      <label key={s.id} className={`option-card flex-col items-center py-6 text-center ${size === s.id ? "is-selected" : ""}`}>
                        <input type="radio" name="builder-size" value={s.id} checked={size === s.id} onChange={() => setSize(s.id)} className="sr-only" />
                        <CupGlyph scale={s.id === "300" ? 0.72 : s.id === "500" ? 0.86 : 1} />
                        <span className="mt-3 text-lg font-semibold">{s.label}</span>
                        <span className="text-sm text-cream/60">{formatPrice(SIZE_BASE_PRICE[s.id])}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              {step === 1 && (
                <fieldset>
                  <legend className="sr-only">Base</legend>
                  <div className="grid gap-2.5">
                    {BASES.map((b) => (
                      <label key={b.id} className={`option-card justify-between ${base === b.id ? "is-selected" : ""}`}>
                        <input type="radio" name="builder-base" value={b.id} checked={base === b.id} onChange={() => setBase(b.id)} className="sr-only" />
                        <span>
                          <span className="block font-semibold">{b.name}</span>
                          <span className="block text-sm text-cream/60">{b.description}</span>
                        </span>
                        <span className="shrink-0 text-sm text-cream/70">{formatDelta(b.price) || "Incluso"}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              {step === 2 && (
                <fieldset>
                  <legend className="mb-4 text-sm text-cream/60">
                    Até {LIMITS.complements} complementos — {complements.length} escolhido{complements.length === 1 ? "" : "s"}.
                  </legend>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {COMPLEMENTS.map((c) => {
                      const checked = complements.includes(c.id);
                      const disabled = !checked && complements.length >= LIMITS.complements;
                      return (
                        <label key={c.id} className={`option-card flex-col items-start gap-2 ${checked ? "is-selected" : ""} ${disabled ? "is-disabled" : ""}`}>
                          <input type="checkbox" checked={checked} disabled={disabled} onChange={() => setComplements((l) => toggle(l, c.id, LIMITS.complements))} className="sr-only" />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={c.sprite} alt="" width={512} height={512} loading="lazy" className="size-14" />
                          <span className="font-semibold">{c.name}</span>
                          <span className="text-sm text-cream/60">{formatDelta(c.price)}</span>
                          {checked && <Check aria-hidden="true" className="absolute right-3 top-3 size-4 text-berry" />}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {step === 3 && (
                <fieldset>
                  <legend className="mb-4 text-sm text-cream/60">Até {LIMITS.toppings} coberturas.</legend>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {TOPPINGS.map((t) => {
                      const checked = toppings.includes(t.id);
                      const disabled = !checked && toppings.length >= LIMITS.toppings;
                      return (
                        <label key={t.id} className={`option-card justify-between ${checked ? "is-selected" : ""} ${disabled ? "is-disabled" : ""}`}>
                          <input type="checkbox" checked={checked} disabled={disabled} onChange={() => setToppings((l) => toggle(l, t.id, LIMITS.toppings))} className="sr-only" />
                          <span className="flex items-center gap-3">
                            <span aria-hidden="true" className="size-5 rounded-full ring-1 ring-cream/30" style={{ background: `radial-gradient(circle at 35% 30%, ${t.shine}, ${t.color} 60%)` }} />
                            <span className="font-semibold">{t.name}</span>
                          </span>
                          <span className="text-sm text-cream/70">{formatDelta(t.price)}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {step === 4 && (
                <div>
                  <dl className="divide-y divide-cream/10 rounded-2xl border border-cream/15">
                    <SummaryRow label="Tamanho" value={sizeLabel(size)} onEdit={() => goTo(0)} />
                    <SummaryRow label="Base" value={baseOption.name} onEdit={() => goTo(1)} />
                    <SummaryRow label="Complementos" value={complements.length ? complements.map((id) => COMPLEMENTS.find((c) => c.id === id)?.name).join(", ") : "Nenhum"} onEdit={() => goTo(2)} />
                    <SummaryRow label="Coberturas" value={toppings.length ? toppings.map((id) => TOPPINGS.find((t) => t.id === id)?.name).join(", ") : "Nenhuma"} onEdit={() => goTo(3)} />
                  </dl>
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <span className="text-sm text-cream/70">Quantidade</span>
                    <QtyStepper value={qty} onChange={setQty} />
                  </div>
                  <label className="mt-6 block">
                    <span className="text-sm text-cream/70">Observações (opcional)</span>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={200}
                      rows={2}
                      placeholder="Ex.: granola separada, pouco leite condensado…"
                      className="field mt-2 resize-none"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Barra de ação */}
            <div className="sticky bottom-3 z-10 mt-8 flex items-center gap-3 rounded-full border border-cream/15 bg-night/85 p-2 pl-5 backdrop-blur-md lg:static lg:bg-transparent lg:backdrop-blur-none">
              <div className="mr-auto leading-tight">
                <span className="block text-xs text-cream/55">Total</span>
                <span className="text-lg font-semibold tabular-nums" aria-live="polite">
                  {formatPrice(unitPrice * qty)}
                </span>
              </div>
              {step > 0 && (
                <button type="button" onClick={() => goTo(step - 1)} className="btn btn-outline-light px-4" aria-label="Etapa anterior">
                  <ArrowLeft aria-hidden="true" className="size-4" />
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={() => goTo(step + 1)} className="btn btn-primary">
                  Continuar <ArrowRight aria-hidden="true" className="size-4" />
                </button>
              ) : added ? (
                <button type="button" onClick={() => setOpen(true)} className="btn btn-light">
                  <ShoppingBag aria-hidden="true" className="size-4" /> Ver carrinho
                </button>
              ) : (
                <button type="button" onClick={addToCart} className="btn btn-primary">
                  <Plus aria-hidden="true" className="size-4" /> Adicionar ao carrinho
                </button>
              )}
            </div>
            <p className="mt-3 min-h-5 text-sm text-cream/70" role="status">
              {added ? "Adicionado ao carrinho. Você pode montar outro ou finalizar o pedido." : ""}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3.5">
      <div>
        <dt className="text-sm text-cream/55">{label}</dt>
        <dd className="mt-0.5">{value}</dd>
      </div>
      <button type="button" onClick={onEdit} className="shrink-0 text-sm text-cream/70 underline-offset-4 hover:text-cream hover:underline">
        Alterar
      </button>
    </div>
  );
}

export function QtyStepper({ value, onChange, light = false, label = "Quantidade" }: { value: number; onChange: (n: number) => void; light?: boolean; label?: string }) {
  const ring = light ? "border-graphite/20" : "border-cream/20";
  return (
    <div className={`inline-flex items-center rounded-full border ${ring}`} role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1} className="grid size-10 place-items-center rounded-full disabled:opacity-35" aria-label="Diminuir">
        <Minus aria-hidden="true" className="size-4" />
      </button>
      <span className="w-8 text-center tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" onClick={() => onChange(Math.min(99, value + 1))} className="grid size-10 place-items-center rounded-full" aria-label="Aumentar">
        <Plus aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}

function CupGlyph({ scale }: { scale: number }) {
  return (
    <svg viewBox="0 0 40 48" aria-hidden="true" className="h-12 w-10" style={{ transform: `scale(${scale})`, transformOrigin: "50% 100%" }}>
      <path d="M6 10 h28 l-3.4 34 a2 2 0 0 1 -2 1.8 H11.4 a2 2 0 0 1 -2 -1.8 Z" fill="currentColor" opacity="0.18" />
      <path d="M8.2 18 h23.6 l-2.3 25.4 H10.5 Z" fill="#8137C8" />
      <ellipse cx="20" cy="10" rx="15" ry="4" fill="#4B1768" />
      <circle cx="15" cy="7.5" r="3" fill="#F454A2" />
      <circle cx="23" cy="7" r="2.6" fill="#F2DEB2" />
    </svg>
  );
}
