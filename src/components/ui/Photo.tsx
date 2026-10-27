"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { LogoMark } from "./Logo";

type Props = Omit<ImageProps, "onError" | "src"> & {
  src: string;
  /** Imagem local mostrada se a foto remota não carregar. */
  fallbackSrc?: string;
  /** Avisa o componente pai quando a imagem de reserva entrou no lugar. */
  onFallback?: () => void;
  /** Cor do painel final, se nem a reserva carregar. */
  fallbackTone?: string;
};

/**
 * next/image com reserva em duas etapas:
 * 1. tenta a foto (`src`, normalmente do Unsplash/Pexels);
 * 2. se falhar (sem internet, bloqueio, URL removida), usa `fallbackSrc` (render local);
 * 3. se a reserva também falhar, mostra um painel com a marca.
 * Use com `fill` dentro de um contêiner posicionado.
 */
export function Photo({ src, fallbackSrc, onFallback, fallbackTone = "#4B1768", alt, ...props }: Props) {
  const [stage, setStage] = useState<"photo" | "fallback" | "failed">("photo");
  const stageRef = useRef(stage);
  stageRef.current = stage;

  // Nova foto: volta a tentar a original.
  const lastSrc = useRef(src);
  useEffect(() => {
    if (lastSrc.current === src) return;
    lastSrc.current = src;
    stageRef.current = "photo";
    setStage("photo");
  }, [src]);

  const fail = useCallback(() => {
    if (stageRef.current === "photo" && fallbackSrc) {
      stageRef.current = "fallback";
      setStage("fallback");
      onFallback?.();
    } else if (stageRef.current !== "failed") {
      stageRef.current = "failed";
      setStage("failed");
    }
  }, [fallbackSrc, onFallback]);

  // Erros que aconteceram antes da hidratação não disparam onError.
  const checkRef = useCallback(
    (img: HTMLImageElement | null) => {
      if (img && img.complete && img.naturalWidth === 0) fail();
    },
    [fail],
  );

  if (stage === "failed") {
    return (
      <span
        role="img"
        aria-label={alt}
        className="absolute inset-0 grid place-items-center"
        style={{ background: `radial-gradient(70% 70% at 50% 40%, ${fallbackTone}, #240D38)` }}
      >
        <LogoMark className="size-[22%] min-w-12 max-w-24 text-cream/85" />
      </span>
    );
  }

  const current = stage === "fallback" && fallbackSrc ? fallbackSrc : src;
  return <Image {...props} key={current} src={current} alt={alt} ref={checkRef} onError={fail} />;
}
