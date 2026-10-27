"use client";

import Image from "next/image";
import { useRef } from "react";
import { Camera, Clock, MapPin, MessageCircle } from "lucide-react";
import { copy } from "@/config/copy";
import { isInstagramConfigured, isWhatsAppConfigured, site } from "@/config/site";
import { EASE, gsap } from "@/lib/gsap";
import { useIsoLayoutEffect } from "@/lib/hooks";
import { whatsappUrl } from "@/lib/whatsapp";

export function ContactSection() {
  const rootRef = useRef<HTMLElement>(null);
  const { address, hours } = site.contact;

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-contact-title] [data-line]", { yPercent: 130, duration: 1.2, ease: EASE.out, stagger: 0.12, scrollTrigger: { trigger: root, start: "top 70%", once: true } });
        gsap.fromTo("[data-contact-cup]", { yPercent: 18, rotation: 8 }, { yPercent: -12, rotation: -4, ease: "none", scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="contato" ref={rootRef} data-header="light" aria-labelledby="contato-titulo" className="relative overflow-hidden bg-berry py-24 text-night md:py-36">
      <div className="relative z-10 px-6 md:px-[5vw]">
        <h2 id="contato-titulo" data-contact-title className="type-display whitespace-nowrap text-[clamp(2.6rem,7.2vw,8.5rem)]">
          {copy.contact.title.map((line) => (
            <span key={line} className="line-mask">
              <span data-line className="block">
                {line}
              </span>
            </span>
          ))}
        </h2>
        <p className="mt-6 max-w-[26rem] text-lg text-night/80">{copy.contact.lead}</p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          {isWhatsAppConfigured ? (
            <a href={whatsappUrl(`Olá! Vim pelo site da ${site.name}.`)} target="_blank" rel="noopener noreferrer" className="btn btn-night">
              <MessageCircle aria-hidden="true" className="size-4" /> {copy.contact.whatsapp}
            </a>
          ) : (
            <span className="btn btn-night cursor-not-allowed opacity-60" aria-disabled="true" title="Configure o WhatsApp em src/config/site.ts">
              <MessageCircle aria-hidden="true" className="size-4" /> WhatsApp em breve
            </span>
          )}
          {isInstagramConfigured ? (
            <a href={site.contact.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-outline-night">
              <Camera aria-hidden="true" className="size-4" /> {copy.contact.instagram}
            </a>
          ) : (
            <span className="btn btn-outline-night cursor-not-allowed opacity-60" aria-disabled="true" title="Configure o Instagram em src/config/site.ts">
              <Camera aria-hidden="true" className="size-4" /> Instagram em breve
            </span>
          )}
        </div>

        {(address || hours) && (
          <div className="mt-14 grid max-w-2xl gap-8 sm:grid-cols-2">
            {address && (
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin aria-hidden="true" className="size-4" /> Endereço
                </p>
                <address className="mt-2 not-italic text-night/80">
                  {address.line1}
                  {address.line2 && (
                    <>
                      <br />
                      {address.line2}
                    </>
                  )}
                </address>
                {address.mapsUrl && (
                  <a href={address.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold underline underline-offset-4">
                    Abrir no mapa
                  </a>
                )}
              </div>
            )}
            {hours && (
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Clock aria-hidden="true" className="size-4" /> Horários
                </p>
                <dl className="mt-2 space-y-1 text-night/80">
                  {hours.map((h) => (
                    <div key={h.days} className="flex justify-between gap-6">
                      <dt>{h.days}</dt>
                      <dd className="tabular-nums">{h.time}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        )}
      </div>

      <div aria-hidden="true" className="pointer-events-none relative -mb-40 ml-auto mr-[-8vw] mt-6 w-[76vw] max-w-[26rem] md:absolute md:right-[4vw] md:top-1/2 md:mb-0 md:mr-0 md:mt-0 md:w-[34vw] md:max-w-[34rem] md:-translate-y-1/2">
        <div data-contact-cup>
          <Image src="/images/menu/especial.webp" alt="" width={800} height={1000} sizes="(min-width: 768px) 34vw, 72vw" className="h-auto w-full drop-shadow-[0_40px_50px_rgba(36,13,56,0.35)]" />
        </div>
      </div>
    </section>
  );
}
