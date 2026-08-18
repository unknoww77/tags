import { NextResponse } from "next/server";
import { getAppSession, canAccessTenant } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  if (!canAccessTenant(session.user, page.tenantId)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const leads = await prisma.lead.findMany({
    where: { pageId: id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ leads });
}
