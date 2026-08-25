import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../gsapSetup";

export default function Footer() {
  const footerRef = useRef(null);

  useGSAP(
    () => {
      gsap.fromTo(
        footerRef.current.children,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: footerRef.current, start: "top 92%" },
        }
      );
    },
    { scope: footerRef }
  );

  return (
    <footer className="site-footer" ref={footerRef}>
      <div className="footer-brand">Panes Patagonia · España</div>
      <div className="footer-social">
        <a href="https://www.instagram.com/panespatagonia/">Instagram</a>
        <a href="https://www.facebook.com/panespatagonia/">Facebook</a>
      </div>
    </footer>
  );
}
