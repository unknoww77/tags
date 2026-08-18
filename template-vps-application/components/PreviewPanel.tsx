"use client";

import { useMemo, useState } from "react";

type Props = {
  slug: string;
  platformDomain: string;
  appUrl: string;
};

export function PreviewPanel({ slug, platformDomain, appUrl }: Props) {
  const [withUtm, setWithUtm] = useState(true);

  const previewUrl = useMemo(() => {
    const base =
      typeof window !== "undefined" && window.location.hostname === "localhost"
        ? `${window.location.origin}/site/${slug}`
        : `https://${slug}.${platformDomain}`;
    if (!withUtm) return base;
    const u = new URL(base, appUrl);
    u.searchParams.set("utm_source", "preview");
    u.searchParams.set("utm_medium", "dashboard");
    u.searchParams.set("utm_campaign", "teste");
    return u.toString();
  }, [slug, platformDomain, appUrl, withUtm]);

  return (
    <div className="preview-panel">
      <div className="selector-row wrap" style={{ marginBottom: 12 }}>
        <a className="cta-btn" href={previewUrl} target="_blank" rel="noreferrer">
          Abrir preview
        </a>
        <button
          type="button"
          className={`selector-btn${withUtm ? " is-active" : ""}`}
          onClick={() => setWithUtm((v) => !v)}
        >
          UTMs de teste {withUtm ? "ON" : "OFF"}
        </button>
      </div>
      <p className="muted tiny" style={{ wordBreak: "break-all" }}>
        {previewUrl}
      </p>
      <div className="preview-frame-wrap">
        <iframe title="Preview da landing" src={previewUrl} className="preview-frame" />
      </div>
    </div>
  );
}
