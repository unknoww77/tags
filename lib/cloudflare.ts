import { env } from "@/lib/env";

type CfError = { code: number; message: string };
type CfResponse<T> = { success: boolean; errors: CfError[]; result: T };

export type CloudflareZone = {
  id: string;
  name: string;
  status: string;
  name_servers: string[];
};

const API = "https://api.cloudflare.com/client/v4";

async function cfFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = env.cloudflareApiToken();
  if (!token) {
    throw new Error("CLOUDFLARE_API_TOKEN não configurado");
  }

  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = (await res.json()) as CfResponse<T>;
  if (!res.ok || !data.success) {
    const msg = data.errors?.map((e) => e.message).join("; ") || `Cloudflare HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data.result;
}

export async function createZone(hostname: string): Promise<CloudflareZone> {
  const accountId = env.cloudflareAccountId();
  if (!accountId) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID não configurado");
  }

  return cfFetch<CloudflareZone>("/zones", {
    method: "POST",
    body: JSON.stringify({
      name: hostname,
      account: { id: accountId },
      type: "full",
      jump_start: true,
    }),
  });
}

export async function setSslFlexible(zoneId: string): Promise<void> {
  await cfFetch(`/zones/${zoneId}/settings/ssl`, {
    method: "PATCH",
    body: JSON.stringify({ value: "flexible" }),
  });
}

export async function getZone(zoneId: string): Promise<CloudflareZone> {
  return cfFetch<CloudflareZone>(`/zones/${zoneId}`);
}

export async function findZoneByName(hostname: string): Promise<CloudflareZone | null> {
  const result = await cfFetch<CloudflareZone[]>(
    `/zones?name=${encodeURIComponent(hostname)}&status=active,pending,initializing,moved`
  );
  return result[0] ?? null;
}

export async function createZoneWithFlexibleSsl(hostname: string): Promise<CloudflareZone> {
  let zone = await findZoneByName(hostname);
  if (!zone) {
    zone = await createZone(hostname);
  }
  await setSslFlexible(zone.id);
  const refreshed = await getZone(zone.id);
  return refreshed;
}
