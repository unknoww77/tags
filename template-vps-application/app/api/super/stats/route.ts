import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Agregado rápido da rede para o super admin */
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const [tenants, pages, domainsActive, views, ctas, leads] = await Promise.all([
    prisma.tenant.count(),
    prisma.page.count({ where: { status: { not: "archived" } } }),
    prisma.domain.count({ where: { nsStatus: "active" } }),
    prisma.trackEvent.count({ where: { eventType: "view" } }),
    prisma.trackEvent.count({ where: { eventType: "cta_click" } }),
    prisma.trackEvent.count({ where: { eventType: "lead" } }),
  ]);

  return NextResponse.json({
    tenants,
    pages,
    domainsActive,
    views,
    ctas,
    leads,
  });
}
