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

function authHeaders(): Record<string, string> {
  const email = env.cloudflareEmail();
  const apiKey = env.cloudflareApiKey();
  if (email && apiKey) {
    return {
      "X-Auth-Email": email,
      "X-Auth-Key": apiKey,
      "Content-Type": "application/json",
    };
  }

  const token = env.cloudflareApiToken();
  if (!token) {
    throw new Error(
      "Cloudflare não configurado. Defina CLOUDFLARE_API_TOKEN ou CLOUDFLARE_EMAIL + CLOUDFLARE_API_KEY (Global API Key)."
    );
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function cfFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
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

function isZoneCreatePermissionError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("zone.create") ||
    m.includes("com.cloudflare.api.account.zone.create") ||
    (m.includes("permission") && m.includes("create zones"))
  );
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

export type CloudflareDnsRecord = {
  id: string;
  type: string;
  name: string;
  content: string;
  proxied: boolean;
};

export async function listDnsRecords(zoneId: string): Promise<CloudflareDnsRecord[]> {
  return cfFetch<CloudflareDnsRecord[]>(`/zones/${zoneId}/dns_records?per_page=100`);
}

export async function createDnsRecord(
  zoneId: string,
  data: { type: "A"; name: string; content: string; proxied?: boolean }
): Promise<CloudflareDnsRecord> {
  return cfFetch<CloudflareDnsRecord>(`/zones/${zoneId}/dns_records`, {
    method: "POST",
    body: JSON.stringify({
      type: data.type,
      name: data.name,
      content: data.content,
      proxied: data.proxied ?? true,
      ttl: 1,
    }),
  });
}

function hasOriginARecord(records: CloudflareDnsRecord[], hostname: string, label: "@" | "www"): boolean {
  const target = label === "@" ? hostname : `www.${hostname}`;
  return records.some(
    (r) =>
      r.type === "A" &&
      (r.name === target || r.name === `${target}.` || (label === "@" && r.name === "@"))
  );
}

/** Cria A @ e www apontando para ORIGIN_IP (proxied) se ainda não existirem. */
export async function ensureOriginDnsRecords(zoneId: string, hostname: string): Promise<void> {
  const originIp = env.originIp();
  if (!originIp) {
    throw new Error(
      "ORIGIN_IP não configurado. Defina o IP público da VPS no .env (ex: ORIGIN_IP=111.90.148.173)."
    );
  }

  const records = await listDnsRecords(zoneId);
  if (!hasOriginARecord(records, hostname, "@")) {
    await createDnsRecord(zoneId, { type: "A", name: "@", content: originIp, proxied: true });
  }
  if (!hasOriginARecord(records, hostname, "www")) {
    await createDnsRecord(zoneId, { type: "A", name: "www", content: originIp, proxied: true });
  }
}

export async function findZoneByName(hostname: string): Promise<CloudflareZone | null> {
  const result = await cfFetch<CloudflareZone[]>(
    `/zones?name=${encodeURIComponent(hostname)}&status=active,pending,initializing,moved`
  );
  return result[0] ?? null;
}

/**
 * Garante a zone na Cloudflare com SSL Flexible.
 * 1) Reusa zone existente
 * 2) Tenta criar
 * 3) Se o token não tiver zone.create, erro acionável em PT-BR
 */
export async function createZoneWithFlexibleSsl(hostname: string): Promise<CloudflareZone> {
  let zone = await findZoneByName(hostname);

  if (!zone) {
    try {
      zone = await createZone(hostname);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isZoneCreatePermissionError(message)) {
        throw new Error(
          `Sem permissão Cloudflare para criar zone (${hostname}). ` +
            `Opção A: em Cloudflare → Add site, adicione "${hostname}" e clique Confirmar de novo. ` +
            `Opção B: use Global API Key — no .env defina CLOUDFLARE_EMAIL + CLOUDFLARE_API_KEY ` +
            `(My Profile → API Tokens → Global API Key). ` +
            `Opção C: crie um Account API Token com Zone:Edit + Zone Settings:Edit em All zones ` +
            `e Account Settings:Edit, e atualize CLOUDFLARE_API_TOKEN.`
        );
      }
      throw error;
    }
  }

  try {
    await setSslFlexible(zone.id);
  } catch {
    // Token pode listar zones sem editar settings; NS ainda servem para o cliente apontar.
  }

  try {
    await ensureOriginDnsRecords(zone.id, hostname);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Zone ${hostname} criada, mas falhou ao configurar DNS A → VPS: ${message}`
    );
  }

  try {
    return await getZone(zone.id);
  } catch {
    return zone;
  }
}
