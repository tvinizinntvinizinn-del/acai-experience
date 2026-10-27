import { site } from "@/config/site";
import { formatPrice } from "./format";
import type { CartItem, Customer } from "@/context/cart-context";

export function buildOrderMessage(items: CartItem[], customer: Customer, total: number) {
  const lines: string[] = [];
  lines.push(`*Novo pedido — ${site.name}*`);
  lines.push("");
  lines.push(`*Cliente:* ${customer.name.trim()}`);
  lines.push(`*Recebimento:* ${customer.mode === "delivery" ? "Entrega" : "Retirada no balcão"}`);
  if (customer.mode === "delivery" && customer.address.trim()) {
    lines.push(`*Endereço:* ${customer.address.trim()}`);
  }
  lines.push("");
  lines.push("*Itens*");
  items.forEach((item, i) => {
    lines.push(`${i + 1}) ${item.qty}x ${item.name} — ${item.sizeLabel}`);
    if (item.baseName) lines.push(`   Base: ${item.baseName}`);
    if (item.complements.length) lines.push(`   Complementos: ${item.complements.join(", ")}`);
    if (item.toppings.length) lines.push(`   Coberturas: ${item.toppings.join(", ")}`);
    if (item.note.trim()) lines.push(`   Obs.: ${item.note.trim()}`);
    lines.push(`   ${formatPrice(item.unitPrice * item.qty)}`);
  });
  lines.push("");
  lines.push(`*Total:* ${formatPrice(total)}${site.demoPrices ? " (valores de demonstração)" : ""}`);
  if (customer.mode === "delivery") lines.push(`_${site.ordering.deliveryNote}_`);
  if (customer.note.trim()) {
    lines.push("");
    lines.push(`*Observações:* ${customer.note.trim()}`);
  }
  return lines.join("\n");
}

export function whatsappUrl(text?: string) {
  const base = `https://wa.me/${site.contact.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
