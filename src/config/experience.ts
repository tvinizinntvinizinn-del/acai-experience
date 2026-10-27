/**
 * Configuração do protagonista visual (o copo).
 *
 * renderer:
 *  - "sequence": sequência de imagens renderizadas (padrão). Funciona sem WebGL.
 *  - "model": modelo GLB renderizado com React Three Fiber. Use quando houver um
 *    modelo realista em /public/models. Se o modelo falhar ou o WebGL não estiver
 *    disponível, o site volta automaticamente para a sequência.
 *
 * Os frames atuais em /public/sequence são RENDERS PROVISÓRIOS gerados
 * proceduralmente. Para trocar pela versão final, exporte frames com o mesmo
 * enquadramento e nomes (veja public/sequence/README.md).
 */
export type SequenceVariant = "desktop" | "mobile";

export const experience = {
  renderer: "sequence" as "sequence" | "model",

  model: {
    url: "/models/acai-cup.glb",
    /** Escala aplicada ao GLB para caber no enquadramento (altura ~2.3 unidades). */
    scale: 1,
    /** Rotação inicial em graus (eixo Y). */
    rotationY: 0,
  },

  /** Proporção largura/altura dos frames. */
  frameAspect: 900 / 1125,

  /** Volta completa de 360° — frame 0 = frente do copo. */
  spin: { dir: "/sequence/spin", count: 60, degreesPerFrame: 6 },
  /** Mesmos ângulos sem as coberturas do topo (usado na "explosão" dos ingredientes). */
  bare: { dir: "/sequence/bare", from: 6, to: 16 },
  /** Aproximação de câmera no ângulo do frame `closeup.atSpinFrame`. */
  closeup: { dir: "/sequence/closeup", count: 24, atSpinFrame: 15 },

  /** Largura em px de cada variante — mobile carrega a versão leve. */
  variantWidth: { desktop: 900, mobile: 540 } as Record<SequenceVariant, number>,

  /** Velocidade da rotação ociosa no Hero (frames por segundo). */
  idleFramesPerSecond: 1.6,
};

export function framePath(dir: string, variant: SequenceVariant, index: number) {
  return `${dir}/${variant}/f${String(index).padStart(3, "0")}.webp`;
}

export const posterFrame = framePath(experience.spin.dir, "desktop", 0);
