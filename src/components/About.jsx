import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../gsapSetup";
import { asset } from "../assetUrl.js";
import { PILLARS } from "../data";
import RevealHeading from "./RevealHeading.jsx";
import RevealText from "./RevealText.jsx";

export default function About() {
  const sectionRef = useRef(null);
  const introRef = useRef(null);
  const pillarsRef = useRef(null);
  const headingRef = useRef(null);
  const eyebrowRef = useRef(null);
  const leadRef = useRef(null);
  const mutedRef = useRef(null);
  const obradorWrapRef = useRef(null);
  const obradorImgRef = useRef(null);
  const pillarImgRefs = useRef([]);

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
          stagger: 0.014,
          ease: "power3.out",
          scrollTrigger: { trigger: introRef.current, start: "top 80%" },
        }
      );

      gsap.fromTo(
        [eyebrowRef.current, mutedRef.current, obradorWrapRef.current],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: introRef.current, start: "top 80%" },
        }
      );

      // curtain wipe: the image reveals from behind a clip-path mask while
      // easing down from a slight overscale — runs everywhere (including
      // phones), it's a one-time transform+clip-path tween, not continuous.
      gsap.fromTo(
        obradorImgRef.current,
        { clipPath: "inset(0% 0% 100% 0%)", scale: 1.14 },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          scale: 1,
          duration: 1.1,
          ease: "power4.out",
          scrollTrigger: { trigger: obradorWrapRef.current, start: "top 85%" },
        }
      );

      gsap.fromTo(
        pillarImgRefs.current,
        { clipPath: "inset(0% 0% 100% 0%)", scale: 1.14 },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          scale: 1,
          duration: 1,
          stagger: 0.1,
          ease: "power4.out",
          scrollTrigger: { trigger: pillarsRef.current, start: "top 85%" },
        }
      );

      gsap.fromTo(
        pillarsRef.current.children,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: pillarsRef.current, start: "top 85%" },
        }
      );

      // continuous scrub parallax — the one effect that keeps running as the
      // user scrolls rather than firing once, so it's the one gated behind
      // prefers-reduced-motion.
      let mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          obradorImgRef.current,
          { yPercent: -9 },
          {
            yPercent: 9,
            ease: "none",
            scrollTrigger: {
              trigger: obradorWrapRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );

        pillarImgRefs.current.forEach((el, i) => {
          if (!el) return;
          const dir = i % 2 === 0 ? 1 : -1;
          gsap.fromTo(
            el,
            { yPercent: -7 * dir },
            {
              yPercent: 7 * dir,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        });
      });
    },
    { scope: sectionRef }
  );

  return (
    <section id="nosotros" className="nosotros-section" ref={sectionRef}>
      <div className="nosotros-inner">

        <div className="nosotros-intro" ref={introRef}>
          <div className="intro-text">
            <div className="eyebrow" ref={eyebrowRef}>Por qué nosotros</div>
            <RevealHeading ref={headingRef} lines={["El pan no es", "un detalle"]} />
            <RevealText
              as="p"
              className="lead"
              ref={leadRef}
              text="Es lo primero y lo último que muerde tu cliente. Desde 2020 amasamos con técnica tradicional e ingredientes selectos, y cada lote sale con el mismo estándar: miga que aguanta, corteza que no se rinde."
            />
            <p className="muted" ref={mutedRef}>Trabajamos solo con hostelería. Eso nos deja tiempo para hacer una sola cosa bien.</p>
          </div>
          <div className="obrador-shot" ref={obradorWrapRef}>
            <img ref={obradorImgRef} src={asset("/uploads/obrador.png")} alt="Obrador de Panes Patagonia" loading="lazy" />
          </div>
        </div>

        <div className="pillars" ref={pillarsRef}>
          {PILLARS.map((p, i) => (
            <div className="pillar" key={p.title}>
              <div className="pillar-img">
                <div className="pillar-img-parallax" ref={(el) => (pillarImgRefs.current[i] = el)}>
                  <img src={p.img} alt={p.title} loading="lazy" />
                </div>
              </div>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
