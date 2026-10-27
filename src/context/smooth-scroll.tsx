"use client";

import Lenis from "lenis";
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

type ScrollTarget = string | number | HTMLElement;

type SmoothScrollContextValue = {
  scrollTo: (target: ScrollTarget, options?: { offset?: number; immediate?: boolean }) => void;
  /** Trava a rolagem (drawer, menu, intro). Contagem de referências. */
  lock: () => void;
  unlock: () => void;
};

const SmoothScrollContext = createContext<SmoothScrollContextValue | null>(null);

const HEADER_OFFSET = 72;

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const locks = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      autoRaf: false,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    if (locks.current > 0) lenis.stop();

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Callbacks estáveis (dependem só de refs) — evitam reiniciar efeitos de quem os usa.
  const value = useMemo<SmoothScrollContextValue>(
    () => ({
      scrollTo(target, options = {}) {
        const offset = options.offset ?? (typeof target === "number" ? 0 : -HEADER_OFFSET);
        const lenis = lenisRef.current;
        if (lenis) {
          lenis.scrollTo(target, { offset, immediate: options.immediate, duration: 1.6, force: true });
          return;
        }
        const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : typeof target === "number" ? null : target;
        const top = typeof target === "number" ? target : el ? el.getBoundingClientRect().top + window.scrollY + offset : 0;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top, behavior: reduce || options.immediate ? "auto" : "smooth" });
      },
      lock() {
        locks.current++;
        lenisRef.current?.stop();
        document.documentElement.classList.add("scroll-locked");
      },
      unlock() {
        locks.current = Math.max(0, locks.current - 1);
        if (locks.current === 0) {
          lenisRef.current?.start();
          document.documentElement.classList.remove("scroll-locked");
        }
      },
    }),
    [],
  );

  return <SmoothScrollContext.Provider value={value}>{children}</SmoothScrollContext.Provider>;
}

export function useSmoothScroll() {
  const ctx = useContext(SmoothScrollContext);
  if (!ctx) throw new Error("useSmoothScroll precisa estar dentro de <SmoothScrollProvider>");
  return ctx;
}
