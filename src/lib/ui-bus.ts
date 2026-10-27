/**
 * Pequenos canais de comunicação entre componentes que não compartilham árvore
 * (header ↔ seções, cardápio ↔ montador) sem re-render global.
 */
import type { BuilderPreset } from "@/data/builder";
import type { SizeId } from "@/data/menu";

type Listener<T> = (value: T) => void;

function channel<T>(initial: T) {
  let value = initial;
  const listeners = new Set<Listener<T>>();
  return {
    get: () => value,
    set(next: T) {
      if (next === value) return;
      value = next;
      listeners.forEach((fn) => fn(value));
    },
    subscribe(fn: Listener<T>) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
  };
}

/** Tema do header conforme a seção sob ele. */
export const headerTheme = channel<"light" | "dark">("light");

/** true enquanto a intro está na tela. */
export const introActive = channel<boolean>(false);

/** true enquanto o menu mobile está aberto. */
export const menuOpen = channel<boolean>(false);

export type CustomizeRequest = { preset: BuilderPreset; size: SizeId; productName: string; stamp: number };

/** Cardápio → montador ("Personalizar"). */
export const customizeRequest = channel<CustomizeRequest | null>(null);
