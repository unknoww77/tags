"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  userName: string;
  tenantName: string;
};

export function ImpersonationBanner({ userName, tenantName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function stop() {
    setLoading(true);
    await fetch("/api/impersonate", { method: "DELETE" });
    setLoading(false);
    router.push("/super");
    router.refresh();
  }

  return (
    <div className="impersonation-banner">
      <p>
        Você está acessando a conta de <strong>{userName}</strong> ({tenantName}). Sua sessão de
        super admin continua ativa.
      </p>
      <button type="button" onClick={stop} disabled={loading}>
        {loading ? "Saindo..." : "Voltar ao Super Admin"}
      </button>
    </div>
  );
}
