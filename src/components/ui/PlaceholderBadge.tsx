import { site } from "@/config/site";

/** Selo discreto sobre imagens provisórias (renders de layout, não fotos reais). */
export function PlaceholderBadge({ className = "" }: { className?: string }) {
  if (!site.showPlaceholderBadges) return null;
  return (
    <span className={`pointer-events-none absolute z-10 rounded-full bg-night/70 px-2.5 py-1 text-[11px] font-medium leading-none text-cream/90 backdrop-blur-sm ${className}`}>
      Imagem provisória
    </span>
  );
}
