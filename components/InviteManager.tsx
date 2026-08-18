"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Invite = {
  id: string;
  token: string;
  email: string | null;
  tenantName: string | null;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
};

type Props = {
  initialInvites: Invite[];
  appUrl: string;
};

export function InviteManager({ initialInvites, appUrl }: Props) {
  const router = useRouter();
  const [invites, setInvites] = useState(initialInvites);
  const [tenantName, setTenantName] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantName: tenantName.trim() || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Erro ao gerar convite");
      return;
    }
    setLink(data.link);
    setInvites((prev) => [data.invite, ...prev]);
    setTenantName("");
    router.refresh();
  }

  async function revoke(id: string) {
    await fetch(`/api/invites/${id}`, { method: "DELETE" });
    setInvites((prev) =>
      prev.map((i) => (i.id === id ? { ...i, revokedAt: new Date().toISOString() } : i))
    );
  }

  return (
    <div className="stack">
      <form className="panel-form" onSubmit={createInvite}>
        <h3>Gerar convite</h3>
        <label>
          Nome do tenant (opcional)
          <input
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            placeholder="Deixe vazio ou use 2+ caracteres"
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Gerando..." : "Gerar convite"}
        </button>
        {link && (
          <p className="success-box">
            Link: <code>{link}</code>
          </p>
        )}
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Token / link</th>
              <th>Expira</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invites.map((inv) => {
              const status = inv.revokedAt
                ? "revogado"
                : inv.usedAt
                  ? "usado"
                  : new Date(inv.expiresAt) < new Date()
                    ? "expirado"
                    : "ativo";
              return (
                <tr key={inv.id}>
                  <td>
                    <code className="tiny">{`${appUrl}/cadastro?invite=${inv.token}`}</code>
                  </td>
                  <td>{new Date(inv.expiresAt).toLocaleDateString("pt-BR")}</td>
                  <td>{status}</td>
                  <td>
                    {status === "ativo" && (
                      <button type="button" className="linkish" onClick={() => revoke(inv.id)}>
                        Revogar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
