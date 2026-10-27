export type Ingredient = {
  id: "acai" | "morango" | "banana" | "granola" | "leite-condensado";
  name: string;
  description: string;
};

/** Ordem = ordem em que as camadas entram na seção de ingredientes. */
export const INGREDIENTS: Ingredient[] = [
  {
    id: "acai",
    name: "Açaí",
    description: "A base de tudo: gelado, denso e cremoso, com aquele roxo que pinta a colher.",
  },
  {
    id: "morango",
    name: "Morango",
    description: "Suculento e levemente ácido — o contraste que deixa o açaí ainda mais gostoso.",
  },
  {
    id: "banana",
    name: "Banana",
    description: "Doce na medida e macia. Combina com qualquer cobertura.",
  },
  {
    id: "granola",
    name: "Granola",
    description: "Crocância em toda colherada, do topo até o fundo do copo.",
  },
  {
    id: "leite-condensado",
    name: "Leite condensado",
    description: "O fio que escorre pela borda e amarra todos os sabores.",
  },
];
