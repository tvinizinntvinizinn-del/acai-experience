"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SkipForward } from "lucide-react";
import { copy } from "@/config/copy";
import { useSmoothScroll } from "@/context/smooth-scroll";
import { EASE, gsap } from "@/lib/gsap";
import { createStage, setStage } from "@/lib/stage";
import { getFrameSet, pickVariant } from "@/lib/sequence";
import { introActive } from "@/lib/ui-bus";
import { AcaiCanvas } from "@/components/experience/AcaiCanvas";

const SEEN_KEY = "acai-intro-seen";

/**
 * Intro cinematográfica: gota → queda em câmera lenta → onda roxa → o copo
 * surge da onda girando sob luz lateral → frases → a câmera se afasta e o copo
 * pousa exatamente na posição do Hero (técnica FLIP).
 *
 * Não bloqueia o carregamento: o site já está renderizado por baixo. Pode ser
 * pulada (botão ou Esc), roda uma vez por sessão e é ignorada com
 * prefers-reduced-motion (decisão tomada no <head>, sem piscar).
 */
export function IntroAnimation() {
  const rootRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const stageRef = useRef(createStage({ frame: 46 }));
  const [done, setDone] = useState(false);
  const { lock, unlock } = useSmoothScroll();

  const skip = useCallback(() => {
    const tl = tlRef.current;
    if (!tl) return;
    const handoff = tl.labels.handoff ?? 0;
    if (tl.time() < handoff) tl.seek(handoff);
    tl.timeScale(1.6);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const html = document.documentElement;

    let locked = false;
    const release = () => {
      if (locked) {
        locked = false;
        unlock();
      }
    };

    const finish = () => {
      release();
      try {
        window.sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* sem sessionStorage */
      }
      html.dataset.intro = "done";
      introActive.set(false);
      setDone(true);
    };

    if (html.dataset.intro !== "play" || window.scrollY > 40) {
      // Nada a fazer: garante que o Hero apareça.
      if (html.dataset.intro === "play") {
        introActive.set(true);
        finish();
      }
      return;
    }

    introActive.set(true);
    lock();
    locked = true;
    window.scrollTo(0, 0);

    const stage = stageRef.current;
    const spin = getFrameSet("spin", pickVariant());
    spin.load();

    const q = gsap.utils.selector(root);
    const ctx = gsap.context(() => {
      const drop = q('[data-intro="drop"]');
      const dropWrap = q('[data-intro="drop-wrap"]');
      const ripples = q('[data-intro="ripple"]');
      const wave = q('[data-intro="wave"]');
      const crown = q('[data-intro="crown"]');
      const cup = q('[data-intro="cup"]')[0] as HTMLElement;
      const cupMask = q('[data-intro="cup-mask"]');
      const t1 = q('[data-intro="t1"] [data-line]');
      const t2 = q('[data-intro="t2"] [data-line]');
      const bg = q('[data-intro="bg"]');
      const skipBtn = q('[data-intro="skip"]');
      const proxy = { frame: 46, sweep: -1 };
      const sync = () => setStage(stage, { frame: proxy.frame, sweep: proxy.sweep });

      gsap.set(t1, { yPercent: 130 });
      gsap.set(t2, { yPercent: 130 });
      gsap.set(cup, { yPercent: 62, scale: 0.86 });
      gsap.set(ripples, { scale: 0, autoAlpha: 0, transformOrigin: "50% 50%" });
      gsap.set(wave, { scaleY: 0, transformOrigin: "50% 100%" });
      gsap.set(crown, { autoAlpha: 0 });

      const tl = gsap.timeline({ paused: true, onComplete: finish });
      tlRef.current = tl;

      // 1. A gota aparece flutuando e a câmera se aproxima.
      tl.fromTo(drop, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.9, ease: EASE.out }, 0.1);
      tl.to(drop, { y: -10, duration: 0.8, ease: EASE.inOut, yoyo: true, repeat: 1 }, 0.2);
      tl.to(dropWrap, { scale: 1.9, duration: 1.4, ease: "sine.inOut" }, 0.4);
      tl.fromTo(skipBtn, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 0.6);

      // 2. Queda em câmera lenta.
      tl.to(dropWrap, { y: () => window.innerHeight * 0.24, duration: 0.95, ease: "power2.in" }, 1.75);
      tl.to(drop, { scaleY: 1.18, scaleX: 0.9, duration: 0.95, ease: "power2.in" }, 1.75);
      tl.addLabel("impact", 2.7);

      // 3. Impacto: ondas, coroa e o líquido roxo subindo.
      tl.to(drop, { autoAlpha: 0, duration: 0.08 }, "impact");
      tl.to(ripples, { scale: 1, autoAlpha: 1, duration: 0.25, stagger: 0.16, ease: "power1.out" }, "impact");
      tl.to(ripples, { scale: 2.2, autoAlpha: 0, duration: 1.7, stagger: 0.16, ease: "power2.out" }, "impact+=0.2");
      tl.to(crown, { autoAlpha: 1, duration: 0.1 }, "impact");
      crown.forEach((el, i) => {
        const dir = i % 2 ? 1 : -1;
        const spread = 30 + (i % 3) * 26;
        tl.fromTo(el, { x: 0, y: 0, scale: 1 }, { x: dir * spread, y: -(70 + (i % 4) * 30), duration: 0.45, ease: "power2.out" }, "impact");
        tl.to(el, { y: 30, scale: 0.4, autoAlpha: 0, duration: 0.5, ease: "power2.in" }, "impact+=0.45");
      });
      tl.to(wave, { scaleY: 1, duration: 0.7, ease: "power3.out" }, "impact+=0.05");
      tl.to(wave, { scaleY: 0.12, duration: 1.2, ease: "power2.inOut" }, "impact+=0.9");

      // 4. O copo surge da onda, girando sob luz lateral.
      tl.to(cup, { yPercent: 0, scale: 1, duration: 1.5, ease: "expo.out" }, "impact+=0.25");
      tl.to(cupMask, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "power2.out" }, "impact+=0.25");
      tl.to(proxy, { frame: 60, duration: 3.1, ease: "power1.inOut", onUpdate: sync }, "impact+=0.25");
      tl.fromTo(proxy, { sweep: 0 }, { sweep: 1, duration: 2.2, ease: "sine.inOut", onUpdate: sync, immediateRender: false }, "impact+=0.6");

      // 5. Frases.
      tl.to(t1, { yPercent: 0, duration: 0.9, ease: EASE.out, stagger: 0.08 }, "impact+=0.9");
      tl.to(t1, { yPercent: -130, duration: 0.55, ease: EASE.in }, "impact+=2.3");
      tl.to(t2, { yPercent: 0, duration: 0.9, ease: EASE.out, stagger: 0.08 }, "impact+=2.55");
      tl.addLabel("handoff", "impact+=3.75");

      // 6. A câmera se afasta: o copo pousa no lugar do copo do Hero e o fundo se abre.
      tl.to(t2, { yPercent: -130, duration: 0.6, ease: EASE.in }, "handoff");
      tl.to(skipBtn, { autoAlpha: 0, duration: 0.3 }, "handoff");
      tl.to(
        cup,
        {
          x: () => flip(cup).x,
          y: () => flip(cup).y,
          scale: () => flip(cup).scale,
          yPercent: 0,
          duration: 1.25,
          ease: "power3.inOut",
        },
        "handoff",
      );
      tl.to(bg, { autoAlpha: 0, duration: 0.9, ease: "power2.inOut" }, "handoff+=0.4");
      tl.to(wave, { autoAlpha: 0, duration: 0.5 }, "handoff");
      tl.to(cup, { autoAlpha: 0, duration: 0.25 }, "handoff+=1.2");
    }, root);

    // Espera o primeiro frame (no máximo 1,4 s) para começar — o copo precisa estar pronto no impacto.
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      tlRef.current?.play();
    };
    const unsub = spin.subscribe(() => {
      if (spin.loadedCount >= 6) start();
    });
    const fallback = window.setTimeout(start, 1400);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      unsub();
      window.clearTimeout(fallback);
      window.removeEventListener("keydown", onKey);
      ctx.revert();
      release();
      // Em desenvolvimento (StrictMode monta duas vezes) a intro reinicia do zero.
      if (introActive.get()) introActive.set(false);
    };
  }, [lock, unlock, skip]);

  if (done) return null;

  return (
    <div ref={rootRef} className="intro-overlay fixed inset-0 z-[100] overflow-hidden" role="presentation">
      <div data-intro="bg" className="absolute inset-0 bg-night">
        <div className="absolute inset-0" style={{ background: "radial-gradient(55% 45% at 50% 58%, rgba(129,55,200,0.35), transparent 70%)" }} />
      </div>

      {/* Superfície do líquido e ondas */}
      <svg aria-hidden="true" className="absolute left-1/2 top-[64%] h-[30vh] w-[160vw] -translate-x-1/2 -translate-y-1/2 overflow-visible" viewBox="-800 -150 1600 300">
        <defs>
          <radialGradient id="intro-wave" cx="50%" cy="100%" r="70%">
            <stop offset="0%" stopColor="#8137C8" />
            <stop offset="60%" stopColor="#4B1768" />
            <stop offset="100%" stopColor="#240D38" stopOpacity="0" />
          </radialGradient>
        </defs>
        {[0, 1, 2].map((i) => (
          <ellipse key={i} data-intro="ripple" cx={0} cy={0} rx={220 + i * 40} ry={34 + i * 6} fill="none" stroke="#B98BEA" strokeOpacity={0.55 - i * 0.12} strokeWidth={2.2 - i * 0.5} />
        ))}
        <path data-intro="wave" d="M-420 0 C -250 0, -150 -120, 0 -130 C 150 -120, 250 0, 420 0 Z" fill="url(#intro-wave)" />
      </svg>

      {/* Coroa de gotículas */}
      <div aria-hidden="true" className="absolute left-1/2 top-[64%]">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} data-intro="crown" className="absolute block rounded-full bg-[#5a1d80]" style={{ width: 6 + (i % 3) * 4, height: 6 + (i % 3) * 4, boxShadow: "inset -1px -2px 2px rgba(0,0,0,.35), inset 1px 1px 2px rgba(255,255,255,.35)" }} />
        ))}
      </div>

      {/* A gota */}
      <div data-intro="drop-wrap" aria-hidden="true" className="absolute left-1/2 top-[40%] w-[3.2rem] -translate-x-1/2 -translate-y-1/2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img data-intro="drop" src="/images/ingredients/acai-drop.webp" alt="" width={512} height={512} className="invisible h-auto w-full opacity-0" />
      </div>

      {/* O copo (mesmo renderizador do Hero) */}
      <div data-intro="cup-mask" aria-hidden="true" className="absolute inset-0" style={{ clipPath: "inset(0% 0% 36% 0%)" }}>
        <div className="absolute left-1/2 top-[47%] aspect-[4/5] h-[min(56svh,120vw)] -translate-x-1/2 -translate-y-1/2">
          <div data-intro="cup" className="absolute inset-0">
            <AcaiCanvas stage={stageRef.current} poster={false} extras={false} className="stage-feather h-full w-full" />
          </div>
        </div>
      </div>

      {/* Frases */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-[5svh] px-6 text-center text-cream">
        <p data-intro="t1" className="type-display text-intro absolute inset-x-0 bottom-0">
          <span className="line-mask">
            <span data-line className="block">
              {copy.intro.first}
            </span>
          </span>
        </p>
        <p data-intro="t2" className="type-display text-intro">
          <span className="line-mask">
            <span data-line className="block">
              {copy.intro.second}
            </span>
          </span>
        </p>
      </div>

      <p className="sr-only" aria-live="polite">
        {copy.intro.first} {copy.intro.second}
      </p>

      <button
        type="button"
        data-intro="skip"
        onClick={skip}
        className="invisible absolute bottom-5 right-5 inline-flex items-center gap-2 rounded-full border border-cream/25 px-4 py-2.5 text-sm text-cream/85 opacity-0 transition-colors hover:bg-cream/10 md:bottom-8 md:right-8"
      >
        {copy.intro.skip}
        <SkipForward aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}

/** Deslocamento/escala para o copo da intro pousar sobre o copo do Hero. */
function flip(el: HTMLElement) {
  const target = document.querySelector<HTMLElement>('[data-exp="stage"]');
  if (!target) return { x: 0, y: 0, scale: 1 };
  const a = el.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  // `a` já inclui a transformação atual; normaliza para a caixa sem transformação.
  const current = gsap.getProperty(el, "scale") as number;
  const cx = gsap.getProperty(el, "x") as number;
  const cy = gsap.getProperty(el, "y") as number;
  const baseW = a.width / current;
  const baseCx = a.left + a.width / 2 - cx;
  const baseCy = a.top + a.height / 2 - cy;
  return {
    x: b.left + b.width / 2 - baseCx,
    y: b.top + b.height / 2 - baseCy,
    scale: b.width / baseW,
  };
}
