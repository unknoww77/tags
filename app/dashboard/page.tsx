import Link from "next/link";
import { requireTenantAdmin, canManagePages } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PlatformHeader } from "@/components/PlatformHeader";
import { PageDashboardCard, type PageCardData } from "@/components/PageDashboardCard";
import { env } from "@/lib/env";
import { BRAND_LABELS } from "@/lib/templates";
import { parsePageConfig } from "@/lib/page-config";

function formatLiveDuration(from: Date): string {
  const ms = Date.now() - from.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${Math.max(0, mins)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 60) return `${days} dia${days === 1 ? "" : "s"}`;
  const months = Math.floor(days / 30);
  return `${months} mês${months === 1 ? "" : "es"}`;
}

function maskPhone(n: string): string {
  const d = n.replace(/\D/g, "");
  if (d.length < 4) return d;
  return `${d.slice(0, 4)}…${d.slice(-4)}`;
}

export default async function DashboardPage() {
  const session = await requireTenantAdmin();
  const canCreate = canManagePages(session.user);

  const where = session.user.tenantId
    ? { tenantId: session.user.tenantId, status: { not: "archived" as const } }
    : { status: { not: "archived" as const }, tenantId: "__none__" };

  const pages = await prisma.page.findMany({
    where,
    include: {
      domains: true,
      leads: {
        select: {
          mode: true,
          whatsappEnabled: true,
          whatsappOpened: true,
          name: true,
          phone: true,
          email: true,
          city: true,
          formJson: true,
        },
      },
      _count: { select: { events: true, leads: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const platform = env.platformDomain();
  const subtitle = session.user.impersonating
    ? `Modo conta: ${session.user.impersonation?.tenantName}`
    : session.user.role === "SUPER_ADMIN"
      ? "Sua conta de teste (super admin)"
      : "Gerencie landings, domínios e performance.";

  const cards: PageCardData[] = pages.map((page) => {
    const config = parsePageConfig(page.configJson);
    const domain = page.domains[0] ?? null;
    const formFieldsCount = Object.values(config.formFields).filter(Boolean).length;

    const whatsappOpened = page.leads.filter((l) => l.whatsappEnabled && l.whatsappOpened).length;
    const whatsappNotOpened = page.leads.filter(
      (l) => l.whatsappEnabled && !l.whatsappOpened
    ).length;

    const formSubmissions = page.leads.filter((l) => {
      if (l.formJson && typeof l.formJson === "object" && Object.keys(l.formJson as object).length) {
        return true;
      }
      return Boolean(l.name || l.phone || l.email || l.city);
    }).length;

    let liveLabel = `Rascunho · ${formatLiveDuration(page.createdAt)}`;
    if (domain?.nsStatus === "active") {
      liveLabel = formatLiveDuration(domain.updatedAt ?? domain.createdAt);
    } else if (page.status === "published") {
      liveLabel = formatLiveDuration(page.updatedAt);
    }

    return {
      id: page.id,
      title: page.title,
      brandLabel: BRAND_LABELS[page.brand],
      status: page.status,
      previewHost: `${page.slug}.${platform}`,
      domainHostname: domain?.hostname ?? null,
      domainNsStatus: domain?.nsStatus ?? null,
      leadsTotal: page._count.leads,
      whatsappConfigured: config.sendToWhatsapp && config.whatsappNumber.length >= 10,
      whatsappNumberMasked:
        config.sendToWhatsapp && config.whatsappNumber
          ? maskPhone(config.whatsappNumber)
          : null,
      whatsappOpened,
      whatsappNotOpened,
      formFieldsCount,
      formSubmissions,
      liveLabel,
      eventsCount: page._count.events,
    };
  });

  return (
    <div className="platform-shell">
      <PlatformHeader />
      <main className="dashboard">
        <div className="dashboard-head">
          <div>
            <h1>Dashboard</h1>
            <p className="muted">{subtitle}</p>
          </div>
          {canCreate && (
            <Link className="cta-btn" href="/dashboard/pages/new">
              Criar página
            </Link>
          )}
          <Link className="cta-btn" href="/dashboard/chat">
            Chat
          </Link>
        </div>

        {!session.user.tenantId && (
          <p className="form-error">
            Nenhum tenant associado. Rode o seed ou acesse uma conta pelo Super Admin.
          </p>
        )}

        <div className="card-list">
          {cards.map((page) => (
            <PageDashboardCard key={page.id} page={page} />
          ))}
          {!cards.length && (
            <p className="muted">Nenhuma página ainda. Crie a primeira landing.</p>
          )}
        </div>
      </main>
    </div>
  );
}
