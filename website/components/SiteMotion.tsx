"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Global scroll-motion orchestrator. Renders nothing; wires GSAP behaviours to
 * markers in the static markup so sections can stay server-rendered:
 *   .reveal           → fade/slide in on enter (batched + staggered)
 *   [data-count]      → count up to the number when scrolled into view
 *   [data-speed]      → gentle parallax drift on scroll
 * All motion is gated behind `prefers-reduced-motion: no-preference`.
 */
export default function SiteMotion() {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Reveal on scroll
      gsap.set(".reveal", { opacity: 0, y: 30 });
      ScrollTrigger.batch(".reveal", {
        start: "top 86%",
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.09,
            overwrite: true,
          }),
      });

      // Count-up numbers
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const target = parseFloat(el.dataset.count || "0");
        const decimals = (el.dataset.count?.split(".")[1] || "").length;
        const prefix = el.dataset.prefix || "";
        const suffix = el.dataset.suffix || "";
        const obj = { v: 0 };
        ScrollTrigger.create({
          trigger: el,
          start: "top 90%",
          once: true,
          onEnter: () =>
            gsap.to(obj, {
              v: target,
              duration: 1.7,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = prefix + obj.v.toFixed(decimals) + suffix;
              },
            }),
        });
      });

      // Parallax drift
      gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((el) => {
        const speed = parseFloat(el.dataset.speed || "1");
        gsap.to(el, {
          yPercent: speed * -14,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      // Recompute once webfonts settle so triggers line up with final layout.
      if (typeof document !== "undefined" && "fonts" in document) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }
    });

    return () => mm.revert();
  });

  return null;
}
