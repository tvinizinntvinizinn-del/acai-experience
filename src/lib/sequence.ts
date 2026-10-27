import { experience, framePath, type SequenceVariant } from "@/config/experience";

type Listener = () => void;

/**
 * Carrega uma sequência de frames de forma progressiva: primeiro frames
 * espaçados (para a rotação já funcionar), depois preenche os intervalos.
 * Instâncias são compartilhadas (cache por chave), então a intro e o Hero
 * usam as mesmas imagens sem baixar duas vezes.
 */
export class FrameSet {
  readonly frames: (HTMLImageElement | null)[];
  private listeners = new Set<Listener>();
  private started = false;
  private failed = 0;
  loadedCount = 0;

  constructor(
    readonly dir: string,
    readonly variant: SequenceVariant,
    readonly from: number,
    readonly to: number,
  ) {
    this.frames = new Array(to - from + 1).fill(null);
  }

  get count() {
    return this.frames.length;
  }

  get complete() {
    return this.loadedCount + this.failed >= this.count;
  }

  /** Imagem do frame absoluto `index`, ou a carregada mais próxima. */
  nearest(index: number): HTMLImageElement | null {
    const local = Math.round(index) - this.from;
    const clamped = Math.max(0, Math.min(this.count - 1, local));
    if (this.frames[clamped]) return this.frames[clamped];
    for (let d = 1; d < this.count; d++) {
      const a = this.frames[clamped - d];
      if (a) return a;
      const b = this.frames[clamped + d];
      if (b) return b;
    }
    return null;
  }

  exact(index: number): HTMLImageElement | null {
    const local = index - this.from;
    return local >= 0 && local < this.count ? this.frames[local] : null;
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  load(concurrency = 6) {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    const queue = progressiveOrder(this.count);
    let cursor = 0;
    const next = (): Promise<void> => {
      if (cursor >= queue.length) return Promise.resolve();
      const local = queue[cursor++];
      return this.loadOne(local).then(next);
    };
    for (let i = 0; i < concurrency; i++) void next();
  }

  private loadOne(local: number) {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.src = framePath(this.dir, this.variant, this.from + local);
      const done = () => {
        this.frames[local] = img;
        this.loadedCount++;
        this.listeners.forEach((fn) => fn());
        resolve();
      };
      img.onload = () => {
        if (typeof img.decode === "function") img.decode().then(done, done);
        else done();
      };
      img.onerror = () => {
        this.failed++;
        resolve();
      };
    });
  }
}

/** Ordem de carregamento: 0, depois saltos cada vez menores (12, 6, 3, 1). */
export function progressiveOrder(count: number) {
  const seen = new Set<number>();
  const order: number[] = [];
  for (const stride of [12, 6, 3, 1]) {
    for (let i = 0; i < count; i += stride) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
  }
  return order;
}

const cache = new Map<string, FrameSet>();

export type SequenceName = "spin" | "bare" | "closeup";

export function getFrameSet(name: SequenceName, variant: SequenceVariant) {
  const key = `${name}:${variant}`;
  let set = cache.get(key);
  if (!set) {
    if (name === "spin") set = new FrameSet(experience.spin.dir, variant, 0, experience.spin.count - 1);
    else if (name === "bare") set = new FrameSet(experience.bare.dir, variant, experience.bare.from, experience.bare.to);
    else set = new FrameSet(experience.closeup.dir, variant, 0, experience.closeup.count - 1);
    cache.set(key, set);
  }
  return set;
}

/** Variante leve para telas pequenas ou conexões econômicas. */
export function pickVariant(): SequenceVariant {
  if (typeof window === "undefined") return "desktop";
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (conn?.saveData || conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g") return "mobile";
  const cssWidth = Math.min(window.innerWidth, window.innerHeight * experience.frameAspect);
  return cssWidth * Math.min(window.devicePixelRatio || 1, 2) > 700 && window.innerWidth >= 768 ? "desktop" : "mobile";
}
