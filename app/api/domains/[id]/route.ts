import { NextResponse } from "next/server";
import { getAppSession, canAccessTenant } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const domain = await prisma.domain.findUnique({
    where: { id },
    include: { page: true },
  });

  if (!domain) {
    return NextResponse.json({ error: "Domínio não encontrado" }, { status: 404 });
  }

  if (!canAccessTenant(session.user, domain.page.tenantId)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.domain.delete({ where: { id: domain.id } });
    if (domain.page.status === "published") {
      await tx.page.update({
        where: { id: domain.pageId },
        data: { status: "draft" },
      });
    }
  });

  return NextResponse.json({ ok: true, hostname: domain.hostname });
}
