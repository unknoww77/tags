import type { LeadLossReason, LeadStatus } from "@prisma/client";

export const LEAD_STATUSES: LeadStatus[] = [
  "colhido",
  "usado",
  "perdido",
  "convertido",
];

export const STATUS_LABEL: Record<LeadStatus, string> = {
  colhido: "Colhido",
  usado: "Usado",
  perdido: "Perdido",
  convertido: "Convertido",
};

export const LOSS_REASONS: LeadLossReason[] = [
  "sem_contato",
  "sem_interesse",
  "duplicado",
  "fora_perfil",
  "outro",
];

export const LOSS_REASON_LABEL: Record<LeadLossReason, string> = {
  sem_contato: "Sem contato",
  sem_interesse: "Sem interesse",
  duplicado: "Duplicado",
  fora_perfil: "Fora do perfil",
  outro: "Outro",
};

/** Transições permitidas a partir de cada status */
export const ALLOWED_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  colhido: ["usado", "perdido", "convertido"],
  usado: ["convertido", "perdido"],
  perdido: [],
  convertido: [],
};

export function canTransition(from: LeadStatus, to: LeadStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function statusBadgeClass(status: LeadStatus): string {
  switch (status) {
    case "colhido":
      return "lead-badge-colhido";
    case "usado":
      return "lead-badge-usado";
    case "perdido":
      return "lead-badge-perdido";
    case "convertido":
      return "lead-badge-convertido";
  }
}

export type LeadKpiCounts = Record<LeadStatus, number>;

export function countByStatus<T extends { status: LeadStatus }>(items: T[]): LeadKpiCounts {
  const counts: LeadKpiCounts = {
    colhido: 0,
    usado: 0,
    perdido: 0,
    convertido: 0,
  };
  for (const item of items) {
    counts[item.status] += 1;
  }
  return counts;
}

export function conversionRate(counts: LeadKpiCounts): number {
  const total = counts.colhido + counts.usado + counts.perdido + counts.convertido;
  if (!total) return 0;
  return Math.round((counts.convertido / total) * 100);
}
