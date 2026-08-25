import { useCallback, useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../gsapSetup";
import { BREADS } from "../data";
import { useIsMobile } from "../hooks/useIsMobile";
import { useMagnetic } from "../hooks/useMagnetic";

const AUTO_MS = 4200;
const N = BREADS.length;

// shortest signed distance from `turn` to slot `k` around the N-item loop —
// this is what makes the slider infinite: there's no first/last card, only
// an offset that wraps, so index 0 can sit immediately left of index N-1.
function wrappedOffset(k, turn) {
  let d = k - turn;
  d -= N * Math.round(d / N);
  return d;
}

function slotFor(isMobile) {
  const w = window.innerWidth;
  return isMobile ? Math.min(w * 0.7, 320) : Math.min(w * 0.28, 380);
}

export default function BreadCarousel() {
  const isMobile = useIsMobile();
  const turnRef = useRef(0);
  const autoRef = useRef(true);
  const wasDraggedRef = useRef(false);

  const sectionRef = useRef(null);
  const eyebrowRef = useRef(null);
  const trackRef = useRef(null);
  const cardRefs = useRef([]);
  const imgRefs = useRef([]);
  const copyRefs = useRef([]);
  const prevBtnRef = useRef(null);
  const prevGlyphRef = useRef(null);
  const nextBtnRef = useRef(null);
  const nextGlyphRef = useRef(null);

  useMagnetic(prevBtnRef, 0.4, prevGlyphRef);
  useMagnetic(nextBtnRef, 0.4, nextGlyphRef);

  const renderRef = useRef(() => {});

  const goTo = useCallback((next, manual) => {
    if (manual) autoRef.current = false;
    turnRef.current = next;
    renderRef.current();
  }, []);

  const go = useCallback((dir) => goTo(turnRef.current + dir, true), [goTo]);

  useEffect(() => {
    const id = setInterval(() => {
      if (autoRef.current) goTo(turnRef.current + 1, false);
    }, AUTO_MS);
    return () => clearInterval(id);
  }, [goTo]);

  useGSAP(() => {
    // `turn` can be fractional during a drag preview (`instant: true`) — the
    // cards are tweened straight from wherever GSAP last set them, so a
    // released drag flows into the snap animation with no visual jump.
    const render = (turn = turnRef.current, instant = false) => {
      const slot = slotFor(isMobile);

      for (let k = 0; k < N; k++) {
        const offset = wrappedOffset(k, turn);
        const abs = Math.abs(offset);
        const card = cardRefs.current[k];

        const scale = 1 - Math.min(abs, 1) * 0.2;
        const opacity = abs <= 1 ? 1 - abs * 0.6 : Math.max(0, 0.4 * (2 - abs));
        // xPercent: -50 replaces the old manual `translateX(-50%)` prefix —
        // the CSS `left: 50%` only puts the card's *left edge* at center, so
        // this half-width pullback is what actually centers it.
        const vars = { xPercent: -50, x: offset * slot, scale, opacity, overwrite: "auto" };

        if (instant) {
          gsap.set(card, vars);
        } else {
          gsap.to(card, { ...vars, duration: 0.85, ease: "power3.out" });
        }

        card.style.zIndex = String(10 - Math.round(abs));
        card.style.pointerEvents = abs <= 1 ? "auto" : "none";
        card.classList.toggle("pane-card--active", abs < 0.5);
      }
    };

    renderRef.current = render;
    render();

    let resizeTimer = null;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => render(), 120);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
    };
  }, [isMobile]);

  // Pointer-based drag: track the finger/cursor 1:1 (no easing lag) while the
  // gesture is live, then hand off to the tweened `render()` snap on release.
  // `touch-action: pan-y` in CSS keeps vertical page scroll free without us
  // needing a main-thread `preventDefault`.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let dragging = false;
    let moved = false;
    let lockedAxis = null;
    let startX = 0;
    let startY = 0;
    let rafId = null;
    let pendingTurn = null;

    const applyDragFrame = () => {
      rafId = null;
      if (pendingTurn != null) renderRef.current(pendingTurn, true);
    };

    const onDown = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragging = true;
      moved = false;
      lockedAxis = null;
      startX = e.clientX;
      startY = e.clientY;
      autoRef.current = false;
      gsap.killTweensOf(cardRefs.current);
    };

    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!lockedAxis) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        lockedAxis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (lockedAxis === "x") el.setPointerCapture(e.pointerId);
      }
      if (lockedAxis !== "x") return;

      moved = true;
      pendingTurn = turnRef.current - dx / slotFor(isMobile);
      if (rafId == null) rafId = requestAnimationFrame(applyDragFrame);
    };

    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      if (lockedAxis === "x" && moved) {
        const dx = e.clientX - startX;
        const slot = slotFor(isMobile);
        const threshold = slot * 0.18;
        if (Math.abs(dx) > threshold) {
          goTo(Math.round(turnRef.current - dx / slot), true);
        } else {
          renderRef.current(turnRef.current);
        }
        wasDraggedRef.current = true;
      }
      pendingTurn = null;
      lockedAxis = null;
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [goTo, isMobile]);

  useGSAP(
    () => {
      gsap.fromTo(
        eyebrowRef.current,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
        }
      );

      // each bread photo wipes in behind its own clip-path curtain rather
      // than the whole track fading as one flat block — the carousel's own
      // x/scale positioning stays on the button (.pane-card), untouched by
      // this, since it targets the img/copy inside instead.
      gsap.fromTo(
        imgRefs.current,
        { clipPath: "inset(0% 0% 100% 0%)", scale: 1.15 },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          scale: 1,
          duration: 1,
          stagger: 0.12,
          ease: "power4.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
        }
      );

      gsap.fromTo(
        copyRefs.current,
        { opacity: 0, y: 22 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.12,
          delay: 0.15,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section id="panes" className="panes-section" ref={sectionRef}>
      <div className="panes-inner">
        <div className="eyebrow" ref={eyebrowRef}>Nuestros panes</div>

        <div className="pane-track" ref={trackRef}>
          {BREADS.map((b, i) => (
            <button
              key={b.name}
              ref={(el) => (cardRefs.current[i] = el)}
              className="pane-card"
              onClick={(e) => {
                if (wasDraggedRef.current) {
                  wasDraggedRef.current = false;
                  e.preventDefault();
                  return;
                }
                goTo(i, true);
              }}
              aria-label={b.name}
            >
              <div className="pane-card-media">
                <img ref={(el) => (imgRefs.current[i] = el)} src={b.img} alt={b.name} />
              </div>
              <div className="pane-card-copy" ref={(el) => (copyRefs.current[i] = el)}>
                <h2>{b.name}</h2>
                <p>{b.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button className="wheel-arrow wheel-arrow--prev" ref={prevBtnRef} onClick={() => go(-1)} aria-label="Pan anterior">
        <span className="wheel-arrow-glyph" ref={prevGlyphRef}>←</span>
      </button>
      <button className="wheel-arrow wheel-arrow--next" ref={nextBtnRef} onClick={() => go(1)} aria-label="Siguiente pan">
        <span className="wheel-arrow-glyph" ref={nextGlyphRef}>→</span>
      </button>
    </section>
  );
}
