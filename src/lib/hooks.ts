"use client";

import { useEffect, useLayoutEffect, useState } from "react";

export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Escuta uma media query. Retorna `fallback` durante o SSR. */
export function useMediaQuery(query: string, fallback = false) {
  const [matches, setMatches] = useState(fallback);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);
  return matches;
}

export function useReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
