"use client";

import { useEffect, useState } from "react";
import { ASSET, HERO_SLIDES } from "@/lib/veloe-content";

type Props = {
  ctaHref?: string;
};

export function VeloeHeroCarousel({ ctaHref = "#funil" }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [paused]);

  function go(delta: number) {
    setIndex((i) => (i + delta + HERO_SLIDES.length) % HERO_SLIDES.length);
  }

  return (
    <section
      className="vl-hero"
      aria-roledescription="carousel"
      aria-label="Banners Veloe"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="vl-hero-track">
        {HERO_SLIDES.map((slide, i) => (
          <article
            key={slide.title}
            className={`vl-hero-slide${i === index ? " is-active" : ""}`}
            style={{ backgroundColor: slide.bgColor, color: slide.textColor }}
            aria-hidden={i !== index}
          >
            <div className="vl-hero-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={slide.image} alt="" />
            </div>
            <div className="vl-hero-copy">
              <span className="vl-hero-eyebrow">{slide.eyebrow}</span>
              <h2>{slide.title}</h2>
              <a
                className="vl-btn"
                href={ctaHref}
                style={{ backgroundColor: slide.ctaBg, color: slide.ctaColor }}
              >
                {slide.ctaLabel}
              </a>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        className="vl-hero-arrow is-prev"
        aria-label="Slide anterior"
        onClick={() => go(-1)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${ASSET}/chevron-left.svg`} alt="" width={32} height={32} />
      </button>
      <button
        type="button"
        className="vl-hero-arrow is-next"
        aria-label="Próximo slide"
        onClick={() => go(1)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${ASSET}/chevron-right.svg`} alt="" width={32} height={32} />
      </button>

      <div className="vl-hero-dots" role="tablist" aria-label="Slides">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.title}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Ir para slide ${i + 1}`}
            className={i === index ? "is-active" : undefined}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </section>
  );
}
