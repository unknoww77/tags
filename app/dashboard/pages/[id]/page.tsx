import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenantAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PlatformHeader } from "@/components/PlatformHeader";
import { DomainConnect } from "@/components/DomainConnect";
import { PageAnalytics } from "@/components/PageAnalytics";
import { PageConfigEditor } from "@/components/PageConfigEditor";
import { LeadsPanel } from "@/components/LeadsPanel";
import { env } from "@/lib/env";
import { BRAND_LABELS } from "@/lib/templates";

type Props = { params: Promise<{ id: string }> };

export default async function PageDetailPage({ params }: Props) {
  const session = await requireTenantAdmin();
  const { id } = await params;

  const page = await prisma.page.findUnique({
    where: { id },
    include: { domains: true },
  });

  if (!page) notFound();
  if (session.user.impersonating && session.user.tenantId !== page.tenantId) {
    notFound();
  }
  if (session.user.role !== "SUPER_ADMIN" && session.user.tenantId !== page.tenantId) {
    notFound();
  }

  const domain = page.domains[0] ?? null;

  return (
    <div className="platform-shell">
      <PlatformHeader />
      <main className="dashboard new-page-shell">
        <Link href="/dashboard" className="muted">
          ← Voltar
        </Link>
        <div className="dashboard-head">
          <div>
            <h1>{page.title}</h1>
            <p className="muted">
              {BRAND_LABELS[page.brand]} · status {page.status} · template {page.templateId}
              {domain
                ? ` · domínio ${domain.hostname} (${
                    domain.nsStatus === "active"
                      ? "NS ativo"
                      : domain.nsStatus === "error"
                        ? "erro NS"
                        : "aguardando NS"
                  })`
                : " · sem domínio custom"}
            </p>
          </div>
        </div>

        <section className="panel">
          <h2>Funil da página</h2>
          <p className="muted">
            Arraste os blocos na horizontal, conecte as setas e teste o fluxo no preview ao lado.
          </p>
          <div className="selector-row wrap" style={{ marginBottom: 12 }}>
            <a
              className="selector-btn"
              href={`https://${page.slug}.${env.platformDomain()}?utm_source=preview&utm_medium=dashboard&utm_campaign=teste`}
              target="_blank"
              rel="noreferrer"
            >
              Abrir preview real
            </a>
          </div>
          <PageConfigEditor
            pageId={page.id}
            initialConfig={page.configJson}
            brand={page.brand}
            templateId={page.templateId}
            title={page.title}
            headline={page.headline}
            description={page.description}
          />
        </section>

        <section className="panel">
          <h2>Domínio</h2>
          <DomainConnect pageId={page.id} domain={domain} />
        </section>

        <section className="panel">
          <h2>Leads do funil</h2>
          <p className="muted">
            Status: colhido → usado → convertido / perdido (motivo obrigatório). Export CSV para planilha.
          </p>
          <LeadsPanel pageId={page.id} />
        </section>

        <section className="panel">
          <h2>Analytics (30 dias)</h2>
          <PageAnalytics pageId={page.id} />
        </section>
      </main>
    </div>
  );
}
