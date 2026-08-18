import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth-helpers";
import { LoginForm } from "@/components/LoginForm";

const FEATURES = [
  {
    icon: "⚡",
    title: "Leads em tempo real",
    desc: "Cada preenchimento chega instantaneamente no seu dashboard. Zero delay, zero perda.",
  },
  {
    icon: "🎯",
    title: "Landing que converte",
    desc: "Réplicas fiéis de ConectCar e Veloe. O visitante confia, o lead vira cliente.",
  },
  {
    icon: "💬",
    title: "Direto no WhatsApp",
    desc: "Configure um número e os dados do lead abrem automaticamente no chat. Sua equipe age na hora.",
  },
  {
    icon: "📊",
    title: "Quiz qualificado",
    desc: "Saiba quem já tem tag, frequência de uso e objetivo antes de ligar. Foco só em quem vale.",
  },
];

export default async function LoginPage() {
  const session = await getAppSession();
  if (session?.user) {
    if (session.user.impersonating) redirect("/dashboard");
    redirect(session.user.role === "SUPER_ADMIN" ? "/super" : "/dashboard");
  }

  return (
    <div className="login-split-shell">
      {/* ── Left: pitch ── */}
      <div className="login-left">
        <div className="login-left-inner">
          <Link href="/" className="login-brand">
            Top1Tags
          </Link>

          <div className="login-hero-copy">
            <p className="login-eyebrow">Plataforma de leads para correspondentes</p>
            <h1 className="login-h1">
              As melhores páginas<br />
              para o seu&nbsp;spam.
            </h1>
            <p className="login-sub">
              Colha leads em tempo real, qualifique com quiz e aplique com sua equipe
              direto no WhatsApp — tudo em um lugar só.
            </p>
          </div>

          <ul className="login-features">
            {FEATURES.map((f) => (
              <li key={f.title} className="login-feature-item">
                <span className="login-feature-icon">{f.icon}</span>
                <div>
                  <strong>{f.title}</strong>
                  <p>{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="login-footnote">
            Acesso somente por convite.{" "}
            <Link href="/cadastro">Tem um código? Criar conta →</Link>
          </p>
        </div>
      </div>

      {/* ── Right: form ── */}
      <div className="login-right">
        <div className="login-form-card">
          <div className="login-form-header">
            <h2>Entrar</h2>
            <p>Use seu vulgo e senha para acessar o painel.</p>
          </div>
          <LoginForm />
          <p className="login-form-footer">
            Não tem conta?{" "}
            <Link href="/cadastro">Criar com convite</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
