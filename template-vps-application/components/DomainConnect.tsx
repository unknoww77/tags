"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FieldLabel, HelpTip } from "@/components/HelpTip";

type DomainInfo = {
  id: string;
  hostname: string;
  nameservers: string[];
  nsStatus: string;
  sslMode: string;
  lastCheckedAt?: string | Date | null;
  lastError?: string | null;
};

type Props = {
  pageId: string;
  domain: DomainInfo | null;
};

export function DomainConnect({ pageId, domain: initial }: Props) {
  const router = useRouter();
  const [hostname, setHostname] = useState("");
  const [domain, setDomain] = useState(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/pages/${pageId}/domain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostname }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Falha ao conectar domínio");
      return;
    }
    setDomain(data.domain);
    router.refresh();
  }

  async function validateNow() {
    if (!domain) return;
    setValidating(true);
    setError("");
    const res = await fetch(`/api/domains/${domain.id}/validate`, { method: "POST" });
    const data = await res.json();
    setValidating(false);
    if (!res.ok) {
      setError(data.error || "Falha na validação");
      return;
    }
    setDomain(data.domain);
    router.refresh();
  }

  if (!domain) {
    return (
      <form className="panel-form" onSubmit={connect}>
        <h3 className="field-label-row">
          Conectar domínio
          <HelpTip text="Liga um domínio seu à landing. Criamos a zone na Cloudflare (SSL Flexible) e mostramos 2 nameservers para você apontar na registradora." />
        </h3>
        <label>
          <FieldLabel help="Digite só o domínio, sem https. Ex: meusite.com.br. Depois da confirmação, copie os nameservers e cole na sua registradora (GoDaddy, Registro.br etc.).">
            Domínio
          </FieldLabel>
          <input
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            placeholder="meusite.com.br"
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Configurando..." : "Confirmar domínio"}
        </button>
      </form>
    );
  }

  return (
    <div className="domain-box">
      <h3 className="field-label-row">
        Domínio: {domain.hostname}
        <HelpTip text="pending = ainda não apontou os NS. active = domínio ativo na Cloudflare. error = falha na checagem — use Verificar agora ou revise os nameservers." />
      </h3>
      <p>
        Status NS: <strong className={`status-${domain.nsStatus}`}>{domain.nsStatus}</strong>
        {" · "}SSL: <strong>{domain.sslMode}</strong>
        <HelpTip text="SSL Flexible: visitante ↔ Cloudflare em HTTPS; Cloudflare ↔ seu servidor em HTTP. É o modo configurado automaticamente." />
      </p>
      {domain.lastCheckedAt && (
        <p className="muted">
          Última verificação: {new Date(domain.lastCheckedAt).toLocaleString("pt-BR")}
        </p>
      )}
      {domain.lastError && <p className="form-error">{domain.lastError}</p>}
      <p className="muted field-label-row">
        Aponte o domínio para estes nameservers na registradora
        <HelpTip text="Na registradora do domínio, troque os nameservers pelos dois abaixo. A propagação pode levar de minutos a algumas horas. O sistema também checa sozinho a cada 10 minutos." />
      </p>
      <ul className="ns-list">
        {domain.nameservers.map((ns) => (
          <li key={ns}>
            <code>{ns}</code>
          </li>
        ))}
      </ul>
      <p className="muted">Validamos automaticamente a cada 10 minutos.</p>
      {error && <p className="form-error">{error}</p>}
      <button type="button" onClick={validateNow} disabled={validating}>
        {validating ? "Verificando..." : "Verificar agora"}
      </button>
    </div>
  );
}
