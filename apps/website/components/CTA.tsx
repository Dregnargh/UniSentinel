"use client";

import { ArrowRight } from "./icons";

export default function CTA() {
  return (
    <section className="section cta" id="cta">
      <div className="cta__glow" aria-hidden="true" />
      <div className="container cta__inner reveal">
        <p className="eyebrow eyebrow--light">Get started</p>
        <h2 className="cta__title">
          See UniSentinel running on <span className="text-grad">your stack</span>
        </h2>
        <p className="cta__lead">
          Book a 30-minute walkthrough. We&apos;ll map your top frameworks live and show the
          evidence trail your auditors will love.
        </p>
        <form className="cta__form" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            required
            placeholder="Work email"
            aria-label="Work email"
            className="cta__input"
          />
          <button type="submit" className="btn btn-primary">
            Book a demo <ArrowRight size={18} />
          </button>
        </form>
        <p className="cta__fine">No credit card. SOC 2 Type II &amp; ISO 27001 — practising what we sell.</p>
      </div>
    </section>
  );
}
