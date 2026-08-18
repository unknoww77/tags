import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth-helpers";
import { PlatformHeader } from "@/components/PlatformHeader";

export default async function HomePage() {
  const session = await getAppSession();
  if (session?.user) {
    if (session.user.impersonating) redirect("/dashboard");
    redirect(session.user.role === "SUPER_ADMIN" ? "/super" : "/dashboard");
  }

  return (
    <div className="platform-shell">
      <PlatformHeader />
      <main className="hero-platform">
        <p className="eyebrow">t0p.1 tags</p>
        <h1>Só o futuro das tags está aqui</h1>
        <div className="hero-actions">
          <Link className="cta-btn" href="/login">
            Entrar
          </Link>
        </div>
        <p className="muted">Cadastro apenas com convite do super admin.</p>
      </main>
    </div>
  );
}
