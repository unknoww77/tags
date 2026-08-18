import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(10),
  name: z.string().min(2).max(120),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "Use apenas letras, números e _"),
  password: z.string().min(8).max(128),
  tenantName: z.string().min(2).max(120).optional(),
});

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    const username = normalizeUsername(data.username);

    const invite = await prisma.invite.findUnique({ where: { token: data.token } });
    if (!invite || invite.revokedAt || invite.usedAt || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Convite inválido ou expirado" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "Vulgo já está em uso" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const tenantName = data.tenantName || invite.tenantName || data.name;

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: tenantName },
      });

      const user = await tx.user.create({
        data: {
          username,
          name: data.name,
          passwordHash,
          role: "TENANT_ADMIN",
          tenantId: tenant.id,
        },
      });

      await tx.invite.update({
        where: { id: invite.id },
        data: { usedAt: new Date(), tenantId: tenant.id },
      });

      return { user, tenant };
    });

    return NextResponse.json({
      ok: true,
      userId: result.user.id,
      tenantId: result.tenant.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.flatten() }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 });
  }
}
