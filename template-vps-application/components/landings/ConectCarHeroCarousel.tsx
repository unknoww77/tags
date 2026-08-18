"use client";

import { useEffect, useState } from "react";

const BANNERS = [
  { src: "/brands/conectcar/banners/01-plano-completo.png", alt: "Tag no Plano Completo com 12 meses grátis" },
  { src: "/brands/conectcar/banners/02-master-driver.png", alt: "Master Driver ConectCar" },
  { src: "/brands/conectcar/banners/03-mgm.png", alt: "Indique e ganhe ConectCar" },
  { src: "/brands/conectcar/banners/04-plano-basico.png", alt: "Plano Básico ConectCar" },
  { src: "/brands/conectcar/banners/05-freeflow.webp", alt: "Free Flow ConectCar" },
  { src: "/brands/conectcar/banners/06-nova-home.gif", alt: "ConectCar — pode ir tranquilo" },
];

type Props = {
  ctaHref?: string;
};

export function ConectCarHeroCarousel({ ctaHref = "#funil" }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % BANNERS.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [paused]);

  function go(delta: number) {
    setIndex((i) => (i + delta + BANNERS.length) % BANNERS.length);
  }

  return (
    <section
      className="cc-hero-carousel"
      aria-roledescription="carousel"
      aria-label="Banners"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="cc-hero-track">
        {BANNERS.map((banner, i) => (
          <a
            key={banner.src}
            href={ctaHref}
            className={`cc-hero-slide${i === index ? " is-active" : ""}`}
            aria-hidden={i !== index}
            tabIndex={i === index ? 0 : -1}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={banner.src} alt={banner.alt} />
          </a>
        ))}
      </div>

      <button
        type="button"
        className="cc-hero-arrow is-prev"
        aria-label="Previous slide"
        onClick={() => go(-1)}
      >
        ‹
      </button>
      <button
        type="button"
        className="cc-hero-arrow is-next"
        aria-label="Next slide"
        onClick={() => go(1)}
      >
        ›
      </button>

      <div className="cc-hero-dots" role="tablist" aria-label="Slides">
        {BANNERS.map((banner, i) => (
          <button
            key={banner.src}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Go to slide ${i + 1}`}
            className={i === index ? "is-active" : undefined}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </section>
  );
}
