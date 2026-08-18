import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export const IMPERSONATE_COOKIE = "t1t_impersonate";

export type ImpersonationPayload = {
  tenantId: string;
  userId: string;
  userName: string;
  tenantName: string;
  exp: number;
};

function secret() {
  return env.authSecret();
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function encodeImpersonation(payload: Omit<ImpersonationPayload, "exp">, hours = 8): string {
  const full: ImpersonationPayload = {
    ...payload,
    exp: Date.now() + hours * 60 * 60 * 1000,
  };
  const body = Buffer.from(JSON.stringify(full)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeImpersonation(token: string | undefined | null): ImpersonationPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as ImpersonationPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    if (!payload.tenantId || !payload.userId) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getImpersonation(): Promise<ImpersonationPayload | null> {
  const jar = await cookies();
  return decodeImpersonation(jar.get(IMPERSONATE_COOKIE)?.value);
}

export async function setImpersonationCookie(payload: Omit<ImpersonationPayload, "exp">) {
  const jar = await cookies();
  jar.set(IMPERSONATE_COOKIE, encodeImpersonation(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearImpersonationCookie() {
  const jar = await cookies();
  jar.delete(IMPERSONATE_COOKIE);
}
