import Link from "next/link";
import { requireTenantContext, canManagePages } from "@/lib/auth-helpers";
import { PlatformHeader } from "@/components/PlatformHeader";
import { CreatePageForm } from "@/components/CreatePageForm";

export default async function NewPagePage() {
  const session = await requireTenantContext();

  if (!canManagePages(session.user)) {
    return (
      <div className="platform-shell">
        <PlatformHeader />
        <main className="dashboard">
          <p>Sem permissão para criar páginas.</p>
          <Link href="/dashboard">Voltar</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="platform-shell">
      <PlatformHeader />
      <main className="dashboard new-page-shell">
        <Link href="/dashboard" className="muted">
          ← Voltar
        </Link>
        <h1>Nova página</h1>
        {session.user.impersonating && (
          <p className="muted">
            Criando como {session.user.impersonation?.userName} (
            {session.user.impersonation?.tenantName}).
          </p>
        )}
        <CreatePageForm />
      </main>
    </div>
  );
}
