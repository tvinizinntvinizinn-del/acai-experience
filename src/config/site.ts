/**
 * Configuração central da marca.
 * Tudo que é específico da loja (nome, contatos, endereço, horários) fica aqui.
 * Campos vazios ou `null` simplesmente não aparecem no site — nada é inventado.
 */

export type OpeningHours = { days: string; time: string };

export type SiteConfig = {
  /** Nome exibido no header, rodapé, SEO e mensagem do WhatsApp. */
  name: string;
  description: string;
  /** Domínio público (usado em SEO, sitemap e Open Graph). Sem barra no final. */
  url: string;
  contact: {
    /** Só dígitos, com DDI + DDD. Ex.: "5511912345678". Vazio = botões desativados. */
    whatsapp: string;
    /** URL completa do perfil. Ex.: "https://instagram.com/suamarca". */
    instagram: string;
    /** Exibição do @. Ex.: "@suamarca". */
    instagramHandle: string;
    /** Endereço exibido na seção de contato. `null` = não exibir. */
    address: { line1: string; line2?: string; mapsUrl?: string } | null;
    /** Horários de funcionamento. `null` = não exibir. */
    hours: OpeningHours[] | null;
  };
  ordering: {
    /** Habilita a opção "Retirar no balcão" no carrinho. */
    pickup: boolean;
    /** Habilita a opção "Entrega" no carrinho. */
    delivery: boolean;
    /** Texto curto exibido quando o cliente escolhe entrega. */
    deliveryNote: string;
  };
  /**
   * true = os preços em src/data são apenas demonstrativos e o site avisa isso.
   * Troque os valores pelos reais e mude para false.
   */
  demoPrices: boolean;
  /** Mostra o selo "Imagem provisória" sobre renders/placeholders. */
  showPlaceholderBadges: boolean;
  /**
   * false = fotos carregadas direto do Unsplash/Pexels (otimizadas pelo next/image).
   * true = usa as cópias em public/images/fotos (rode `npm run fotos` antes).
   */
  localPhotos: boolean;
};

export const site: SiteConfig = {
  name: "Açaí Experience",
  description:
    "Açaí cremoso montado do seu jeito. Escolha tamanho, base, complementos e coberturas e envie o pedido pelo WhatsApp.",
  url: "https://www.seudominio.com.br",
  contact: {
    whatsapp: "",
    instagram: "",
    instagramHandle: "",
    address: null,
    hours: null,
  },
  ordering: {
    pickup: true,
    delivery: true,
    deliveryNote: "Taxa e área de entrega são confirmadas pelo WhatsApp.",
  },
  demoPrices: true,
  showPlaceholderBadges: true,
  localPhotos: false,
};

export const isWhatsAppConfigured = /^\d{10,15}$/.test(site.contact.whatsapp);
export const isInstagramConfigured = /^https?:\/\//.test(site.contact.instagram);
