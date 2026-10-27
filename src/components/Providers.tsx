"use client";

import type { ReactNode } from "react";
import { CartProvider } from "@/context/cart-context";
import { SmoothScrollProvider } from "@/context/smooth-scroll";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SmoothScrollProvider>
      <CartProvider>{children}</CartProvider>
    </SmoothScrollProvider>
  );
}
