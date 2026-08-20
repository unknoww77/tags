"use client";

import { useRef } from "react";
import { ASSET, PLANS } from "@/lib/veloe-content";

type Props = {
  ctaHref?: string;
};

export function VeloePlansGrid({ ctaHref = "#funil" }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(delta: number) {
    trackRef.current?.scrollBy({ left: delta * 280, behavior: "smooth" });
  }

  return (
    <section className="vl-section" id="escolha">
      <div className="vl-section-head">
        <div className="vl-section-title-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${ASSET}/img-simplifique.png`} alt="" className="vl-section-deco" />
          <h2 className="vl-title">Escolha como usar Veloe</h2>
        </div>
        <div className="vl-smile" aria-hidden />
      </div>

      <div className="vl-plans-carousel">
        <button
          type="button"
          className="vl-plans-arrow is-prev"
          aria-label="Planos anteriores"
          onClick={() => scroll(-1)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${ASSET}/chevron-left.svg`} alt="" width={24} height={24} />
        </button>

        <div className="vl-plans-track" ref={trackRef}>
          {PLANS.map((plan) => (
            <article key={plan.id} className="vl-plan-card">
              <h3>{plan.title}</h3>
              <p className="vl-plan-sub">{plan.subtitle}</p>
              <p className="vl-plan-note">{plan.priceNote}</p>
              <ul>
                {plan.rows.map((row) => (
                  <li key={row}>{row}</li>
                ))}
              </ul>
              <a
                className="vl-btn vl-plan-cta"
                href={ctaHref}
                style={{ backgroundColor: plan.ctaBg }}
              >
                Peça já
              </a>
            </article>
          ))}
        </div>

        <button
          type="button"
          className="vl-plans-arrow is-next"
          aria-label="Próximos planos"
          onClick={() => scroll(1)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${ASSET}/chevron-right.svg`} alt="" width={24} height={24} />
        </button>
      </div>
    </section>
  );
}
