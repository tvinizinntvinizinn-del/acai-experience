"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { experience, posterFrame, type SequenceVariant } from "@/config/experience";
import { gsap } from "@/lib/gsap";
import { getFrameSet, pickVariant, type FrameSet } from "@/lib/sequence";
import { wrap, type StageState } from "@/lib/stage";
import { hasWebGL, isLowPowerDevice } from "@/lib/webgl";

const AcaiModel = dynamic(() => import("./AcaiModel"), { ssr: false });

type Props = {
  stage: StageState;
  className?: string;
  /** Mostra o primeiro frame como <img> até o canvas desenhar (bom para LCP e sem JS). */
  poster?: boolean;
  /** Carrega as sequências extras (sem coberturas / close-up). */
  extras?: boolean;
  onReady?: () => void;
};

/**
 * Renderizador do copo. Escolhe automaticamente:
 *  - modelo 3D (React Three Fiber) quando `experience.renderer === "model"`,
 *    houver WebGL e o aparelho não for fraco;
 *  - sequência de imagens nos demais casos (ou se o modelo falhar).
 */
export function AcaiCanvas({ stage, className = "", poster = true, extras = true, onReady }: Props) {
  const [useModel, setUseModel] = useState(false);

  useEffect(() => {
    if (experience.renderer === "model" && hasWebGL() && !isLowPowerDevice()) setUseModel(true);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {useModel ? (
        <ModelBoundary fallback={<SequencePlayer stage={stage} poster={poster} extras={extras} onReady={onReady} />}>
          <AcaiModel stage={stage} onReady={onReady} />
        </ModelBoundary>
      ) : (
        <SequencePlayer stage={stage} poster={poster} extras={extras} onReady={onReady} />
      )}
    </div>
  );
}

class ModelBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("[AcaiCanvas] Modelo 3D indisponível, usando sequência de imagens.", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function SequencePlayer({ stage, poster, extras, onReady }: Omit<Props, "className">) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawn, setDrawn] = useState(false);
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const variant: SequenceVariant = pickVariant();
    const spin = getFrameSet("spin", variant);
    const bare = getFrameSet("bare", variant);
    const close = getFrameSet("closeup", variant);
    spin.load();
    let extrasTimer: number | undefined;
    if (extras) {
      extrasTimer = window.setTimeout(() => {
        bare.load(3);
        close.load(3);
      }, 1200);
    }

    let dirty = true;
    let visible = true;
    let lastVersion = -1;
    let firstDrawDone = false;
    const markDirty = () => {
      dirty = true;
    };
    const unsubs = [spin.subscribe(markDirty), bare.subscribe(markDirty), close.subscribe(markDirty)];

    const maxDpr = window.innerWidth < 768 ? 1.5 : 2;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        dirty = true;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) dirty = true;
    });
    io.observe(canvas);

    const layers: [HTMLImageElement, number][] = [];
    const pushPair = (set: FrameSet, a: number, b: number, t: number, weight: number) => {
      if (weight <= 0.0005) return 0;
      const ia = set.exact(a);
      const ib = set.exact(b);
      if (ia && ib && ia !== ib) {
        layers.push([ia, weight * (1 - t)], [ib, weight * t]);
        return weight;
      }
      const near = ia ?? ib ?? set.nearest(t < 0.5 ? a : b);
      if (near) {
        layers.push([near, weight]);
        return weight;
      }
      return 0;
    };

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      const ar = experience.frameAspect;
      let dw = W;
      let dh = W / ar;
      if (dh > H) {
        dh = H;
        dw = H * ar;
      }
      const dx = (W - dw) / 2;
      const dy = (H - dh) / 2;

      layers.length = 0;
      const total = experience.spin.count;
      const closeMix = Math.min(1, Math.max(0, stage.closeMix));
      const bareMix = Math.min(1, Math.max(0, stage.bareMix)) * (1 - closeMix);
      const f = wrap(stage.frame, total);
      const i0 = Math.floor(f);
      const t = f - i0;

      let missing = 0;
      if (closeMix > 0) {
        const c = Math.min(close.count - 1, Math.max(0, stage.closeFrame));
        const c0 = Math.floor(c);
        if (!pushPair(close, c0, Math.min(close.count - 1, c0 + 1), c - c0, closeMix)) missing += closeMix;
      }
      if (bareMix > 0) {
        const fb = Math.min(bare.to, Math.max(bare.from, f));
        const b0 = Math.floor(fb);
        if (!pushPair(bare, b0, Math.min(bare.to, b0 + 1), fb - b0, bareMix)) missing += bareMix;
      }
      pushPair(spin, i0, (i0 + 1) % total, t, 1 - closeMix - bareMix + missing);

      ctx.clearRect(0, 0, W, H);
      if (!layers.length) return false;
      ctx.globalCompositeOperation = "lighter";
      for (const [img, weight] of layers) {
        if (weight < 0.002) continue;
        ctx.globalAlpha = Math.min(1, weight);
        ctx.drawImage(img, dx, dy, dw, dh);
      }
      ctx.globalAlpha = 1;

      if (stage.sweep >= 0 && stage.sweep <= 1) {
        ctx.globalCompositeOperation = "source-atop";
        const x = dx + dw * (stage.sweep * 1.8 - 0.4);
        const g = ctx.createLinearGradient(x - dw * 0.3, dy, x + dw * 0.3, dy + dh * 0.2);
        g.addColorStop(0, "rgba(255,236,248,0)");
        g.addColorStop(0.5, "rgba(255,236,248,0.38)");
        g.addColorStop(1, "rgba(255,236,248,0)");
        ctx.fillStyle = g;
        ctx.fillRect(dx, dy, dw, dh);
      }
      ctx.globalCompositeOperation = "source-over";
      return true;
    };

    const tick = () => {
      if (!visible) return;
      if (!dirty && stage.version === lastVersion) return;
      lastVersion = stage.version;
      dirty = false;
      if (draw() && !firstDrawDone) {
        firstDrawDone = true;
        setDrawn(true);
        readyRef.current?.();
      }
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      unsubs.forEach((u) => u());
      ro.disconnect();
      io.disconnect();
      window.clearTimeout(extrasTimer);
    };
  }, [stage, extras]);

  return (
    <>
      {poster && (
        // Mesmo arquivo do frame 0: a troca para o canvas é imperceptível.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterFrame}
          alt=""
          aria-hidden="true"
          width={900}
          height={1125}
          fetchPriority="high"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${drawn ? "opacity-0" : "opacity-100"}`}
        />
      )}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" role="img" aria-label="Copo de açaí com morangos, banana, granola e leite condensado" />
    </>
  );
}
