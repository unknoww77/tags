"use client";

import { useEffect, useState } from "react";

type Audit = {
  id: string;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
};

export function AuditLogPanel() {
  const [logs, setLogs] = useState<Audit[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/super/audit")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Erro");
        setLogs(d.logs);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="form-error">{error}</p>;
  if (!logs.length) return <p className="muted">Nenhum evento ainda.</p>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Quando</th>
            <th>Quem</th>
            <th>Ação</th>
            <th>Alvo</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id}>
              <td>{new Date(l.createdAt).toLocaleString("pt-BR")}</td>
              <td>{l.actorEmail || "—"}</td>
              <td>
                <code>{l.action}</code>
              </td>
              <td className="tiny">
                {l.targetType || "—"} {l.targetId || ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
