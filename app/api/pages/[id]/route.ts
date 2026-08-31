import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppSession, canAccessPage as userCanAccessPage, type AppSessionUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { parsePageConfig } from "@/lib/page-config";

type Params = { params: Promise<{ id: string }> };

async function loadAccessiblePage(pageId: string, user: AppSessionUser) {
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: { domains: true },
  });
  if (!page) return null;
  if (!userCanAccessPage(user, page.tenantId)) return null;
  return page;
}

const updateSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  headline: z.string().max(200).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  ctaLabel: z.string().min(1).max(80).optional(),
  ctaUrl: z.string().url().optional(),
  affiliateCode: z.string().max(120).optional().nullable(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  configJson: z.unknown().optional(),
});

export async function GET(_request: Request, { params }: Params) {
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const page = await loadAccessiblePage(id, session.user);
  if (!page) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ page });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await loadAccessiblePage(id, session.user);
  if (!existing) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  try {
    const body = updateSchema.parse(await request.json());
    const page = await prisma.page.update({
      where: { id },
      data: {
        title: body.title,
        headline: body.headline,
        description: body.description,
        ctaLabel: body.ctaLabel,
        ctaUrl: body.ctaUrl,
        affiliateCode: body.affiliateCode,
        status: body.status,
        ...(body.configJson !== undefined
          ? { configJson: parsePageConfig(body.configJson) }
          : {}),
      },
      include: { domains: true },
    });
    return NextResponse.json({ page });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await loadAccessiblePage(id, session.user);
  if (!existing) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  await prisma.page.update({
    where: { id },
    data: { status: "archived" },
  });

  return NextResponse.json({ ok: true });
}
