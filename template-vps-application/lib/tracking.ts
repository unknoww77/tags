import { createHash } from "crypto";
import { headers } from "next/headers";
import { env } from "@/lib/env";

export function hashIp(ip: string): string {
  return createHash("sha256").update(`${ip}:${env.trackingSalt()}`).digest("hex");
}

export function detectDevice(ua: string | null): string {
  if (!ua) return "unknown";
  const lower = ua.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod/.test(lower)) return "mobile";
  if (/tablet/.test(lower)) return "tablet";
  return "desktop";
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "0.0.0.0";
  return h.get("x-real-ip") || "0.0.0.0";
}

export type UtmParams = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
};

export function pickUtms(input: Record<string, unknown>): UtmParams {
  const str = (k: string) => {
    const v = input[k];
    return typeof v === "string" && v.length > 0 ? v.slice(0, 200) : null;
  };
  return {
    utmSource: str("utm_source") ?? str("utmSource"),
    utmMedium: str("utm_medium") ?? str("utmMedium"),
    utmCampaign: str("utm_campaign") ?? str("utmCampaign"),
    utmContent: str("utm_content") ?? str("utmContent"),
    utmTerm: str("utm_term") ?? str("utmTerm"),
  };
}

const rateMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 60, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || entry.resetAt < now) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}
