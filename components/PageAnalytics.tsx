"use client";

import { useEffect, useState } from "react";

type Analytics = {
  days: number;
  totals: {
    views: number;
    ctaClicks: number;
    leads: number;
    ctaRate: number;
    leadRate: number;
  };
  topUtms: { key: string; count: number }[];
  topDevices: { key: string; count: number }[];
  topDomains: { key: string; count: number }[];
};

export function PageAnalytics({ pageId }: { pageId: string }) {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch(`/api/pages/${pageId}/analytics`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "Erro");
        setData(json);
      })
      .catch((e) => setError(e.message));
  }, [pageId]);

  if (error) return <p className="form-error">{error}</p>;
  if (!data) return <p className="muted">Carregando analytics...</p>;

  return (
    <div className="analytics">
      <div className="stat-grid">
        <div>
          <span>Visitas</span>
          <strong>{data.totals.views}</strong>
        </div>
        <div>
          <span>Cliques CTA</span>
          <strong>{data.totals.ctaClicks}</strong>
        </div>
        <div>
          <span>Leads</span>
          <strong>{data.totals.leads}</strong>
        </div>
        <div>
          <span>Taxa CTA</span>
          <strong>{(data.totals.ctaRate * 100).toFixed(1)}%</strong>
        </div>
      </div>

      <div className="two-col">
        <div>
          <h4>Top UTMs</h4>
          <ul>
            {data.topUtms.map((u) => (
              <li key={u.key}>
                {u.key} — {u.count}
              </li>
            ))}
            {!data.topUtms.length && <li className="muted">Sem dados</li>}
          </ul>
        </div>
        <div>
          <h4>Dispositivos</h4>
          <ul>
            {data.topDevices.map((u) => (
              <li key={u.key}>
                {u.key} — {u.count}
              </li>
            ))}
            {!data.topDevices.length && <li className="muted">Sem dados</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
