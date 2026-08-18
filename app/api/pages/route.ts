import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppSession, canManagePages } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { parsePageConfig } from "@/lib/page-config";
import { getEffectiveSettings } from "@/lib/settings";

const createSchema = z.object({
  brand: z.enum(["conectcar", "veloe"]),
  templateId: z.string().default("default"),
  title: z.string().min(2).max(120),
  slug: z.string().min(2).max(48).optional(),
  headline: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  ctaLabel: z.string().min(1).max(80).default("Peça sua tag").optional(),
  ctaUrl: z.string().optional(),
  affiliateCode: z.string().max(120).optional(),
  configJson: z.unknown().optional(),
});

export async function GET() {
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // No dashboard listamos só o tenant efetivo; visão global fica no /super
  const listWhere = { tenantId: session.user.tenantId ?? "__none__" };

  const pages = await prisma.page.findMany({
    where: listWhere,
    include: {
      domains: true,
      tenant: { select: { id: true, name: true } },
      _count: { select: { events: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ pages });
}

export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session?.user || !canManagePages(session.user) || !session.user.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createSchema.parse(body);

    const settings = await getEffectiveSettings(session.user.tenantId);
    if (settings.disabled) {
      return NextResponse.json({ error: "Conta desativada pelo super admin" }, { status: 403 });
    }

    const pageCount = await prisma.page.count({
      where: { tenantId: session.user.tenantId, status: { not: "archived" } },
    });
    if (pageCount >= settings.maxPagesPerTenant) {
      return NextResponse.json(
        { error: `Limite de ${settings.maxPagesPerTenant} páginas atingido` },
        { status: 400 }
      );
    }

    let slug = slugify(data.slug || data.title);
    if (!slug) slug = `pagina-${Date.now().toString(36)}`;

    const existing = await prisma.page.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const configJson = parsePageConfig(data.configJson);

    const page = await prisma.page.create({
      data: {
        tenantId: session.user.tenantId,
        brand: data.brand,
        templateId: data.templateId,
        title: data.title,
        slug,
        headline: data.headline,
        description: data.description,
        ctaLabel: data.ctaLabel || "Peça sua tag",
        ctaUrl: data.ctaUrl || "#",
        affiliateCode: data.affiliateCode || null,
        configJson,
        status: "draft",
      },
    });

    return NextResponse.json({ page });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.flatten() }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar página" }, { status: 500 });
  }
}
