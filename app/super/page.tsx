import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PlatformHeader } from "@/components/PlatformHeader";
import { InviteManager } from "@/components/InviteManager";
import { ImpersonateButton } from "@/components/ImpersonateButton";
import { GlobalSettingsForm } from "@/components/GlobalSettingsForm";
import { AuditLogPanel } from "@/components/AuditLogPanel";
import { env } from "@/lib/env";
import { BRAND_LABELS } from "@/lib/templates";
import { ensureGlobalSettings } from "@/lib/settings";

export default async function SuperAdminPage() {
  await requireSuperAdmin();
  await ensureGlobalSettings();

  const [tenants, users, pages, domains, invites, views, leads] = await Promise.all([
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
  ]);

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

        <div className="stat-grid">
          <div>
            <span>Tenants</span>
            <strong>{tenants.length}</strong>
          </div>
          <div>
            <span>Páginas</span>
            <strong>{pages.length}</strong>
          </div>
          <div>
            <span>Visitas</span>
            <strong>{views}</strong>
          </div>
          <div>
            <span>Leads</span>
            <strong>{leads}</strong>
          </div>
        </div>

        <section className="panel">
          <h2>Configuração global (todos)</h2>
          <p className="muted">
            Vale para toda a rede. Overrides por tenant ficam na página de cada conta.
          </p>
          <GlobalSettingsForm />
        </section>

        <section className="panel">
          <h2>Contas / usuários</h2>
          <p className="muted">
            Acessar = entrar na conta. Config = limites, Telegram e desativar por tenant.
          </p>
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
        </section>

        <section className="panel">
          <h2>Tenants</h2>
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
                {tenants.map((t) => (
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
        </section>

        <section className="panel">
          <h2>Convites</h2>
          <InviteManager
            appUrl={appUrl}
            initialInvites={invites.map((i) => ({
              ...i,
              expiresAt: i.expiresAt.toISOString(),
              usedAt: i.usedAt?.toISOString() ?? null,
              revokedAt: i.revokedAt?.toISOString() ?? null,
            }))}
          />
        </section>

        <section className="panel">
          <h2>Auditoria</h2>
          <p className="muted">Impersonação e mudanças de config.</p>
          <AuditLogPanel />
        </section>

        <section className="panel">
          <h2>Páginas ativas</h2>
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
                {pages.map((p) => (
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
        </section>

        <section className="panel">
          <h2>Domínios</h2>
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
                {domains.map((d) => (
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
      </main>
    </div>
  );
}
