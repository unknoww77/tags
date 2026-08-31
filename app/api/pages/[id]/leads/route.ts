import { NextResponse } from "next/server";
import { getAppSession, canAccessPage } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { STATUS_LABEL, LOSS_REASON_LABEL } from "@/lib/leads";
import type { LeadStatus } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  if (!canAccessPage(session.user, page.tenantId)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const statusFilter =
    statusParam && ["colhido", "usado", "perdido", "convertido"].includes(statusParam)
      ? (statusParam as LeadStatus)
      : undefined;

  const leads = await prisma.lead.findMany({
    where: { pageId: id, ...(statusFilter ? { status: statusFilter } : {}) },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ leads });
}
