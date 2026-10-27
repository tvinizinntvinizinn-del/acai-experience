"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Bike, Copy, MessageCircle, ShoppingBag, Store, Trash, X } from "lucide-react";
import { isWhatsAppConfigured, site } from "@/config/site";
import { useCart } from "@/context/cart-context";
import { useSmoothScroll } from "@/context/smooth-scroll";
import { formatPrice } from "@/lib/format";
import { buildOrderMessage, whatsappUrl } from "@/lib/whatsapp";
import { QtyStepper } from "@/components/sections/AcaiBuilder";

const MODES = [
  site.ordering.pickup && { id: "pickup" as const, label: "Retirar no balcão", Icon: Store },
  site.ordering.delivery && { id: "delivery" as const, label: "Entrega", Icon: Bike },
].filter(Boolean) as { id: "pickup" | "delivery"; label: string; Icon: typeof Store }[];

export function CartDrawer() {
  const { items, customer, open, count, subtotal, setOpen, setQty, remove, setNote, setCustomer, clear } = useCart();
  const { lock, unlock, scrollTo } = useSmoothScroll();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [tried, setTried] = useState(false);
  const [status, setStatus] = useState<string>("");
  const titleId = useId();

  const modes = MODES;

  // Garante um modo válido conforme a configuração.
  useEffect(() => {
    if (modes.length && !modes.some((m) => m.id === customer.mode)) setCustomer({ mode: modes[0].id });
  }, [customer.mode, modes, setCustomer]);

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    lock();
    const t = window.setTimeout(() => closeRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      unlock();
      returnFocus.current?.focus?.();
    };
  }, [open, lock, unlock, setOpen]);

  useEffect(() => {
    if (!open) {
      setStatus("");
      setTried(false);
    }
  }, [open]);

  const errors = {
    empty: items.length === 0,
    name: customer.name.trim().length < 2,
    address: customer.mode === "delivery" && customer.address.trim().length < 6,
  };
  const valid = !errors.empty && !errors.name && !errors.address;

  const finalize = () => {
    setTried(true);
    if (!valid || !isWhatsAppConfigured) return;
    const message = buildOrderMessage(items, customer, subtotal);
    window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
    setStatus("Abrimos o WhatsApp com a mensagem do pedido. Envie a mensagem por lá para concluir — o pedido só é confirmado pela loja.");
  };

  const copyMessage = async () => {
    setTried(true);
    if (!valid) return;
    try {
      await navigator.clipboard.writeText(buildOrderMessage(items, customer, subtotal));
      setStatus("Mensagem do pedido copiada.");
    } catch {
      setStatus("Não foi possível copiar automaticamente neste navegador.");
    }
  };

  const goShop = (target: string) => {
    setOpen(false);
    window.setTimeout(() => scrollTo(target), 50);
  };

  return (
    <div className={`fixed inset-0 z-[90] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        onClick={() => setOpen(false)}
        className={`absolute inset-0 bg-night/55 backdrop-blur-[3px] transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        inert={!open}
        className={`absolute inset-y-0 right-0 flex w-full max-w-[28rem] flex-col bg-cream text-graphite shadow-[0_0_80px_rgba(17,16,22,0.35)] transition-[translate,visibility] duration-500 ease-out-expo ${open ? "visible translate-x-0" : "invisible translate-x-full"}`}
      >
        <header className="flex items-center justify-between border-b border-graphite/10 px-6 py-5">
          <h2 id={titleId} className="type-display text-card">
            Seu pedido{count > 0 && <span className="ml-2 align-middle font-sans text-base font-normal text-graphite/55">({count})</span>}
          </h2>
          <button ref={closeRef} type="button" onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-full hover:bg-graphite/5" aria-label="Fechar carrinho">
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>

        <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag aria-hidden="true" className="size-10 text-graphite/30" />
              <p className="mt-4 text-lg font-semibold">Seu carrinho está vazio.</p>
              <p className="mt-1 text-graphite/60">Escolha um favorito ou monte o seu.</p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={() => goShop("#cardapio")} className="btn btn-outline-dark">
                  Ver cardápio
                </button>
                <button type="button" onClick={() => goShop("#monte-seu-acai")} className="btn btn-primary">
                  Montar meu açaí
                </button>
              </div>
            </div>
          ) : (
            <>
              <ul className="space-y-5">
                {items.map((item) => (
                  <li key={item.key} className="flex gap-4">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-[#F3E2C6]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt=""
                        width={80}
                        height={80}
                        className={item.image.startsWith("http") ? "absolute inset-0 h-full w-full object-cover" : "absolute inset-x-0 top-1 mx-auto h-[92%] w-auto"}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold leading-snug">{item.name}</p>
                        <p className="shrink-0 tabular-nums">{formatPrice(item.unitPrice * item.qty)}</p>
                      </div>
                      <p className="mt-0.5 text-sm text-graphite/60">
                        {item.sizeLabel}
                        {item.baseName ? `, ${item.baseName}` : ""}
                      </p>
                      {item.complements.length > 0 && <p className="mt-0.5 text-sm text-graphite/60">Complementos: {item.complements.join(", ")}</p>}
                      {item.toppings.length > 0 && <p className="mt-0.5 text-sm text-graphite/60">Coberturas: {item.toppings.join(", ")}</p>}
                      <input
                        type="text"
                        value={item.note}
                        onChange={(e) => setNote(item.key, e.target.value)}
                        maxLength={140}
                        placeholder="Observação para este item"
                        aria-label={`Observação para ${item.name}`}
                        className="field-light mt-2 py-2 text-sm"
                      />
                      <div className="mt-2.5 flex items-center justify-between">
                        <QtyStepper value={item.qty} onChange={(n) => setQty(item.key, n)} light label={`Quantidade de ${item.name}`} />
                        <button type="button" onClick={() => remove(item.key)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-graphite/60 hover:bg-graphite/5 hover:text-graphite">
                          <Trash aria-hidden="true" className="size-4" /> Remover
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-8 space-y-4 border-t border-graphite/10 pt-6">
                <label className="block">
                  <span className="text-sm font-medium">Seu nome</span>
                  <input
                    type="text"
                    autoComplete="name"
                    value={customer.name}
                    onChange={(e) => setCustomer({ name: e.target.value })}
                    aria-invalid={tried && errors.name}
                    className="field-light mt-1.5"
                  />
                  {tried && errors.name && <span className="mt-1 block text-sm text-[#B4235F]">Informe seu nome.</span>}
                </label>

                {modes.length > 0 && (
                  <fieldset>
                    <legend className="text-sm font-medium">Como prefere receber?</legend>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      {modes.map(({ id, label, Icon }) => (
                        <label key={id} className={`size-pill justify-center py-3 ${customer.mode === id ? "is-selected" : ""}`}>
                          <input type="radio" name="cart-mode" value={id} checked={customer.mode === id} onChange={() => setCustomer({ mode: id })} className="sr-only" />
                          <Icon aria-hidden="true" className="size-4" /> {label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}

                {customer.mode === "delivery" && (
                  <label className="block">
                    <span className="text-sm font-medium">Endereço de entrega</span>
                    <textarea
                      rows={2}
                      autoComplete="street-address"
                      value={customer.address}
                      onChange={(e) => setCustomer({ address: e.target.value })}
                      aria-invalid={tried && errors.address}
                      placeholder="Rua, número, bairro e complemento"
                      className="field-light mt-1.5 resize-none"
                    />
                    {tried && errors.address && <span className="mt-1 block text-sm text-[#B4235F]">Informe o endereço completo.</span>}
                    <span className="mt-1 block text-sm text-graphite/55">{site.ordering.deliveryNote}</span>
                  </label>
                )}

                <label className="block">
                  <span className="text-sm font-medium">Observações do pedido (opcional)</span>
                  <textarea rows={2} value={customer.note} onChange={(e) => setCustomer({ note: e.target.value })} className="field-light mt-1.5 resize-none" />
                </label>
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-graphite/10 px-6 pb-6 pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-graphite/70">Subtotal</span>
              <span className="text-xl font-semibold tabular-nums">{formatPrice(subtotal)}</span>
            </div>
            {site.demoPrices && <p className="mt-1 text-xs text-graphite/50">Valores de demonstração.</p>}
            <button type="button" onClick={finalize} disabled={!isWhatsAppConfigured} className="btn btn-primary mt-4 w-full">
              <MessageCircle aria-hidden="true" className="size-4" /> Finalizar pelo WhatsApp
            </button>
            {!isWhatsAppConfigured && (
              <p className="mt-2 text-sm text-graphite/60">
                Pedidos pelo WhatsApp em breve.
                {process.env.NODE_ENV === "development" && " (Configure o número em src/config/site.ts.)"}
              </p>
            )}
            <div className="mt-2 flex items-center justify-between">
              <button type="button" onClick={copyMessage} className="inline-flex items-center gap-1.5 py-2 text-sm text-graphite/60 underline-offset-4 hover:text-graphite hover:underline">
                <Copy aria-hidden="true" className="size-3.5" /> Copiar mensagem
              </button>
              <button type="button" onClick={clear} className="py-2 text-sm text-graphite/60 underline-offset-4 hover:text-graphite hover:underline">
                Esvaziar carrinho
              </button>
            </div>
            <p role="status" className="mt-1 text-sm text-graphite/75">
              {status}
            </p>
          </footer>
        )}
      </div>
    </div>
  );
}
