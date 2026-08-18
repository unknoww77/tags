import { NextResponse } from "next/server";
import { getAppSession, canAccessTenant } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

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

  if (!canAccessTenant(session.user, page.tenantId)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const days = Math.min(Number(url.searchParams.get("days") || 30), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const events = await prisma.trackEvent.findMany({
    where: { pageId: id, createdAt: { gte: since } },
    select: {
      eventType: true,
      domain: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      device: true,
      createdAt: true,
    },
  });

  const views = events.filter((e) => e.eventType === "view").length;
  const ctaClicks = events.filter((e) => e.eventType === "cta_click").length;
  const leads = events.filter((e) => e.eventType === "lead").length;

  const byUtm = new Map<string, number>();
  const byDevice = new Map<string, number>();
  const byDomain = new Map<string, number>();

  for (const e of events.filter((x) => x.eventType === "view")) {
    const key = [e.utmSource || "(direct)", e.utmMedium || "-", e.utmCampaign || "-"].join(" / ");
    byUtm.set(key, (byUtm.get(key) || 0) + 1);
    byDevice.set(e.device || "unknown", (byDevice.get(e.device || "unknown") || 0) + 1);
    byDomain.set(e.domain, (byDomain.get(e.domain) || 0) + 1);
  }

  const top = (map: Map<string, number>, n = 10) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([key, count]) => ({ key, count }));

  return NextResponse.json({
    days,
    totals: {
      views,
      ctaClicks,
      leads,
      ctaRate: views ? ctaClicks / views : 0,
      leadRate: views ? leads / views : 0,
    },
    topUtms: top(byUtm),
    topDevices: top(byDevice),
    topDomains: top(byDomain),
  });
}
