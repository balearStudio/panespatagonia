import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../gsapSetup";
import { useIsMobile } from "../hooks/useIsMobile";
import { useMagnetic } from "../hooks/useMagnetic";

export default function Header() {
  const isMobile = useIsMobile();
  const [scrolled, setScrolled] = useState(false);
  const [navHover, setNavHover] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const navRef = useRef(null);
  const navWordRef = useRef(null);
  const navLinksRef = useRef(null);
  const overlayRef = useRef(null);
  const overlayLinksRef = useRef(null);
  const progressRef = useRef(null);
  const ctaRef = useRef(null);

  useMagnetic(ctaRef, 0.3);

  const collapsed = isMobile || (scrolled && !navHover);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useGSAP(() => {
    // nav-word and nav-links sit centered on top of each other (see CSS) so
    // this stays a same-line swap — the links grow outward to both sides
    // from that shared center point, not down into a new row. Only
    // non-transform properties (opacity, maxWidth) are tweened here: both
    // elements are centered via a CSS `transform: translate(-50%, -50%)`,
    // and a GSAP-driven x/y would silently replace that inline and break
    // the centering.
    const linksWidth = navLinksRef.current.scrollWidth;
    gsap.to(navWordRef.current, {
      opacity: collapsed ? 1 : 0,
      duration: 0.32,
      ease: "power2.out",
    });
    gsap.to(navLinksRef.current, {
      opacity: collapsed ? 0 : 1,
      maxWidth: collapsed ? 0 : linksWidth,
      duration: 0.34,
      ease: "power2.out",
      pointerEvents: collapsed ? "none" : "auto",
    });
  }, [collapsed]);

  useGSAP(() => {
    if (!overlayRef.current) return;
    if (overlayOpen) {
      gsap.set(overlayRef.current, { display: "flex" });
      gsap.fromTo(
        overlayRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.35, ease: "power2.out" }
      );
      gsap.fromTo(
        overlayLinksRef.current.children,
        { y: 26, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, delay: 0.1, ease: "power3.out" }
      );
    } else {
      gsap.to(overlayRef.current, {
        autoAlpha: 0,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => gsap.set(overlayRef.current, { display: "none" }),
      });
    }
  }, [overlayOpen]);

  useGSAP(() => {
    gsap.to(progressRef.current, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "max",
        scrub: 0.3,
      },
    });
  }, []);

  return (
    <>
      <div className="scroll-progress" ref={progressRef} />

      <header className="site-header">
        <div className="logo">Patagonia</div>

        <nav
          className="main-nav"
          ref={navRef}
          onMouseEnter={() => !isMobile && setNavHover(true)}
          onMouseLeave={() => setNavHover(false)}
          onClick={() => isMobile && setOverlayOpen(true)}
        >
          <div className="nav-word" ref={navWordRef}>Menú</div>
          <div className="nav-links" ref={navLinksRef}>
            <a href="#panes">Panes</a>
            <a href="#nosotros">Nosotros</a>
            <a href="#contacto">Contacto</a>
          </div>
        </nav>

        <a href="https://wa.me/34611650655" className="nav-cta" ref={ctaRef}>Hablemos</a>
      </header>

      <div
        className="nav-overlay"
        ref={overlayRef}
        onClick={() => setOverlayOpen(false)}
      >
        <div className="nav-overlay-links" ref={overlayLinksRef}>
          <a href="#panes">Panes</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#contacto">Contacto</a>
          <div className="overlay-hint">Toca para cerrar</div>
        </div>
      </div>
    </>
  );
}
