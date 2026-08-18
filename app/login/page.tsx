import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth-helpers";
import { PlatformHeader } from "@/components/PlatformHeader";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const session = await getAppSession();
  if (session?.user) {
    if (session.user.impersonating) redirect("/dashboard");
    redirect(session.user.role === "SUPER_ADMIN" ? "/super" : "/dashboard");
  }

  return (
    <div className="platform-shell">
      <PlatformHeader />
      <main className="auth-card">
        <h1>Entrar</h1>
        <p className="muted">Entre com vulgo e senha (super admin ou conta convidada).</p>
        <LoginForm />
        <p className="muted">
          Tem convite? <Link href="/cadastro">Criar conta</Link>
        </p>
      </main>
    </div>
  );
}
