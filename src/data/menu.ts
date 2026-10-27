/**
 * Cardápio editável.
 *
 * ATENÇÃO: os preços abaixo são DEMONSTRATIVOS (site.demoPrices = true).
 * Substitua pelos valores reais da loja e altere `demoPrices` para false em
 * src/config/site.ts. Use `null` para um tamanho que deve aparecer como
 * "sob consulta" e omita o tamanho para não oferecê-lo.
 */
import type { BuilderPreset } from "./builder";
import { getPhoto, photoCredit, photoSrc } from "./photos";

export type SizeId = "300" | "500" | "700";

export type Size = { id: SizeId; label: string; ml: number };

export const SIZES: Size[] = [
  { id: "300", label: "300 ml", ml: 300 },
  { id: "500", label: "500 ml", ml: 500 },
  { id: "700", label: "700 ml", ml: 700 },
];

export type MenuProduct = {
  id: string;
  name: string;
  description: string;
  /** Ingredientes principais, exibidos como lista curta. */
  highlights: string[];
  image: { src: string; alt: string; width: number; height: number; placeholder?: boolean; credit?: string; fallback?: string };
  /** Tom do nicho atrás da foto (combina com o sabor). */
  tint: string;
  prices: Partial<Record<SizeId, number | null>>;
  /** Ponto de partida quando o cliente clica em "Personalizar". */
  preset: BuilderPreset;
  featured?: boolean;
};

/** Foto ilustrativa do produto (src/data/photos.json). Troque por fotos próprias. */
const img = (photoId: string) => {
  const p = getPhoto(photoId);
  return { src: photoSrc(p), alt: p.alt, width: 800, height: 1000, credit: photoCredit(p), fallback: p.fallback };
};

export const MENU: MenuProduct[] = [
  {
    id: "especial-da-casa",
    name: "Açaí Especial da Casa",
    description: "O copo mais completo: frutas, crocância e duas caldas para quem não quer escolher.",
    highlights: ["Morango", "Banana", "Kiwi", "Granola", "Leite condensado", "Chocolate"],
    image: img("especial"),
    tint: "#8137C8",
    prices: { "300": 21.9, "500": 28.9, "700": 35.9 },
    preset: {
      base: "acai",
      complements: ["morango", "banana", "kiwi", "granola"],
      toppings: ["leite-condensado", "chocolate"],
    },
    featured: true,
  },
  {
    id: "tradicional",
    name: "Açaí Tradicional",
    description: "Açaí cremoso com granola crocante, banana e um fio de leite condensado.",
    highlights: ["Granola", "Banana", "Leite condensado"],
    image: img("tradicional"),
    tint: "#C9A26B",
    prices: { "300": 14.9, "500": 19.9, "700": 25.9 },
    preset: { base: "acai", complements: ["granola", "banana"], toppings: ["leite-condensado"] },
  },
  {
    id: "morango",
    name: "Açaí com Morango",
    description: "Morangos suculentos sobre açaí gelado, com leite condensado escorrendo pela borda.",
    highlights: ["Morango", "Granola", "Leite condensado"],
    image: img("morango"),
    tint: "#F454A2",
    prices: { "300": 16.9, "500": 22.9, "700": 28.9 },
    preset: { base: "acai", complements: ["morango", "granola"], toppings: ["leite-condensado"] },
  },
  {
    id: "banana",
    name: "Açaí com Banana",
    description: "Rodelas de banana, granola e mel: doce na medida, crocante do começo ao fim.",
    highlights: ["Banana", "Granola", "Mel"],
    image: img("banana"),
    tint: "#E8C35A",
    prices: { "300": 15.9, "500": 21.9, "700": 27.9 },
    preset: { base: "acai", complements: ["banana", "granola"], toppings: ["mel"] },
  },
  {
    id: "ninho",
    name: "Açaí com Ninho",
    description: "Uma montanha de leite em pó sobre o açaí, com morango e leite condensado.",
    highlights: ["Leite em pó", "Morango", "Leite condensado"],
    image: img("ninho"),
    tint: "#EADFCB",
    prices: { "300": 17.9, "500": 23.9, "700": 29.9 },
    preset: { base: "acai", complements: ["leite-em-po", "morango"], toppings: ["leite-condensado"] },
  },
  {
    id: "nutella",
    name: "Açaí com Nutella",
    description: "Creme de avelã com cacau em espiral, morango e banana para equilibrar.",
    highlights: ["Creme de avelã", "Morango", "Banana"],
    image: img("nutella"),
    tint: "#6B4330",
    prices: { "300": 19.9, "500": 26.9, "700": 33.9 },
    preset: { base: "acai", complements: ["morango", "banana"], toppings: ["creme-de-avela"] },
  },
  {
    id: "tropical",
    name: "Açaí Tropical",
    description: "Kiwi, manga e banana com um fio de mel. Refrescante e colorido.",
    highlights: ["Kiwi", "Manga", "Banana", "Mel"],
    image: img("tropical"),
    tint: "#FFA51F",
    prices: { "300": 18.9, "500": 24.9, "700": 31.9 },
    preset: { base: "acai", complements: ["kiwi", "manga", "banana"], toppings: ["mel"] },
  },
];

export function sizeLabel(id: SizeId) {
  return SIZES.find((s) => s.id === id)?.label ?? `${id} ml`;
}
