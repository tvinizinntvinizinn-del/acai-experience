const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatPrice(value: number) {
  return brl.format(value);
}

/** "+ R$ 2,00" para acréscimos; vazio quando grátis. */
export function formatDelta(value: number) {
  return value > 0 ? `+ ${brl.format(value)}` : "";
}

export function pluralize(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}
