let cached: boolean | null = null;

/** Detecta WebGL2/WebGL uma vez. Usado para decidir entre modelo 3D e sequência. */
export function hasWebGL() {
  if (cached !== null) return cached;
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    cached = !!gl;
    (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    cached = false;
  }
  return cached;
}

/** Heurística conservadora para aparelhos fracos. */
export function isLowPowerDevice() {
  if (typeof navigator === "undefined") return false;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  return (mem !== undefined && mem <= 2) || (cores !== undefined && cores <= 2);
}
