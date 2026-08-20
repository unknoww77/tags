import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PlatformHeader } from "@/components/PlatformHeader";
import { InviteManager } from "@/components/InviteManager";
import { ImpersonateButton } from "@/components/ImpersonateButton";
import { GlobalSettingsForm } from "@/components/GlobalSettingsForm";
import { AuditLogPanel } from "@/components/AuditLogPanel";
import { LeadStatusBadge } from "@/components/LeadStatusBadge";
import { env } from "@/lib/env";
import { BRAND_LABELS } from "@/lib/templates";
import { ensureGlobalSettings } from "@/lib/settings";
import { countByStatus, conversionRate } from "@/lib/leads";

export default async function SuperAdminPage() {
  await requireSuperAdmin();
  await ensureGlobalSettings();

  const [tenants, users, pages, domains, invites, views, leadsTotal, recentLeads] =
    await Promise.all([
      prisma.tenant.findMany({
        include: {
          _count: { select: { pages: true, users: true } },
          settings: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        include: { tenant: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.page.findMany({
        include: {
          tenant: true,
          domains: true,
          _count: { select: { events: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.domain.findMany({ orderBy: { updatedAt: "desc" }, take: 50 }),
      prisma.invite.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.trackEvent.count({ where: { eventType: "view" } }),
      prisma.lead.count(),
      prisma.lead.findMany({
        include: { page: { include: { tenant: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

  const leadCounts = countByStatus(recentLeads);
  const pendingDomains = domains.filter((d) => d.nsStatus !== "active").length;
  const appUrl = env.appUrl();

  return (
    <div className="platform-shell">
      <PlatformHeader />
      <main className="dashboard">
        <div className="dashboard-head">
          <div>
            <h1>Super Admin</h1>
            <p className="muted">
              Rede completa + configurações globais e por conta. Acesse tenants sem deslogar.
            </p>
          </div>
          <Link className="cta-btn" href="/dashboard">
            Meu dashboard (teste)
          </Link>
          <Link className="cta-btn" href="/super/chat">
            Chat global
          </Link>
        </div>

        <section className="admin-section-block">
          <h2>Visão geral</h2>
          <p className="muted">Métricas agregadas da rede.</p>
          <div className="dashboard-kpi-grid">
            <div className="dashboard-kpi">
              <span>Tenants</span>
              <strong>{tenants.length}</strong>
            </div>
            <div className="dashboard-kpi">
              <span>Páginas</span>
              <strong>{pages.length}</strong>
            </div>
            <div className="dashboard-kpi">
              <span>Visitas</span>
              <strong>{views}</strong>
            </div>
            <div className="dashboard-kpi">
              <span>Leads totais</span>
              <strong>{leadsTotal}</strong>
            </div>
          </div>
          <div className="stat-grid">
            <div>
              <span>Conversão (últimos 20)</span>
              <strong>{conversionRate(leadCounts)}%</strong>
            </div>
            <div>
              <span>Perdidos (últimos 20)</span>
              <strong>{leadCounts.perdido}</strong>
            </div>
            <div>
              <span>Domínios pendentes</span>
              <strong>{pendingDomains}</strong>
            </div>
            <div>
              <span>Convites ativos</span>
              <strong>{invites.filter((i) => !i.revokedAt && !i.usedAt).length}</strong>
            </div>
          </div>
        </section>

        <section className="admin-section-block panel">
          <h2>Leads recentes (rede)</h2>
          <p className="muted">Últimos 20 leads em todas as contas.</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Contato</th>
                  <th>Status</th>
                  <th>Página</th>
                  <th>Tenant</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>{lead.createdAt.toLocaleString("pt-BR")}</td>
                    <td>
                      {lead.name || "—"}
                      <div className="muted tiny">{lead.phone || ""}</div>
                    </td>
                    <td>
                      <LeadStatusBadge status={lead.status} />
                    </td>
                    <td>
                      <Link href={`/dashboard/pages/${lead.pageId}`}>{lead.page.title}</Link>
                    </td>
                    <td>{lead.page.tenant.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-section-block panel">
          <h2>Operação</h2>
          <p className="muted">Tenants, páginas e domínios recentes.</p>

          <h3>Tenants</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Users</th>
                  <th>Páginas</th>
                  <th>Override</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tenants.slice(0, 10).map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{t._count.users}</td>
                    <td>{t._count.pages}</td>
                    <td>{t.settings ? (t.settings.disabled ? "desativado" : "sim") : "herda"}</td>
                    <td>
                      <Link href={`/super/tenants/${t.id}`}>Configurar</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>Páginas ativas</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Tenant</th>
                  <th>Marca</th>
                  <th>Domínio</th>
                  <th>NS</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pages.slice(0, 15).map((p) => (
                  <tr key={p.id}>
                    <td>{p.title}</td>
                    <td>{p.tenant.name}</td>
                    <td>{BRAND_LABELS[p.brand]}</td>
                    <td>{p.domains[0]?.hostname || "—"}</td>
                    <td>{p.domains[0]?.nsStatus || "—"}</td>
                    <td>
                      <Link href={`/dashboard/pages/${p.id}`}>Abrir</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>Domínios</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Hostname</th>
                  <th>SSL</th>
                  <th>NS</th>
                  <th>Última check</th>
                </tr>
              </thead>
              <tbody>
                {domains.slice(0, 15).map((d) => (
                  <tr key={d.id}>
                    <td>{d.hostname}</td>
                    <td>{d.sslMode}</td>
                    <td className={`status-${d.nsStatus}`}>{d.nsStatus}</td>
                    <td>
                      {d.lastCheckedAt ? d.lastCheckedAt.toLocaleString("pt-BR") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-section-block panel">
          <h2>Governança</h2>
          <p className="muted">Configuração global, contas, convites e auditoria.</p>

          <h3>Configuração global (todos)</h3>
          <GlobalSettingsForm />

          <h3>Contas / usuários</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Vulgo</th>
                  <th>Role</th>
                  <th>Tenant</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.username}</td>
                    <td>{u.role === "SUPER_ADMIN" ? "Super" : "Admin"}</td>
                    <td>
                      {u.tenant?.name || "—"}
                      {u.tenantId && tenants.find((t) => t.id === u.tenantId)?.settings?.disabled
                        ? " (off)"
                        : ""}
                    </td>
                    <td>
                      <div className="selector-row wrap">
                        {u.tenantId ? <ImpersonateButton userId={u.id} /> : null}
                        {u.tenantId ? (
                          <Link className="selector-btn" href={`/super/tenants/${u.tenantId}`}>
                            Config
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>Convites</h3>
          <InviteManager
            appUrl={appUrl}
            initialInvites={invites.map((i) => ({
              ...i,
              expiresAt: i.expiresAt.toISOString(),
              usedAt: i.usedAt?.toISOString() ?? null,
              revokedAt: i.revokedAt?.toISOString() ?? null,
            }))}
          />

          <h3>Auditoria</h3>
          <AuditLogPanel />
        </section>
      </main>
    </div>
  );
}
