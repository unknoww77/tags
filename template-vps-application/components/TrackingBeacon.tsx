"use client";

import { useEffect, useRef } from "react";

type Props = {
  pageId: string;
  domain: string;
};

function getUtms() {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source: p.get("utm_source") || undefined,
    utm_medium: p.get("utm_medium") || undefined,
    utm_campaign: p.get("utm_campaign") || undefined,
    utm_content: p.get("utm_content") || undefined,
    utm_term: p.get("utm_term") || undefined,
  };
}

export function trackEvent(
  pageId: string,
  domain: string,
  eventType: "view" | "cta_click" | "lead" | "chat_start",
  meta?: Record<string, unknown>
) {
  const payload = {
    pageId,
    domain,
    eventType,
    path: typeof window !== "undefined" ? window.location.pathname : "/",
    referrer: typeof document !== "undefined" ? document.referrer || null : null,
    ...getUtms(),
    meta,
  };

  void fetch("/api/t", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined);
}

export function TrackingBeacon({ pageId, domain }: Props) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackEvent(pageId, domain, "view");
  }, [pageId, domain]);

  return null;
}
