import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PlatformHeader } from "@/components/PlatformHeader";
import { TenantSettingsForm } from "@/components/TenantSettingsForm";
import { ImpersonateButton } from "@/components/ImpersonateButton";
import { getEffectiveSettings } from "@/lib/settings";

type Props = { params: Promise<{ tenantId: string }> };

export default async function SuperTenantPage({ params }: Props) {
  await requireSuperAdmin();
  const { tenantId } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      users: true,
      settings: true,
      _count: { select: { pages: true } },
    },
  });
  if (!tenant) notFound();

  const effective = await getEffectiveSettings(tenantId);

  return (
    <div className="platform-shell">
      <PlatformHeader />
      <main className="dashboard narrow">
        <Link href="/super" className="muted">
          ← Super Admin
        </Link>
        <h1>{tenant.name}</h1>
        <p className="muted">
          {tenant._count.pages} páginas · efetivo: máx {effective.maxPagesPerTenant} páginas ·
          retenção {effective.leadRetentionDays}d ·{" "}
          {effective.disabled ? "DESATIVADO" : "ativo"}
        </p>

        <section className="panel">
          <h2>Usuários deste tenant</h2>
          <ul>
            {tenant.users.map((u) => (
              <li key={u.id} className="field-label-row" style={{ marginBottom: 8 }}>
                {u.name} — {u.email}
                <ImpersonateButton userId={u.id} />
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>Configuração desta conta</h2>
          <TenantSettingsForm tenantId={tenant.id} tenantName={tenant.name} />
        </section>
      </main>
    </div>
  );
}
