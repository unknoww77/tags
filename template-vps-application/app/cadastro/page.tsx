import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PlatformHeader } from "@/components/PlatformHeader";
import { RegisterForm } from "@/components/RegisterForm";

type Props = {
  searchParams: Promise<{ invite?: string }>;
};

export default async function CadastroPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const { invite: token } = await searchParams;
  if (!token) {
    return (
      <div className="platform-shell">
        <PlatformHeader />
        <main className="auth-card">
          <h1>Convite necessário</h1>
          <p>O cadastro funciona apenas com convite enviado pelo super admin.</p>
        </main>
      </div>
    );
  }

  const invite = await prisma.invite.findUnique({ where: { token } });
  const invalid =
    !invite || invite.revokedAt || invite.usedAt || invite.expiresAt < new Date();

  if (invalid) {
    return (
      <div className="platform-shell">
        <PlatformHeader />
        <main className="auth-card">
          <h1>Convite inválido</h1>
          <p>Este convite expirou, foi usado ou foi revogado.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="platform-shell">
      <PlatformHeader />
      <main className="auth-card">
        <h1>Criar conta</h1>
        <p className="muted">Complete o cadastro com o convite recebido.</p>
        <RegisterForm token={token} prefilledEmail={invite.email ?? undefined} />
      </main>
    </div>
  );
}
