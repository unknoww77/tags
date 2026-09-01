import { getAppSession, canAccessPage } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { STATUS_LABEL, LOSS_REASON_LABEL } from "@/lib/leads";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getAppSession();
  if (!session?.user) {
    return new Response("Não autorizado", { status: 401 });
  }

  const { id } = await params;
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) return new Response("Não encontrado", { status: 404 });
  if (!canAccessPage(session.user, page.tenantId)) {
    return new Response("Não autorizado", { status: 401 });
  }

  const leads = await prisma.lead.findMany({
    where: { pageId: id },
    orderBy: { createdAt: "desc" },
  });

  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const header = [
    "id",
    "createdAt",
    "status",
    "lossReason",
    "lossNote",
    "name",
    "phone",
    "email",
    "city",
    "mode",
    "whatsappOpened",
    "whatsappNumberUsed",
    "utmSource",
    "utmMedium",
    "utmCampaign",
    "quiz",
  ].join(",");

  const rows = leads.map((l) =>
    [
      l.id,
      l.createdAt.toISOString(),
      STATUS_LABEL[l.status],
      l.lossReason ? LOSS_REASON_LABEL[l.lossReason] : "",
      l.lossNote,
      l.name,
      l.phone,
      l.email,
      l.city,
      l.mode,
      l.whatsappOpened,
      l.whatsappNumberUsed,
      l.utmSource,
      l.utmMedium,
      l.utmCampaign,
      JSON.stringify(l.quizJson ?? {}),
    ]
      .map(escape)
      .join(",")
  );

  const csv = [header, ...rows].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${page.slug}.csv"`,
    },
  });
}
