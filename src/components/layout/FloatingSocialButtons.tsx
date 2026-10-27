"use client";

import { useEffect, useState } from "react";
import { Camera, MessageCircle } from "lucide-react";
import { isInstagramConfigured, isWhatsAppConfigured, site } from "@/config/site";
import { useCart } from "@/context/cart-context";
import { introActive, menuOpen } from "@/lib/ui-bus";
import { whatsappUrl } from "@/lib/whatsapp";

const isDev = process.env.NODE_ENV === "development";

/**
 * Atalhos flutuantes para WhatsApp e Instagram.
 * Só aparecem para links configurados (em desenvolvimento, os não configurados
 * aparecem tracejados para lembrar de preencher src/config/site.ts).
 * Ficam escondidos no Hero e sobre a barra fixa do montador no mobile.
 */
export function FloatingSocialButtons() {
  const { open: cartOpen } = useCart();
  const [pastHero, setPastHero] = useState(false);
  const [overBuilder, setOverBuilder] = useState(false);
  const [intro, setIntro] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => introActive.subscribe(setIntro), []);
  useEffect(() => menuOpen.subscribe(setMenu), []);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setPastHero(window.scrollY > window.innerHeight * 0.8));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const builder = document.getElementById("monte-seu-acai");
    const io = new IntersectionObserver(([e]) => setOverBuilder(e.isIntersecting), { rootMargin: "-20% 0px -20% 0px" });
    if (builder) io.observe(builder);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  const showWa = isWhatsAppConfigured || isDev;
  const showIg = isInstagramConfigured || isDev;
  if (!showWa && !showIg) return null;

  const visible = pastHero && !overBuilder && !intro && !menu && !cartOpen;

  return (
    <div className={`fixed bottom-5 right-5 z-[70] flex flex-col gap-3 transition-[opacity,translate,visibility] duration-500 ease-out-expo md:bottom-8 md:right-8 ${visible ? "visible translate-y-0 opacity-100" : "invisible translate-y-4 opacity-0"}`}>
      {showIg && (
        <a
          href={isInstagramConfigured ? site.contact.instagram : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={isInstagramConfigured ? `Instagram ${site.contact.instagramHandle}`.trim() : "Instagram (não configurado)"}
          title={isInstagramConfigured ? "Instagram" : "Configure o Instagram em src/config/site.ts"}
          aria-disabled={!isInstagramConfigured}
          className={`grid size-14 place-items-center rounded-full bg-night text-cream shadow-[0_10px_30px_rgba(36,13,56,0.35)] transition-transform hover:scale-105 active:scale-95 ${isInstagramConfigured ? "" : "pointer-events-none border-2 border-dashed border-cream/50 opacity-60"}`}
        >
          <Camera aria-hidden="true" className="size-6" />
        </a>
      )}
      {showWa && (
        <a
          href={isWhatsAppConfigured ? whatsappUrl(`Olá! Vim pelo site da ${site.name}.`) : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={isWhatsAppConfigured ? "Conversar no WhatsApp" : "WhatsApp (não configurado)"}
          title={isWhatsAppConfigured ? "WhatsApp" : "Configure o WhatsApp em src/config/site.ts"}
          aria-disabled={!isWhatsAppConfigured}
          className={`grid size-14 place-items-center rounded-full bg-berry text-night shadow-[0_10px_30px_rgba(244,84,162,0.4)] transition-transform hover:scale-105 active:scale-95 ${isWhatsAppConfigured ? "" : "pointer-events-none border-2 border-dashed border-night/50 opacity-60"}`}
        >
          <MessageCircle aria-hidden="true" className="size-6" />
        </a>
      )}
    </div>
  );
}
