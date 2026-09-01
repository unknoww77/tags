import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

/** Janela entre criação do lead e confirmação de abertura do WhatsApp. */
export const LEAD_OPENED_TOKEN_TTL_MS = 5 * 60 * 1000;

const TOKEN_VERSION = "v1";
const DOMAIN = "lead-opened";

export type LeadOpenedTokenPayload = {
  leadId: string;
  issuedAt: number;
  expiresAt: number;
};

function signingMaterial(payload: LeadOpenedTokenPayload): string {
  return `${TOKEN_VERSION}|${DOMAIN}|${payload.leadId}|${payload.issuedAt}|${payload.expiresAt}`;
}

function signPayload(payload: LeadOpenedTokenPayload): string {
  return createHmac("sha256", env.authSecret())
    .update(signingMaterial(payload))
    .digest("base64url");
}

/**
 * Token stateless assinado (HMAC) vinculado ao leadId e expiração curta.
 */
export function createLeadOpenedToken(leadId: string): string {
  const issuedAt = Date.now();
  const payload: LeadOpenedTokenPayload = {
    leadId,
    issuedAt,
    expiresAt: issuedAt + LEAD_OPENED_TOKEN_TTL_MS,
  };
  const signature = signPayload(payload);
  const wire = `${payload.leadId}|${payload.issuedAt}|${payload.expiresAt}|${signature}`;
  return Buffer.from(wire, "utf8").toString("base64url");
}

export function verifyLeadOpenedToken(leadId: string, token: string): boolean {
  if (!leadId || !token || token.length > 512) return false;

  try {
    const wire = Buffer.from(token, "base64url").toString("utf8");
    const parts = wire.split("|");
    if (parts.length !== 4) return false;

    const [tokenLeadId, issuedAtStr, expiresAtStr, signature] = parts;
    if (tokenLeadId !== leadId) return false;

    const issuedAt = Number(issuedAtStr);
    const expiresAt = Number(expiresAtStr);
    if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) return false;
    if (Date.now() > expiresAt) return false;

    const payload: LeadOpenedTokenPayload = {
      leadId: tokenLeadId,
      issuedAt,
      expiresAt,
    };

    const expected = signPayload(payload);
    if (signature.length !== expected.length) return false;

    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

/** Aceita conversões públicas apenas em páginas publicadas. */
export function isPageAcceptingPublicLeads(status: string): boolean {
  return status === "published";
}
