import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

/** Registra os plugins uma única vez (somente no browser). */
export function ensureGsap() {
  if (!registered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: "power3.out", duration: 0.8 });
    ScrollTrigger.config({ ignoreMobileResize: true });
    registered = true;
  }
  return { gsap, ScrollTrigger };
}

ensureGsap();

export { gsap, ScrollTrigger };

/** Curvas de movimento do projeto (ver CLAUDE.md). */
export const EASE = {
  /** Entradas — desacelera longo e suave. */
  out: "expo.out",
  /** Saídas — acelera discretamente. */
  in: "power2.in",
  /** Movimentos de ida e volta / flutuação. */
  inOut: "sine.inOut",
  /** Pequenos "assentamentos" (itens que caem no copo). */
  settle: "back.out(1.6)",
} as const;
