"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type Props = {
  token: string;
  prefilledEmail?: string;
};

export function RegisterForm({ token, prefilledEmail }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [email, setEmail] = useState(prefilledEmail || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, name, email, password, tenantName: tenantName || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Falha no cadastro");
      return;
    }

    const login = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (login?.error) {
      router.push("/login");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        Seu nome
        <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
      </label>
      <label>
        Nome da conta / empresa
        <input value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder="Opcional" />
      </label>
      <label>
        E-mail
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={Boolean(prefilledEmail)}
        />
      </label>
      <label>
        Senha
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Criando..." : "Criar conta"}
      </button>
    </form>
  );
}
