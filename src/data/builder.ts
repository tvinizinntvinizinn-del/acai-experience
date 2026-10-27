/**
 * Opções do montador "Monte seu açaí".
 * Preços DEMONSTRATIVOS — ajuste para os valores reais (veja src/config/site.ts).
 */
import type { SizeId } from "./menu";

export type BaseId = "acai" | "acai-guarana" | "acai-banana" | "cupuacu" | "meio-a-meio";

export type BuilderPreset = {
  base: BaseId;
  complements: string[];
  toppings: string[];
};

/** Preço do copo montado, por tamanho (antes de base, complementos e coberturas). */
export const SIZE_BASE_PRICE: Record<SizeId, number> = {
  "300": 12,
  "500": 16,
  "700": 20,
};

/** Escala visual do copo no preview, por tamanho. */
export const SIZE_PREVIEW_SCALE: Record<SizeId, number> = {
  "300": 0.8,
  "500": 0.9,
  "700": 1,
};

export type BaseOption = {
  id: BaseId;
  name: string;
  description: string;
  price: number;
  /** Render usado no preview. */
  image: string;
};

export const BASES: BaseOption[] = [
  { id: "acai", name: "Açaí puro", description: "Batido grosso, sem mistura.", price: 0, image: "/images/builder/base-acai.webp" },
  { id: "acai-guarana", name: "Açaí com guaraná", description: "Mais doce e energético.", price: 0, image: "/images/builder/base-acai.webp" },
  { id: "acai-banana", name: "Açaí batido com banana", description: "Mais cremoso e suave.", price: 1, image: "/images/builder/base-acai.webp" },
  { id: "cupuacu", name: "Cupuaçu", description: "Creme azedinho e perfumado.", price: 2, image: "/images/builder/base-cupuacu.webp" },
  { id: "meio-a-meio", name: "Meio a meio", description: "Açaí e cupuaçu no mesmo copo.", price: 2, image: "/images/builder/base-mix.webp" },
];

export type ComplementOption = {
  id: string;
  name: string;
  price: number;
  /** Imagem recortada usada nos chips e no preview. */
  sprite: string;
};

export const COMPLEMENTS: ComplementOption[] = [
  { id: "granola", name: "Granola", price: 2, sprite: "/images/ingredients/granola.webp" },
  { id: "banana", name: "Banana", price: 2, sprite: "/images/ingredients/banana-slice.webp" },
  { id: "morango", name: "Morango", price: 3, sprite: "/images/ingredients/strawberry-half.webp" },
  { id: "kiwi", name: "Kiwi", price: 3, sprite: "/images/ingredients/kiwi-slice.webp" },
  { id: "manga", name: "Manga", price: 3, sprite: "/images/ingredients/mango.webp" },
  { id: "leite-em-po", name: "Leite em pó", price: 2.5, sprite: "/images/ingredients/powder.webp" },
  { id: "pacoca", name: "Paçoca", price: 2.5, sprite: "/images/ingredients/pacoca.webp" },
];

export type ToppingOption = {
  id: string;
  name: string;
  price: number;
  /** Cor da calda desenhada no preview. */
  color: string;
  /** Cor do brilho da calda. */
  shine: string;
};

export const TOPPINGS: ToppingOption[] = [
  { id: "leite-condensado", name: "Leite condensado", price: 2, color: "#F2DEB2", shine: "#FFF9EC" },
  { id: "mel", name: "Mel", price: 2, color: "#D98A12", shine: "#FFD27A" },
  { id: "chocolate", name: "Calda de chocolate", price: 2.5, color: "#3A1F14", shine: "#8A5A44" },
  { id: "creme-de-avela", name: "Creme de avelã", price: 4, color: "#5A3420", shine: "#A9775A" },
];

export const LIMITS = {
  complements: 5,
  toppings: 2,
};

export function basePreviewImage(base: BaseId) {
  return BASES.find((b) => b.id === base)?.image ?? BASES[0].image;
}
