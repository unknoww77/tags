import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppSession, canAccessTenant } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

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
  if (!canAccessTenant(session.user, lead.page.tenantId)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const schema = z.object({
    status: z.enum(["new", "contacted", "converted", "discarded"]),
  });

  try {
    const body = schema.parse(await request.json());
    const updated = await prisma.lead.update({
      where: { id },
      data: { status: body.status },
    });
    return NextResponse.json({ lead: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
