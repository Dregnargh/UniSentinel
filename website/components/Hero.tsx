"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight } from "./icons";

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => null,
});

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.9 } });
        tl.from(".hero__eyebrow", { y: 20, opacity: 0 })
          .from(".hero__title .line", { yPercent: 110, opacity: 0, stagger: 0.12 }, "-=0.5")
          .from(".hero__lead", { y: 22, opacity: 0 }, "-=0.55")
          .from(".hero__cta > *", { y: 18, opacity: 0, stagger: 0.1 }, "-=0.6")
          .from(".hero__trust", { y: 18, opacity: 0 }, "-=0.5")
          .from(".hero__canvas", { opacity: 0, duration: 1.4 }, 0.2);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section className="hero" id="top" ref={root}>
      <div className="hero__canvas" aria-hidden="true">
        <HeroScene />
      </div>
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__grid" aria-hidden="true" />

      <div className="hero__inner container">
        <p className="hero__eyebrow">
          <span className="hero__pulse" /> Continuous GRC + ERP assurance
        </p>

        <h1 className="hero__title">
          <span className="line">The unified platform for</span>
          <span className="line">
            <span className="text-grad">risk, compliance</span>
          </span>
          <span className="line">&amp; operations.</span>
        </h1>

        <p className="hero__lead">
          UniSentinel brings governance, risk and compliance together with ERP — so every control,
          audit, vendor and transaction lives in one continuously-assured system of record.
        </p>

        <div className="hero__cta">
          <a href="#cta" className="btn btn-primary">
            Book a demo <ArrowRight size={18} />
          </a>
          <a href="#platform" className="btn btn-ghost">
            Explore the platform
          </a>
        </div>

        <div className="hero__trust">
          <span className="hero__trust-label">Built for the frameworks you answer to</span>
          <div className="hero__frameworks">
            {["SOC 2", "ISO 27001", "GDPR", "HIPAA", "PCI DSS", "NIST CSF"].map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="hero__scroll" aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </section>
  );
}
