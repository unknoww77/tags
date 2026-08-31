import { NextResponse } from "next/server";
import { getAppSession, canAccessPage } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { validateDomainById } from "@/lib/domains";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const domain = await prisma.domain.findUnique({ include: { page: true }, where: { id } });
  if (!domain) {
    return NextResponse.json({ error: "Domínio não encontrado" }, { status: 404 });
  }

  if (!canAccessPage(session.user, domain.page.tenantId)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const updated = await validateDomainById(id);
    return NextResponse.json({ domain: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro na validação";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
