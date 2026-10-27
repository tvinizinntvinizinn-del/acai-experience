"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import type { SizeId } from "@/data/menu";

export type CartItem = {
  /** Identidade da linha: mesmo produto + mesmas escolhas = soma quantidade. */
  key: string;
  productId: string | null;
  name: string;
  sizeId: SizeId;
  sizeLabel: string;
  baseName: string | null;
  complements: string[];
  toppings: string[];
  unitPrice: number;
  qty: number;
  note: string;
  image: string;
};

export type Customer = {
  name: string;
  mode: "pickup" | "delivery";
  address: string;
  note: string;
};

type State = { items: CartItem[]; customer: Customer; open: boolean; hydrated: boolean };

type Action =
  | { type: "hydrate"; items: CartItem[]; customer: Partial<Customer> }
  | { type: "add"; item: Omit<CartItem, "key" | "qty"> & { qty?: number } }
  | { type: "remove"; key: string }
  | { type: "qty"; key: string; qty: number }
  | { type: "note"; key: string; note: string }
  | { type: "customer"; patch: Partial<Customer> }
  | { type: "clear" }
  | { type: "open"; open: boolean };

const STORAGE_KEY = "acai-experience:cart:v1";

const defaultCustomer: Customer = { name: "", mode: "pickup", address: "", note: "" };

function lineKey(item: Omit<CartItem, "key" | "qty">) {
  return [item.productId ?? "custom", item.name, item.sizeId, item.baseName ?? "", item.complements.join("+"), item.toppings.join("+"), item.note].join("|");
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...state, items: action.items, customer: { ...state.customer, ...action.customer }, hydrated: true };
    case "add": {
      const { qty = 1, ...rest } = action.item;
      const key = lineKey(rest);
      const existing = state.items.find((i) => i.key === key);
      const items = existing
        ? state.items.map((i) => (i.key === key ? { ...i, qty: Math.min(99, i.qty + qty) } : i))
        : [...state.items, { ...rest, key, qty }];
      return { ...state, items };
    }
    case "remove":
      return { ...state, items: state.items.filter((i) => i.key !== action.key) };
    case "qty":
      return {
        ...state,
        items: action.qty <= 0 ? state.items.filter((i) => i.key !== action.key) : state.items.map((i) => (i.key === action.key ? { ...i, qty: Math.min(99, action.qty) } : i)),
      };
    case "note":
      return { ...state, items: state.items.map((i) => (i.key === action.key ? { ...i, note: action.note } : i)) };
    case "customer":
      return { ...state, customer: { ...state.customer, ...action.patch } };
    case "clear":
      return { ...state, items: [] };
    case "open":
      return { ...state, open: action.open };
    default:
      return state;
  }
}

type CartContextValue = {
  items: CartItem[];
  customer: Customer;
  open: boolean;
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "key" | "qty"> & { qty?: number }) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  setNote: (key: string, note: string) => void;
  setCustomer: (patch: Partial<Customer>) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], customer: defaultCustomer, open: false, hydrated: false });
  const skipFirstSave = useRef(true);

  // Carrega o carrinho salvo (apenas no browser, depois da hidratação).
  useEffect(() => {
    let items: CartItem[] = [];
    let customer: Partial<Customer> = {};
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { items?: CartItem[]; customer?: Partial<Customer> };
        if (Array.isArray(parsed.items)) items = parsed.items.filter((i) => i && typeof i.key === "string" && typeof i.unitPrice === "number");
        if (parsed.customer && typeof parsed.customer === "object") customer = parsed.customer;
      }
    } catch {
      /* armazenamento indisponível: segue com carrinho vazio */
    }
    dispatch({ type: "hydrate", items, customer });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: state.items, customer: state.customer }));
    } catch {
      /* ignora: modo privado, cota cheia etc. */
    }
  }, [state.items, state.customer, state.hydrated]);

  const add = useCallback<CartContextValue["add"]>((item) => dispatch({ type: "add", item }), []);
  const remove = useCallback((key: string) => dispatch({ type: "remove", key }), []);
  const setQty = useCallback((key: string, qty: number) => dispatch({ type: "qty", key, qty }), []);
  const setNote = useCallback((key: string, note: string) => dispatch({ type: "note", key, note }), []);
  const setCustomer = useCallback((patch: Partial<Customer>) => dispatch({ type: "customer", patch }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const setOpen = useCallback((open: boolean) => dispatch({ type: "open", open }), []);

  const value = useMemo<CartContextValue>(() => {
    const count = state.items.reduce((n, i) => n + i.qty, 0);
    const subtotal = state.items.reduce((n, i) => n + i.qty * i.unitPrice, 0);
    return { items: state.items, customer: state.customer, open: state.open, count, subtotal, add, remove, setQty, setNote, setCustomer, clear, setOpen };
  }, [state.items, state.customer, state.open, add, remove, setQty, setNote, setCustomer, clear, setOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return ctx;
}
