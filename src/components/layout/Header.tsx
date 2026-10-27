"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { NAV } from "@/config/nav";
import { site } from "@/config/site";
import { Logo } from "@/components/ui/Logo";
import { useCart } from "@/context/cart-context";
import { useSmoothScroll } from "@/context/smooth-scroll";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { headerTheme, menuOpen as menuChannel } from "@/lib/ui-bus";

export function Header() {
  const { count, setOpen } = useCart();
  const { scrollTo, lock, unlock } = useSmoothScroll();
  const headerRef = useRef<HTMLElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const prevCount = useRef(count);
  const [menuOpen, setMenuOpen] = useState(false);

  // Tema claro/escuro conforme a seção sob o header (sem re-render).
  useEffect(() => headerTheme.subscribe((theme) => headerRef.current?.setAttribute("data-theme", theme)), []);

  // Gatilhos criados depois dos "pins" das seções, para medir com o espaçamento correto.
  useEffect(() => {
    let triggers: ScrollTrigger[] = [];
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        document.querySelectorAll<HTMLElement>('[data-header="light"], [data-header="dark"]').forEach((section) => {
          triggers.push(
            ScrollTrigger.create({
              trigger: section,
              start: "top 36px",
              end: "bottom 36px",
              onToggle: (self) => {
                if (self.isActive) headerTheme.set(section.dataset.header as "light" | "dark");
              },
            }),
          );
        });
        const first = document.querySelector<HTMLElement>("#ingredientes");
        if (first) {
          triggers.push(
            ScrollTrigger.create({
              trigger: first,
              start: "top 36px",
              end: "max",
              onToggle: (self) => headerRef.current?.toggleAttribute("data-solid", self.isActive),
            }),
          );
        }
        ScrollTrigger.refresh();
      }),
    );
    return () => {
      cancelAnimationFrame(raf);
      triggers.forEach((t) => t.kill());
      triggers = [];
    };
  }, []);

  // Pulso no contador quando um item entra no carrinho.
  useEffect(() => {
    if (count > prevCount.current && badgeRef.current) {
      gsap.fromTo(badgeRef.current, { scale: 1.6 }, { scale: 1, duration: 0.5, ease: "back.out(2)" });
    }
    prevCount.current = count;
  }, [count]);

  useEffect(() => {
    menuChannel.set(menuOpen);
    if (!menuOpen) return;
    lock();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      unlock();
    };
  }, [menuOpen, lock, unlock]);

  const go = (target: string | number) => {
    setMenuOpen(false);
    window.setTimeout(() => scrollTo(target), menuOpen ? 120 : 0);
  };

  return (
    <>
      <a href="#conteudo" className="sr-only z-[120] rounded-full bg-berry px-4 py-2 text-night focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Pular para o conteúdo
      </a>
      <header ref={headerRef} data-theme="light" className="site-header fixed inset-x-0 top-0 z-[60]">
        <div className="flex h-16 items-center justify-between gap-4 px-5 md:h-[4.5rem] md:px-[5vw]">
          <a
            href="#inicio"
            onClick={(e) => {
              e.preventDefault();
              go(0);
            }}
            aria-label={`${site.name} — voltar ao início`}
            className="-ml-1 rounded-lg p-1"
          >
            <Logo markClassName="size-8 md:size-9" />
          </a>

          <nav aria-label="Principal" className="hidden md:block">
            <ul className="flex items-center gap-8 text-[0.95rem]">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      go(item.href);
                    }}
                    className="nav-link"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setOpen(true)} className="relative grid size-11 place-items-center rounded-full transition-colors hover:bg-current/10" aria-label={`Abrir carrinho, ${count} ${count === 1 ? "item" : "itens"}`}>
              <ShoppingBag aria-hidden="true" className="size-[1.35rem]" />
              {count > 0 && (
                <span ref={badgeRef} className="absolute right-0.5 top-0.5 grid min-w-5 place-items-center rounded-full bg-berry px-1 text-[11px] font-semibold leading-5 text-night tabular-nums">
                  {count}
                </span>
              )}
            </button>
            <button type="button" onClick={() => setMenuOpen(true)} className="grid size-11 place-items-center rounded-full md:hidden" aria-label="Abrir menu" aria-expanded={menuOpen}>
              <Menu aria-hidden="true" className="size-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Menu mobile */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!menuOpen}
        className={`fixed inset-0 z-[95] flex flex-col bg-night text-cream transition-[opacity,visibility] duration-300 md:hidden ${menuOpen ? "visible opacity-100" : "invisible opacity-0"}`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Logo markClassName="size-8" />
          <button type="button" onClick={() => setMenuOpen(false)} className="grid size-11 place-items-center rounded-full" aria-label="Fechar menu">
            <X aria-hidden="true" className="size-6" />
          </button>
        </div>
        <nav aria-label="Menu mobile" className="flex flex-1 flex-col justify-center px-6 pb-16">
          <ul className="space-y-1">
            {NAV.map((item, i) => (
              <li key={item.href} style={{ transitionDelay: menuOpen ? `${80 + i * 50}ms` : "0ms" }} className={`transition-[opacity,translate] duration-500 ease-out-expo ${menuOpen ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
                <a
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    go(item.href);
                  }}
                  className="type-display block py-2 text-[clamp(2.8rem,14vw,4.5rem)]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => { setMenuOpen(false); setOpen(true); }} className="btn btn-primary mt-10 self-start">
            <ShoppingBag aria-hidden="true" className="size-4" /> Ver carrinho ({count})
          </button>
        </nav>
      </div>
    </>
  );
}
