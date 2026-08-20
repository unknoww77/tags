"use client";

import { useEffect, useRef } from "react";
import { parsePageConfig, type SentinelEventType } from "@/lib/page-config";

type Props = {
  pageId: string;
  domain: string;
  configRaw?: unknown;
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

function getClickId(paramName: string) {
  if (typeof window === "undefined") return undefined;
  const search = new URLSearchParams(window.location.search);
  return (
    search.get(paramName) ||
    search.get("clickid") ||
    search.get("click_id") ||
    search.get("cid") ||
    undefined
  );
}

export function sendSentinelEvent(
  pageId: string,
  domain: string,
  eventType: SentinelEventType,
  label: string,
  configRaw?: unknown,
  metadata?: Record<string, unknown>
) {
  const config = parsePageConfig(configRaw).sentinel;
  if (!config?.enabled || !config.apiKey || !config.endpoint) return;

  const payload = {
    pageId,
    domain,
    eventType,
    label,
    endpoint: config.endpoint,
    clickIdParam: config.clickIdParam,
    clickId: getClickId(config.clickIdParam),
    pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
    referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
    metadata,
  };

  void fetch("/api/sentinel/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined);
}

export function TrackingBeacon({ pageId, domain, configRaw }: Props) {
  const sent = useRef(false);
  const selectorBound = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackEvent(pageId, domain, "view");

    const config = parsePageConfig(configRaw).sentinel;
    if (config?.enabled && config.pageviewEnabled) {
      sendSentinelEvent(pageId, domain, "pageview", "Landing Page View", configRaw, {
        path: typeof window !== "undefined" ? window.location.pathname : "/",
      });
    }
  }, [pageId, domain, configRaw]);

  useEffect(() => {
    const config = parsePageConfig(configRaw).sentinel;
    if (!config || !config.enabled || config.selectors.length === 0 || selectorBound.current) return;
    selectorBound.current = true;
    const selectors = config.selectors;

    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      for (const rule of selectors) {
        const matched = target.closest(rule.selector);
        if (!matched) continue;

        sendSentinelEvent(
          pageId,
          domain,
          rule.eventType,
          rule.label || rule.selector,
          configRaw,
          { selector: rule.selector }
        );
        trackEvent(pageId, domain, "cta_click", {
          source: "sentinel_selector",
          selector: rule.selector,
          mappedEvent: rule.eventType,
          label: rule.label || rule.selector,
        });
        break;
      }
    }

    document.addEventListener("click", onClick);
    return () => {
      selectorBound.current = false;
      document.removeEventListener("click", onClick);
    };
  }, [pageId, domain, configRaw]);

  return null;
}
