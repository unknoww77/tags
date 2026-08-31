"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

const NS_LABEL: Record<string, string> = {
  pending: "Aguardando nameservers",
  active: "Ativo",
  error: "Erro na verificação",
};

function formatCheckedAt(value: string | Date | null | undefined) {
  if (!value) return null;
  return new Date(value).toLocaleString("pt-BR");
}

export function DomainConnect({ pageId, domain: initial }: Props) {
  const router = useRouter();
  const [hostname, setHostname] = useState("");
  const [domain, setDomain] = useState(initial);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [conflictPageId, setConflictPageId] = useState<string | null>(null);
  const [conflictPageTitle, setConflictPageTitle] = useState<string | null>(null);

  useEffect(() => {
    setDomain(initial);
  }, [initial]);

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    setConflictPageId(null);
    setConflictPageTitle(null);
    try {
      const res = await fetch(`/api/pages/${pageId}/domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostname }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || "Falha ao conectar domínio";
        setError(msg);
        setConflictPageId(
          data.existingPageId && data.existingPageId !== pageId
            ? data.existingPageId
            : null
        );
        setConflictPageTitle(
          data.existingPageTitle && data.existingPageId !== pageId
            ? data.existingPageTitle
            : null
        );
        return;
      }
      setDomain(data.domain);
      setInfo(
        data.domain?.nsStatus === "active"
          ? "Domínio ativo na Cloudflare."
          : "Zone criada. Agora aponte os nameservers na registradora e clique em Verificar."
      );
      router.refresh();
    } catch {
      setError("Falha de rede ao conectar domínio");
    } finally {
      setLoading(false);
    }
  }

  async function validateNow() {
    if (!domain) return;
    setValidating(true);
    setError("");
    setInfo("");
    setConflictPageId(null);
    setConflictPageTitle(null);
    try {
      const res = await fetch(`/api/domains/${domain.id}/validate`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Falha na validação");
        return;
      }

      const next = data.domain as DomainInfo;
      setDomain(next);

      if (next.nsStatus === "active") {
        setInfo("Nameservers confirmados. Domínio ativo na Cloudflare.");
      } else if (next.nsStatus === "error") {
        setError(next.lastError || "Cloudflare retornou erro na verificação.");
      } else {
        setInfo(
          "Ainda pendente. Confira se os nameservers abaixo estão exatamente iguais na registradora. A propagação pode levar de minutos a 24h."
        );
      }
      router.refresh();
    } catch {
      setError("Falha de rede ao verificar domínio");
    } finally {
      setValidating(false);
    }
  }

  async function removeDomain() {
    if (!domain) return;
    const ok = window.confirm(
      `Remover ${domain.hostname} desta página? Você poderá conectar em outra landing depois. A zone na Cloudflare não é apagada automaticamente.`
    );
    if (!ok) return;

    setRemoving(true);
    setError("");
    setInfo("");
    setConflictPageId(null);
    setConflictPageTitle(null);
    try {
      const res = await fetch(`/api/domains/${domain.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Falha ao remover domínio");
        return;
      }
      setDomain(null);
      setHostname("");
      setInfo(`${data.hostname || domain.hostname} removido. Agora você pode conectar em outra página.`);
      router.refresh();
    } catch {
      setError("Falha de rede ao remover domínio");
    } finally {
      setRemoving(false);
    }
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
        {error && (
          <p className="form-error" style={{ whiteSpace: "pre-wrap", lineHeight: 1.45 }}>
            {error}
            {conflictPageId && (
              <>
                {" "}
                <Link href={`/dashboard/pages/${conflictPageId}`} className="domain-error-link">
                  Abrir {conflictPageTitle ? `"${conflictPageTitle}"` : "página"}
                </Link>
              </>
            )}
          </p>
        )}
        {info && <p className="form-info">{info}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Configurando..." : "Confirmar domínio"}
        </button>
      </form>
    );
  }

  const statusLabel = NS_LABEL[domain.nsStatus] ?? domain.nsStatus;
  const isActive = domain.nsStatus === "active";
  const checkedAt = formatCheckedAt(domain.lastCheckedAt);

  return (
    <div className="domain-box">
      <h3 className="field-label-row">
        Domínio: {domain.hostname}
        <HelpTip text="Pendente = ainda não apontou os NS na registradora. Ativo = Cloudflare já detectou os nameservers. Erro = falha na checagem." />
      </h3>

      <p>
        Status NS:{" "}
        <strong className={`status-${domain.nsStatus}`}>{statusLabel}</strong>
        {" · "}SSL: <strong>{domain.sslMode}</strong>
      </p>

      {checkedAt && <p className="muted">Última verificação: {checkedAt}</p>}

      {isActive ? (
        <p className="form-info">
          Domínio ativo. O hostname já pode responder pela landing (após propagação DNS).
        </p>
      ) : (
        <>
          <p className="muted field-label-row">
            Aponte o domínio para estes nameservers na registradora
            <HelpTip text="Na registradora do domínio, troque os nameservers pelos dois abaixo. Depois clique em Verificar agora." />
          </p>
          <ul className="ns-list">
            {(domain.nameservers ?? []).map((ns) => (
              <li key={ns}>
                <code>{ns}</code>
              </li>
            ))}
          </ul>
          <p className="muted">O sistema também checa sozinho a cada 10 minutos.</p>
        </>
      )}

      {domain.lastError && <p className="form-error">{domain.lastError}</p>}
      {error && <p className="form-error">{error}</p>}
      {info && <p className="form-info">{info}</p>}

      <div className="domain-actions">
        <button type="button" onClick={validateNow} disabled={validating || removing}>
          {validating ? "Verificando..." : "Verificar agora"}
        </button>
        <button
          type="button"
          className="btn-danger-outline"
          onClick={removeDomain}
          disabled={validating || removing}
        >
          {removing ? "Removendo..." : "Remover domínio"}
        </button>
      </div>
    </div>
  );
}
