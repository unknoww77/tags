"use client";

import { useEffect, useMemo, useState } from "react";
import type { LeadLossReason, LeadStatus } from "@prisma/client";
import { LeadKpiBar } from "@/components/LeadKpiBar";
import { LeadLossModal } from "@/components/LeadLossModal";
import { LeadStatusBadge } from "@/components/LeadStatusBadge";
import {
  ALLOWED_TRANSITIONS,
  LOSS_REASON_LABEL,
  STATUS_LABEL,
} from "@/lib/leads";

type Lead = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  mode: string;
  status: LeadStatus;
  lossReason: LeadLossReason | null;
  lossNote: string | null;
  whatsappEnabled: boolean;
  whatsappOpened: boolean;
  whatsappNumberUsed: string | null;
  quizJson: Record<string, string> | null;
  formJson: Record<string, string> | null;
  utmSource: string | null;
  createdAt: string;
};

function maskPhone(n: string): string {
  const d = n.replace(/\D/g, "");
  if (d.length < 4) return d;
  return `${d.slice(0, 4)}…${d.slice(-4)}`;
}

export function LeadsPanel({ pageId }: { pageId: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [lossTarget, setLossTarget] = useState<Lead | null>(null);
  const [lossError, setLossError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    void fetch(`/api/pages/${pageId}/leads`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Erro");
        setLeads(data.leads);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  const filtered = useMemo(
    () => (filter === "all" ? leads : leads.filter((l) => l.status === filter)),
    [leads, filter]
  );

  const grouped = useMemo(() => {
    const map: Record<LeadStatus, Lead[]> = {
      colhido: [],
      usado: [],
      perdido: [],
      convertido: [],
    };
    for (const lead of filtered) {
      map[lead.status].push(lead);
    }
    return map;
  }, [filtered]);

  async function patchLead(
    id: string,
    body: { status: LeadStatus; lossReason?: LeadLossReason; lossNote?: string }
  ) {
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Falha ao atualizar");
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...data.lead } : l)));
  }

  async function changeStatus(lead: Lead, status: LeadStatus) {
    if (status === "perdido") {
      setLossTarget(lead);
      setLossError("");
      return;
    }
    try {
      await patchLead(lead.id, { status });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    }
  }

  async function confirmLoss(data: { lossReason: LeadLossReason; lossNote?: string }) {
    if (!lossTarget) return;
    setSaving(true);
    setLossError("");
    try {
      await patchLead(lossTarget.id, {
        status: "perdido",
        lossReason: data.lossReason,
        lossNote: data.lossNote,
      });
      setLossTarget(null);
    } catch (e) {
      setLossError(e instanceof Error ? e.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="muted">Carregando leads...</p>;
  if (error) return <p className="form-error">{error}</p>;

  return (
    <div className="admin-leads-panel stack">
      <LeadKpiBar leads={leads} active={filter} onSelect={setFilter} />

      <div className="selector-row wrap">
        <a className="selector-btn" href={`/api/pages/${pageId}/leads/export`}>
          Exportar CSV
        </a>
        <button type="button" className="selector-btn" onClick={load}>
          Atualizar
        </button>
      </div>

      {!leads.length ? (
        <p className="muted">Nenhum lead ainda.</p>
      ) : (
        <>
          <div className="admin-leads-kanban">
            {(Object.keys(grouped) as LeadStatus[]).map((status) => (
              <section key={status} className="admin-leads-column">
                <header>
                  <h4>{STATUS_LABEL[status]}</h4>
                  <span>{grouped[status].length}</span>
                </header>
                <div className="admin-leads-cards">
                  {grouped[status].map((lead) => (
                    <LeadCard key={lead.id} lead={lead} onStatusChange={changeStatus} />
                  ))}
                  {!grouped[status].length && (
                    <p className="muted tiny admin-leads-empty">Nenhum lead</p>
                  )}
                </div>
              </section>
            ))}
          </div>

          <div className="admin-leads-tabs">
            {(Object.keys(grouped) as LeadStatus[]).map((status) => (
              <details key={status} className="admin-leads-tab" open={filter === status || filter === "all"}>
                <summary>
                  {STATUS_LABEL[status]} ({grouped[status].length})
                </summary>
                <div className="admin-leads-cards">
                  {grouped[status].map((lead) => (
                    <LeadCard key={lead.id} lead={lead} onStatusChange={changeStatus} />
                  ))}
                </div>
              </details>
            ))}
          </div>
        </>
      )}

      <LeadLossModal
        open={Boolean(lossTarget)}
        leadName={lossTarget?.name ?? null}
        saving={saving}
        error={lossError}
        onClose={() => setLossTarget(null)}
        onConfirm={confirmLoss}
      />
    </div>
  );
}

function LeadCard({
  lead,
  onStatusChange,
}: {
  lead: Lead;
  onStatusChange: (lead: Lead, status: LeadStatus) => void;
}) {
  const quiz =
    lead.quizJson && typeof lead.quizJson === "object" ? lead.quizJson : {};
  const quizText = Object.entries(quiz)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");

  const nextActions = ALLOWED_TRANSITIONS[lead.status];

  return (
    <article className="admin-lead-card">
      <div className="admin-lead-card-head">
        <LeadStatusBadge status={lead.status} />
        <time className="tiny muted">{new Date(lead.createdAt).toLocaleString("pt-BR")}</time>
      </div>

      <div className="admin-lead-contact">
        <strong>{lead.name || "Sem nome"}</strong>
        <span>{lead.phone || "—"}</span>
        {lead.email && <span className="muted">{lead.email}</span>}
        {lead.city && <span className="muted">{lead.city}</span>}
        {lead.formJson &&
          Object.entries(lead.formJson)
            .filter(([key]) => !["name", "phone", "email", "city"].includes(key))
            .map(([key, value]) => (
              <span key={key} className="muted tiny">
                {fieldLabel(key)}: {value || "—"}
              </span>
            ))}
      </div>

      <div className="admin-lead-meta tiny">
        <span>{lead.mode === "whatsapp" ? "WhatsApp" : lead.mode === "chat" ? "Chat" : "Contato"}</span>
        {lead.whatsappEnabled && (
          <span className={lead.whatsappOpened ? "status-active" : "status-error"}>
            WA {lead.whatsappOpened ? "abriu" : "não abriu"}
          </span>
        )}
        {lead.whatsappNumberUsed && (
          <span className="muted">Nº {maskPhone(lead.whatsappNumberUsed)}</span>
        )}
        <span>UTM: {lead.utmSource || "(direct)"}</span>
      </div>

      {quizText && <p className="tiny muted admin-lead-quiz">{quizText}</p>}

      {lead.status === "perdido" && lead.lossReason && (
        <p className="tiny admin-lead-loss">
          Motivo: {LOSS_REASON_LABEL[lead.lossReason]}
          {lead.lossNote ? ` — ${lead.lossNote}` : ""}
        </p>
      )}

      {nextActions.length > 0 && (
        <div className="admin-lead-actions">
          {nextActions.map((status) => (
            <button
              key={status}
              type="button"
              className={`selector-btn admin-lead-action-${status}`}
              onClick={() => onStatusChange(lead, status)}
            >
              {status === "perdido" ? "Marcar perdido" : STATUS_LABEL[status]}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

function fieldLabel(key: string) {
  const labels: Record<string, string> = {
    placa: "Placa",
    cpf: "CPF",
    birthDate: "Nascimento",
    income: "Renda",
  };
  return labels[key] || key;
}
