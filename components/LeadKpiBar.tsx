"use client";

import type { LeadStatus } from "@prisma/client";
import { LEAD_STATUSES, STATUS_LABEL, countByStatus, conversionRate } from "@/lib/leads";

type Props = {
  leads: { status: LeadStatus }[];
  active?: LeadStatus | "all";
  onSelect?: (status: LeadStatus | "all") => void;
};

export function LeadKpiBar({ leads, active = "all", onSelect }: Props) {
  const counts = countByStatus(leads);
  const total = leads.length;
  const rate = conversionRate(counts);

  return (
    <div className="admin-kpi-bar">
      <button
        type="button"
        className={`admin-kpi-card${active === "all" ? " is-active" : ""}`}
        onClick={() => onSelect?.("all")}
      >
        <span>Total</span>
        <strong>{total}</strong>
        <em>{rate}% convertidos</em>
      </button>
      {LEAD_STATUSES.map((status) => {
        const n = counts[status];
        const pct = total ? Math.round((n / total) * 100) : 0;
        return (
          <button
            key={status}
            type="button"
            className={`admin-kpi-card admin-kpi-${status}${active === status ? " is-active" : ""}`}
            onClick={() => onSelect?.(status)}
          >
            <span>{STATUS_LABEL[status]}</span>
            <strong>{n}</strong>
            <em>{pct}%</em>
          </button>
        );
      })}
    </div>
  );
}
