import { isInstagramConfigured, isWhatsAppConfigured, site } from "@/config/site";
import { NAV } from "@/config/nav";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden bg-graphite pb-10 pt-20 text-cream/70">
      <div className="px-6 md:px-[5vw]">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <Logo className="text-cream" markClassName="size-12" textClassName="text-[2rem]" />
            <p className="mt-3 max-w-[20rem] text-sm">{site.description}</p>
          </div>
          <nav aria-label="Rodapé">
            <ul className="space-y-2 text-sm">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="hover:text-cream">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-2 text-sm">
            {isWhatsAppConfigured && <p>WhatsApp: +{site.contact.whatsapp}</p>}
            {isInstagramConfigured && (
              <p>
                <a href={site.contact.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-cream">
                  {site.contact.instagramHandle || "Instagram"}
                </a>
              </p>
            )}
            {site.contact.address && <p>{site.contact.address.line1}</p>}
          </div>
        </div>

        <p aria-hidden="true" className="type-display mt-20 select-none whitespace-nowrap text-[clamp(3rem,12.5vw,15rem)] leading-[0.8] text-cream/[0.06]">
          {site.name}
        </p>

        <div className="mt-8 flex flex-col gap-2 border-t border-cream/10 pt-6 text-xs text-cream/45 md:flex-row md:justify-between">
          <p>
            © {year} {site.name}. Todos os direitos reservados.
          </p>
          <p>
            {site.demoPrices ? "Preços de demonstração. " : ""}
            Fotos ilustrativas: Unsplash e Pexels (licenças gratuitas), com renders 3D de reserva.{" "}
            {site.showPlaceholderBadges ? "Imagens marcadas como provisórias são renders de layout." : ""}
          </p>
        </div>
      </div>
    </footer>
  );
}
