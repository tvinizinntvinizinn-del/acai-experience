import { isInstagramConfigured, isWhatsAppConfigured, site } from "@/config/site";

/** Dados estruturados — só inclui o que está configurado (nada inventado). */
export function JsonLd() {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    name: site.name,
    description: site.description,
    url: site.url,
    image: `${site.url}/images/og.jpg`,
    logo: `${site.url}/images/brand/logo.webp`,
    servesCuisine: "Açaí",
  };
  if (isWhatsAppConfigured) data.telephone = `+${site.contact.whatsapp}`;
  if (isInstagramConfigured) data.sameAs = [site.contact.instagram];
  if (site.contact.address) data.address = { "@type": "PostalAddress", streetAddress: [site.contact.address.line1, site.contact.address.line2].filter(Boolean).join(", ") };
  if (site.contact.hours) data.openingHours = site.contact.hours.map((h) => `${h.days} ${h.time}`);

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
