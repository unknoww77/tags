import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { clearImpersonationCookie, setImpersonationCookie } from "@/lib/impersonation";
import { writeAudit } from "@/lib/settings";
import { getEffectiveSettings } from "@/lib/settings";

const schema = z.object({
  userId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { userId } = schema.parse(await request.json());
    const target = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!target || !target.tenantId || !target.tenant) {
      return NextResponse.json({ error: "Usuário sem tenant para acessar" }, { status: 400 });
    }

    if (target.role === "SUPER_ADMIN" && target.id === session.user.id) {
      return NextResponse.json({ error: "Você já está na sua conta" }, { status: 400 });
    }

    const tenantSettings = await getEffectiveSettings(target.tenantId);
    if (tenantSettings.disabled) {
      return NextResponse.json({ error: "Tenant desativado" }, { status: 403 });
    }

    await setImpersonationCookie({
      tenantId: target.tenantId,
      userId: target.id,
      userName: target.name,
      tenantName: target.tenant.name,
    });

    await writeAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "impersonate.start",
      targetType: "User",
      targetId: target.id,
      metaJson: { tenantId: target.tenantId, tenantName: target.tenant.name },
    });

    return NextResponse.json({
      ok: true,
      impersonation: {
        userId: target.id,
        userName: target.name,
        tenantId: target.tenantId,
        tenantName: target.tenant.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro ao acessar conta" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await clearImpersonationCookie();
  await writeAudit({
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: "impersonate.stop",
  });
  return NextResponse.json({ ok: true });
}