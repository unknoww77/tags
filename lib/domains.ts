import { prisma } from "@/lib/prisma";
import { getZone, ensureOriginDnsRecords } from "@/lib/cloudflare";

export async function validateDomainById(domainId: string) {
  const domain = await prisma.domain.findUnique({ where: { id: domainId }, include: { page: true } });
  if (!domain) {
    throw new Error("Domínio não encontrado");
  }

  if (!domain.cloudflareZoneId) {
    const updated = await prisma.domain.update({
      where: { id: domain.id },
      data: {
        nsStatus: "error",
        lastCheckedAt: new Date(),
        lastError: "Zone Cloudflare ausente",
      },
    });
    return updated;
  }

  try {
    const zone = await getZone(domain.cloudflareZoneId);
    const active = zone.status === "active";

    if (active) {
      try {
        await ensureOriginDnsRecords(domain.cloudflareZoneId, domain.hostname);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao configurar DNS A";
        return prisma.domain.update({
          where: { id: domain.id },
          data: {
            nsStatus: "error",
            lastCheckedAt: new Date(),
            lastError: message,
          },
        });
      }
    }

    const updated = await prisma.domain.update({
      where: { id: domain.id },
      data: {
        nsStatus: active ? "active" : "pending",
        nameservers: zone.name_servers?.length ? zone.name_servers : domain.nameservers,
        lastCheckedAt: new Date(),
        lastError: null,
      },
    });

    if (active && domain.page.status === "draft") {
      await prisma.page.update({
        where: { id: domain.pageId },
        data: { status: "published" },
      });
    }

    return updated;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao validar NS";
    return prisma.domain.update({
      where: { id: domain.id },
      data: {
        nsStatus: "error",
        lastCheckedAt: new Date(),
        lastError: message,
      },
    });
  }
}

export async function validatePendingDomains() {
  const pending = await prisma.domain.findMany({
    where: { nsStatus: { in: ["pending", "error"] } },
    take: 50,
    orderBy: { lastCheckedAt: "asc" },
  });

  const results = [];
  for (const domain of pending) {
    results.push(await validateDomainById(domain.id));
  }
  return results;
}
