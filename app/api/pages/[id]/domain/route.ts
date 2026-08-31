import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppSession, canAccessTenant } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { createZoneWithFlexibleSsl } from "@/lib/cloudflare";
import { isValidHostname, normalizeHostname } from "@/lib/utils";
import { env } from "@/lib/env";
import { getEffectiveSettings } from "@/lib/settings";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  hostname: z.string().min(3).max(253),
});

export async function POST(request: Request, { params }: Params) {
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: pageId } = await params;
  const page = await prisma.page.findUnique({ where: { id: pageId }, include: { domains: true } });
  if (!page) {
    return NextResponse.json({ error: "Página não encontrada" }, { status: 404 });
  }

  if (!canAccessTenant(session.user, page.tenantId)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (page.domains.length > 0) {
    return NextResponse.json({ error: "Esta página já possui domínio conectado" }, { status: 400 });
  }

  try {
    const body = schema.parse(await request.json());
    const hostname = normalizeHostname(body.hostname);

    if (!isValidHostname(hostname)) {
      return NextResponse.json({ error: "Hostname inválido" }, { status: 400 });
    }

    const platform = env.platformDomain();
    if (hostname === platform || hostname.endsWith(`.${platform}`)) {
      return NextResponse.json({ error: "Não use o domínio da plataforma" }, { status: 400 });
    }

    const taken = await prisma.domain.findUnique({
      where: { hostname },
      include: { page: { select: { id: true, title: true } } },
    });
    if (taken) {
      const where =
        taken.pageId === pageId
          ? "nesta página"
          : `na página "${taken.page.title}"`;
      return NextResponse.json(
        {
          error: `Domínio já cadastrado ${where}. Abra a página correta e use "Remover domínio" para liberar.`,
          existingPageId: taken.pageId,
          existingPageTitle: taken.page.title,
        },
        { status: 400 }
      );
    }

    const zone = await createZoneWithFlexibleSsl(hostname);
    const settings = await getEffectiveSettings(page.tenantId);
    const sslMode = settings.defaultSslMode || "flexible";

    // reforça SSL conforme config global (flexible já setado na criação)
    if (sslMode !== "flexible") {
      try {
        const { env } = await import("@/lib/env");
        await fetch(`https://api.cloudflare.com/client/v4/zones/${zone.id}/settings/ssl`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${env.cloudflareApiToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ value: sslMode }),
        });
      } catch {
        // mantém flexible se falhar
      }
    }

    const domain = await prisma.domain.create({
      data: {
        pageId,
        hostname,
        cloudflareZoneId: zone.id,
        nameservers: zone.name_servers ?? [],
        sslMode,
        nsStatus: zone.status === "active" ? "active" : "pending",
        lastCheckedAt: new Date(),
      },
    });

    if (domain.nsStatus === "active") {
      await prisma.page.update({ where: { id: pageId }, data: { status: "published" } });
    }

    return NextResponse.json({ domain });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error(error);
    const message = error instanceof Error ? error.message : "Erro Cloudflare";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
