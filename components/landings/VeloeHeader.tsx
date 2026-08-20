"use client";

import { useEffect, useState } from "react";
import {
  ACCOUNT_LINKS,
  ASSET,
  NAV_DROPDOWNS,
  NAV_LINKS,
} from "@/lib/veloe-content";

export function VeloeHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <>
      <header className="vl-header">
        <div className="vl-header-inner">
          <button
            type="button"
            className="vl-menu-btn"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${ASSET}/icon-menu.svg`} alt="" width={24} height={24} />
          </button>

          <a href="#topo" className="vl-logo" aria-label="Veloe">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="vl-logo-full" src={`${ASSET}/logo.svg`} alt="Veloe" height={38} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="vl-logo-mini" src={`${ASSET}/mini-logo.png`} alt="Veloe" height={32} />
          </a>

          <nav className="vl-nav" aria-label="Menu principal">
            {NAV_DROPDOWNS.map((group) => (
              <div key={group.label} className="vl-nav-dropdown">
                <span className="vl-nav-label">
                  {group.label}
                  <span className="vl-nav-chevron" aria-hidden />
                </span>
                <ul className="vl-nav-submenu">
                  {group.links.map((link) => (
                    <li key={link}>
                      <a href="#funil">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {NAV_LINKS.map((link) => (
              <a key={link} href="#funil" className="vl-nav-link">
                {link}
              </a>
            ))}
          </nav>

          <div className="vl-header-actions">
            <div className="vl-nav-dropdown vl-account">
              <span className="vl-nav-label">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${ASSET}/icon-user.svg`} alt="" width={24} height={24} />
                Minha conta
                <span className="vl-nav-chevron" aria-hidden />
              </span>
              <ul className="vl-nav-submenu">
                {ACCOUNT_LINKS.map((link) => (
                  <li key={link}>
                    <a href="#funil">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
            <a className="vl-btn vl-header-cta" href="#escolha">
              Quero tag Veloe
            </a>
          </div>

          <div className="vl-header-mobile-cta">
            <a href="#funil" className="vl-nav-link">
              Ativar
            </a>
            <a className="vl-btn vl-header-cta" href="#escolha">
              Quero agora
            </a>
          </div>
        </div>
      </header>

      <div
        className={`vl-drawer-backdrop${menuOpen ? " is-open" : ""}`}
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      />
      <aside className={`vl-drawer${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="vl-drawer-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${ASSET}/logo.svg`} alt="Veloe" height={32} />
          <button type="button" className="vl-drawer-close" onClick={() => setMenuOpen(false)}>
            Fechar
          </button>
        </div>
        <nav className="vl-drawer-nav">
          {NAV_DROPDOWNS.map((group) => (
            <div key={group.label} className="vl-drawer-group">
              <strong>{group.label}</strong>
              {group.links.map((link) => (
                <a key={link} href="#funil" onClick={() => setMenuOpen(false)}>
                  {link}
                </a>
              ))}
            </div>
          ))}
          {NAV_LINKS.map((link) => (
            <a key={link} href="#funil" onClick={() => setMenuOpen(false)}>
              {link}
            </a>
          ))}
          <div className="vl-drawer-group">
            <strong>Minha conta</strong>
            {ACCOUNT_LINKS.map((link) => (
              <a key={link} href="#funil" onClick={() => setMenuOpen(false)}>
                {link}
              </a>
            ))}
          </div>
        </nav>
        <a className="vl-btn vl-drawer-cta" href="#escolha" onClick={() => setMenuOpen(false)}>
          Quero tag Veloe
        </a>
      </aside>
    </>
  );
}

function VeloeSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="vl-section-title-wrap">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${ASSET}/img-simplifique.png`} alt="" className="vl-section-deco" />
      <h2 className="vl-title">{children}</h2>
    </div>
  );
}

export { VeloeSectionTitle };
