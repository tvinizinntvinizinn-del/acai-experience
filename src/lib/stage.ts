/**
 * Estado compartilhado do "palco" do copo.
 * A timeline do GSAP escreve aqui; os renderizadores (sequência de imagens ou
 * modelo 3D) leem a cada tick. Objeto mutável de propósito: evita re-render do
 * React em 60 fps.
 */
export type StageState = {
  /** Frame da volta de 360° (pode ser fracionário; é "embrulhado" no total de frames). */
  frame: number;
  /** 0 = copo completo, 1 = copo sem coberturas (explosão dos ingredientes). */
  bareMix: number;
  /** 0 = enquadramento normal, 1 = sequência de close-up. */
  closeMix: number;
  /** Frame da sequência de close-up (0 = enquadramento normal, último = mais perto). */
  closeFrame: number;
  /** Posição da luz lateral que varre o copo (-1 = desligada, 0 → 1 = esquerda → direita). */
  sweep: number;
  /** Incrementado a cada alteração — usado para redesenhar só quando necessário. */
  version: number;
};

export function createStage(initial: Partial<StageState> = {}): StageState {
  return { frame: 0, bareMix: 0, closeMix: 0, closeFrame: 0, sweep: -1, version: 0, ...initial };
}

export function setStage(stage: StageState, patch: Partial<Omit<StageState, "version">>) {
  let changed = false;
  for (const key in patch) {
    const k = key as keyof typeof patch;
    const value = patch[k] as number;
    if (stage[k] !== value) {
      stage[k] = value;
      changed = true;
    }
  }
  if (changed) stage.version++;
}

/** Palco do Hero / experiência de scroll. */
export const heroStage = createStage();

/** Interpola entre dois frames pelo caminho mais curto da volta. */
export function lerpWrap(a: number, b: number, t: number, total: number) {
  const d = ((((b - a) % total) + total * 1.5) % total) - total / 2;
  return a + d * t;
}

export function wrap(value: number, total: number) {
  return ((value % total) + total) % total;
}
