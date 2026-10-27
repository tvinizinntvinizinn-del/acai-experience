import { site } from "@/config/site";

/**
 * Marca: pote de açaí com cúpula roxa, fio de leite condensado e morango.
 * O corpo do pote usa `currentColor`, então a marca acompanha o tema
 * (grafite sobre creme, creme sobre roxo).
 */
export function LogoMark({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <path d="M11 30.5C11 22.6 20.4 16.8 32 16.8S53 22.6 53 30.5Z" fill="#8137C8" />
      <path d="M26.4 18.2c2.2-3.8 6-5.8 10-5.2-1.6 1.3-2.2 2.9-1.5 4.8" fill="#8137C8" />
      <path d="M14.4 30.2c1.3-5.4 6.8-9.4 14-10.4-4.1 2.3-6.9 5.9-7.7 10.4Z" fill="#4B1768" />
      <path d="M16.2 27.4l5.4-4.6 5 4.4 5.6-5.3 5.4 5.3 5.2-4.6 4.8 4.1" fill="none" stroke="#FFF3DF" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42.6 9.6c3.7-.9 7.3 1.6 7 5.4-.3 3.9-4.4 7.4-8.4 8.7-1.9-3.6-2.7-7.7-1.6-11.1.4-1.5 1.6-2.6 3-3Z" fill="#F454A2" />
      <circle cx="44.3" cy="14.2" r="0.85" fill="#FFF3DF" />
      <circle cx="42.4" cy="17.8" r="0.85" fill="#FFF3DF" />
      <circle cx="46" cy="17.6" r="0.85" fill="#FFF3DF" />
      <rect x="8" y="30" width="48" height="6" rx="3" fill="currentColor" />
      <path d="M11.8 38.2h40.4l-3.6 18a4.2 4.2 0 0 1-4.1 3.4H19.5a4.2 4.2 0 0 1-4.1-3.4Z" fill="currentColor" />
      <path d="M14.1 45.2c11.8 2.9 24 2.9 35.8 0l-1 5.2c-11.2 2.7-22.6 2.7-33.8 0Z" fill="#8137C8" />
    </svg>
  );
}

/** Marca + nome (o nome vem de src/config/site.ts). */
export function Logo({ className = "", markClassName = "size-9", textClassName = "text-[1.45rem] md:text-[1.6rem]" }: { className?: string; markClassName?: string; textClassName?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={`shrink-0 ${markClassName}`} />
      <span className={`type-display leading-none tracking-[0.01em] ${textClassName}`}>{site.name}</span>
    </span>
  );
}
