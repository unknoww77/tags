"use client";

import { trackEvent } from "@/components/TrackingBeacon";

type Props = {
  pageId: string;
  domain: string;
  href: string;
  label: string;
};

export function CtaButton({ pageId, domain, href, label }: Props) {
  return (
    <a
      className="cta-btn"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent(pageId, domain, "cta_click")}
    >
      {label}
    </a>
  );
}
