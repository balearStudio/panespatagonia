import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../gsapSetup";
import { useMagnetic } from "../hooks/useMagnetic";
import RevealHeading from "./RevealHeading.jsx";
import RevealText from "./RevealText.jsx";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const sectionRef = useRef(null);
  const infoRef = useRef(null);
  const headingRef = useRef(null);
  const leadRef = useRef(null);
  const formWrapRef = useRef(null);
  const btnRef = useRef(null);

  useMagnetic(btnRef, 0.25);

  useGSAP(
    () => {
      gsap.fromTo(
        headingRef.current.querySelectorAll(".word-inner"),
        { yPercent: 130, rotateZ: 5 },
        {
          yPercent: 0,
          rotateZ: 0,
          duration: 0.85,
          stagger: 0.05,
          ease: "power4.out",
          scrollTrigger: { trigger: headingRef.current, start: "top 88%" },
        }
      );

      gsap.fromTo(
        leadRef.current.querySelectorAll(".word-inner"),
        { yPercent: 115, rotateZ: 3 },
        {
          yPercent: 0,
          rotateZ: 0,
          duration: 0.6,
          stagger: 0.016,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
        }
      );

      gsap.fromTo(
        [infoRef.current, formWrapRef.current],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
        }
      );

      // subtle drift between the two columns as the section scrolls by —
      // continuous, so gated behind prefers-reduced-motion.
      let mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          infoRef.current,
          { yPercent: -4 },
          {
            yPercent: 4,
            ease: "none",
            scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: true },
          }
        );
        gsap.fromTo(
          formWrapRef.current,
          { yPercent: 4 },
          {
            yPercent: -4,
            ease: "none",
            scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: true },
          }
        );
      });
    },
    { scope: sectionRef }
  );

  const onSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    gsap.fromTo(
      btnRef.current,
      { scale: 1 },
      { scale: 1.04, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" }
    );
  };

  return (
    <section id="contacto" className="contact-section" ref={sectionRef}>
      <div className="contact-inner">

        <div className="contact-info" ref={infoRef}>
          <div className="eyebrow">Sin compromiso</div>
          <RevealHeading ref={headingRef} lines={["Pregunta", "lo que sea"]} />
          <RevealText
            as="p"
            className="lead"
            ref={leadRef}
            text="No necesitas saber cantidades ni fechas. Cuéntanos qué sirves y te decimos qué pan encaja. Si quieres probarlo antes, te mandamos muestras."
          />
          <div className="contact-links">
            <a href="https://wa.me/34611650655">WhatsApp · +34 611 650 655</a>
            <a href="mailto:panespatagonia@gmail.com">panespatagonia@gmail.com</a>
            <a href="https://www.instagram.com/panespatagonia/">Instagram · @panespatagonia</a>
          </div>
        </div>

        <div className="contact-form-wrap" ref={formWrapRef}>
          <form className="contact-form" onSubmit={onSubmit}>
            <input name="nombre" placeholder="Nombre y negocio" required />
            <input name="email" type="email" placeholder="Email" required />
            <input name="tel" placeholder="Teléfono" />
            <textarea name="msg" rows={3} placeholder="¿Qué te gustaría saber?" />
            <button type="submit" ref={btnRef}>
              {sent ? "Gracias, te escribimos" : "Enviar"}
            </button>
          </form>
          <p className="form-note">Solo usamos estos datos para responderte. Nada más.</p>
        </div>

      </div>
    </section>
  );
}
