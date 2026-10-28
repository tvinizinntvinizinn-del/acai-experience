import Image from "next/image";
import { site } from "@/config/site";

/**
 * Logo oficial (arte da loja com fundo recortado).
 * Arquivo: public/images/brand/logo.webp — para trocar, mantenha fundo transparente.
 * Original com fundo: tools/brand/logo-original.png.
 */
export const LOGO = { src: "/images/brand/logo.webp", width: 720, height: 700 } as const;

type Props = {
  /** Altura exibida em px (define também a resolução baixada). */
  height: number;
  className?: string;
  /** Carrega antes (use só no header). */
  preload?: boolean;
  /** Texto alternativo; vazio quando o link em volta já tem nome. */
  alt?: string;
};

export function Logo({ height, className = "", preload = false, alt = site.name }: Props) {
  const width = Math.round((height * LOGO.width) / LOGO.height);
  return (
    <Image
      src={LOGO.src}
      width={width}
      height={height}
      alt={alt}
      preload={preload}
      className={`select-none ${className}`}
      draggable={false}
    />
  );
}
