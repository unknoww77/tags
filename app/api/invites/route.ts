import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { generateInviteToken } from "@/lib/utils";
import { env } from "@/lib/env";
import { getGlobalSettings, writeAudit } from "@/lib/settings";

const createSchema = z.object({
  tenantName: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => {
      const t = (v ?? "").trim();
      return t.length >= 2 ? t : undefined;
    }),
  daysValid: z.number().int().min(1).max(90).optional(),
});

export async function GET() {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const invites = await prisma.invite.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ invites });
}

export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createSchema.parse(body);
    const global = await getGlobalSettings();
    const days = data.daysValid ?? global.inviteDaysValid;
    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const invite = await prisma.invite.create({
      data: {
        token,
        email: null,
        tenantName: data.tenantName || null,
        expiresAt,
        createdBy: session.user.id,
      },
    });

    await writeAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "invite.create",
      targetType: "Invite",
      targetId: invite.id,
    });

    const link = `${env.appUrl()}/cadastro?invite=${token}`;
    return NextResponse.json({ invite, link });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar convite" }, { status: 500 });
  }
}
