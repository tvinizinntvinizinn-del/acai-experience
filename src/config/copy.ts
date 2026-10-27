/**
 * Textos de marca. Edite à vontade — os componentes leem daqui.
 * Quebras de linha nos títulos são arrays (uma linha por item).
 */
export const copy = {
  intro: {
    first: "NÃO É SÓ AÇAÍ.",
    second: "É UMA EXPERIÊNCIA.",
    skip: "Pular intro",
  },
  hero: {
    /** Linhas do título gigante no desktop. */
    title: ["O SABOR QUE", "TE CONQUISTA."],
    /** Mesma frase quebrada para telas estreitas. */
    titleMobile: ["O SABOR", "QUE TE", "CONQUISTA."],
    subtitle: "Monte seu açaí do seu jeito e descubra sua combinação favorita.",
    primaryCta: "MONTAR MEU AÇAÍ",
    secondaryCta: "EXPLORAR CARDÁPIO",
    scrollHint: "Role para descobrir",
  },
  experience: {
    statement1: ["GELADO,", "CREMOSO,", "DO SEU JEITO."],
    statement2: ["VOCÊ ESCOLHE.", "A GENTE MONTA."],
    closeup: ["CREMOSO ATÉ A", "ÚLTIMA COLHERADA."],
    closeupCaption: "Textura densa, gelada e brilhante — com fruta, crocância e calda em cada camada.",
    labels: {
      strawberry: "Morango",
      banana: "Banana",
      granola: "Granola",
      milk: "Leite condensado",
      acai: "Açaí cremoso",
    },
  },
  ingredients: {
    title: ["CADA CAMADA.", "UMA NOVA SENSAÇÃO."],
    lead: "Do açaí gelado à última volta de leite condensado: veja como cada ingrediente entra no copo.",
  },
  menu: {
    title: "ESCOLHA SEU FAVORITO.",
    lead: "Combinações da casa prontas para pedir — ou para servir de ponto de partida no montador.",
  },
  builder: {
    title: ["DO SEU JEITO.", "DO SEU SABOR."],
    lead: "Cinco escolhas e o seu copo está pronto. O preço atualiza a cada item.",
  },
  experienceSection: {
    title: ["FEITO PARA QUEM", "AMA AÇAÍ."],
    lead: "Fruta de verdade, crocância generosa e calda escorrendo pela borda. Do jeito que dá vontade.",
  },
  gallery: {
    title: "PARA ABRIR O APETITE.",
    lead: "Toque em uma imagem para ampliar.",
  },
  contact: {
    title: ["SEU PRÓXIMO AÇAÍ", "COMEÇA AQUI."],
    lead: "Monte o pedido no site e finalize pelo WhatsApp. Respondemos por lá.",
    whatsapp: "PEDIR PELO WHATSAPP",
    instagram: "VER INSTAGRAM",
  },
} as const;
