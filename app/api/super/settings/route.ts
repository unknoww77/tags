import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ensureGlobalSettings, writeAudit } from "@/lib/settings";

export async function GET() {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const settings = await ensureGlobalSettings();
  return NextResponse.json({ settings });
}

const schema = z.object({
  maxPagesPerTenant: z.number().int().min(1).max(500),
  leadRetentionDays: z.number().int().min(7).max(3650),
  defaultSslMode: z.enum(["flexible", "full", "strict"]),
  showPartnerDisclaimer: z.boolean(),
  notifyTelegramOnLead: z.boolean(),
  telegramBotToken: z.string().nullable().optional(),
  telegramChatId: z.string().nullable().optional(),
  allowTenantCustomWa: z.boolean(),
  inviteDaysValid: z.number().int().min(1).max(90),
  notes: z.string().max(2000).nullable().optional(),
});

export async function PATCH(request: Request) {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());
    const settings = await prisma.globalSettings.upsert({
      where: { id: "global" },
      update: {
        ...body,
        updatedBy: session.user.id,
      },
      create: {
        id: "global",
        ...body,
        updatedBy: session.user.id,
      },
    });

    await writeAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "settings.global.update",
      targetType: "GlobalSettings",
      targetId: "global",
      metaJson: body,
    });

    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.flatten() }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}
