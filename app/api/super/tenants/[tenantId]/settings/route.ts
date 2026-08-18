import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/settings";

type Params = { params: Promise<{ tenantId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { tenantId } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      settings: true,
      users: { select: { id: true, name: true, username: true, role: true } },
      _count: { select: { pages: true } },
    },
  });
  if (!tenant) {
    return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ tenant });
}

const schema = z.object({
  maxPages: z.number().int().min(1).max(500).nullable().optional(),
  leadRetentionDays: z.number().int().min(7).max(3650).nullable().optional(),
  notifyTelegramOnLead: z.boolean().nullable().optional(),
  telegramChatId: z.string().nullable().optional(),
  disabled: z.boolean().optional(),
  notes: z.string().max(2000).nullable().optional(),
  clearOverrides: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { tenantId } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });
  }

  try {
    const body = schema.parse(await request.json());

    if (body.clearOverrides) {
      await prisma.tenantSettings.deleteMany({ where: { tenantId } });
      await writeAudit({
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "settings.tenant.clear",
        targetType: "Tenant",
        targetId: tenantId,
      });
      return NextResponse.json({ settings: null });
    }

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: {
        maxPages: body.maxPages ?? null,
        leadRetentionDays: body.leadRetentionDays ?? null,
        notifyTelegramOnLead: body.notifyTelegramOnLead ?? null,
        telegramChatId: body.telegramChatId ?? null,
        disabled: body.disabled ?? false,
        notes: body.notes ?? null,
        updatedBy: session.user.id,
      },
      create: {
        tenantId,
        maxPages: body.maxPages ?? null,
        leadRetentionDays: body.leadRetentionDays ?? null,
        notifyTelegramOnLead: body.notifyTelegramOnLead ?? null,
        telegramChatId: body.telegramChatId ?? null,
        disabled: body.disabled ?? false,
        notes: body.notes ?? null,
        updatedBy: session.user.id,
      },
    });

    await writeAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "settings.tenant.update",
      targetType: "Tenant",
      targetId: tenantId,
      metaJson: body,
    });

    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}
