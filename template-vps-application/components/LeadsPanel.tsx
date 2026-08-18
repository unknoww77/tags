"use client";

import { useEffect, useState } from "react";

type Lead = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  mode: string;
  status: "new" | "contacted" | "converted" | "discarded";
  whatsappEnabled: boolean;
  whatsappOpened: boolean;
  quizJson: Record<string, string> | null;
  formJson: Record<string, string> | null;
  utmSource: string | null;
  createdAt: string;
};

const STATUS_LABEL: Record<Lead["status"], string> = {
  new: "Novo",
  contacted: "Contatado",
  converted: "Convertido",
  discarded: "Descartado",
};

export function LeadsPanel({ pageId }: { pageId: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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

  async function setStatus(id: string, status: Lead["status"]) {
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    }
  }

  if (loading) return <p className="muted">Carregando leads...</p>;
  if (error) return <p className="form-error">{error}</p>;

  return (
    <div className="stack">
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
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Contato</th>
                <th>Status</th>
                <th>Modo</th>
                <th>WhatsApp</th>
                <th>Quiz</th>
                <th>UTM</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const quiz =
                  lead.quizJson && typeof lead.quizJson === "object" ? lead.quizJson : {};
                const quizText = Object.entries(quiz)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(" · ");

                return (
                  <tr key={lead.id}>
                    <td>{new Date(lead.createdAt).toLocaleString("pt-BR")}</td>
                    <td>
                      <div>{lead.name || "—"}</div>
                      <div className="muted">{lead.phone || "—"}</div>
                      <div className="muted">{lead.email || ""}</div>
                      <div className="muted">{lead.city || ""}</div>
                    </td>
                    <td>
                      <select
                        value={lead.status}
                        onChange={(e) => setStatus(lead.id, e.target.value as Lead["status"])}
                      >
                        {(Object.keys(STATUS_LABEL) as Lead["status"][]).map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{lead.mode === "whatsapp" ? "WhatsApp" : "Só contato"}</td>
                    <td>
                      {!lead.whatsappEnabled ? (
                        <span className="muted">n/a</span>
                      ) : lead.whatsappOpened ? (
                        <span className="status-active">Abriu</span>
                      ) : (
                        <span className="status-error">Não abriu</span>
                      )}
                    </td>
                    <td className="tiny">{quizText || "—"}</td>
                    <td>{lead.utmSource || "(direct)"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
