import type { LeadStatus } from "@prisma/client";
import { STATUS_LABEL, statusBadgeClass } from "@/lib/leads";

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`lead-status-badge ${statusBadgeClass(status)}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
