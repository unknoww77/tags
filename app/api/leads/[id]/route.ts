import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppSession, canAccessPage } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { canTransition } from "@/lib/leads";

type Params = { params: Promise<{ id: string }> };

const schema = z
  .object({
    status: z.enum(["colhido", "usado", "perdido", "convertido"]),
    lossReason: z
      .enum(["sem_contato", "sem_interesse", "duplicado", "fora_perfil", "outro"])
      .optional(),
    lossNote: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "perdido" && !data.lossReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Motivo de perda é obrigatório",
        path: ["lossReason"],
      });
    }
  });

export async function PATCH(request: Request, { params }: Params) {
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const lead = await prisma.lead.findUnique({ include: { page: true }, where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }
  if (!canAccessPage(session.user, lead.page.tenantId)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());

    if (!canTransition(lead.status, body.status)) {
      return NextResponse.json(
        { error: `Transição inválida: ${lead.status} → ${body.status}` },
        { status: 400 }
      );
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        status: body.status,
        lossReason: body.status === "perdido" ? body.lossReason : null,
        lossNote: body.status === "perdido" ? body.lossNote?.trim() || null : null,
      },
    });
    return NextResponse.json({ lead: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
