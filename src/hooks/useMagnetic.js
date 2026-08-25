import { useEffect } from "react";
import { gsap } from "../gsapSetup";

// `zoneRef` listens for the pointer (the full hit area); `targetRef` defaults
// to the same element but can be a smaller element inside it — e.g. an arrow
// glyph — so the pull doesn't fight a CSS transform the zone already uses for
// its own layout (like a `translateY(-50%)` centering rule, which an inline
// GSAP transform would otherwise silently override).
export function useMagnetic(zoneRef, strength = 0.35, targetRef) {
  useEffect(() => {
    const zone = zoneRef.current;
    const target = targetRef ? targetRef.current : zone;
    if (!zone || !target) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const xTo = gsap.quickTo(target, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(target, "y", { duration: 0.5, ease: "power3.out" });

    const onMove = (e) => {
      const rect = zone.getBoundingClientRect();
      xTo((e.clientX - (rect.left + rect.width / 2)) * strength);
      yTo((e.clientY - (rect.top + rect.height / 2)) * strength);
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    zone.addEventListener("pointermove", onMove);
    zone.addEventListener("pointerleave", onLeave);
    return () => {
      zone.removeEventListener("pointermove", onMove);
      zone.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf(target);
    };
  }, [zoneRef, targetRef, strength]);
}
