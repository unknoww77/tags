"use client";

import { useState } from "react";
import type { LeadLossReason } from "@prisma/client";
import { LOSS_REASONS, LOSS_REASON_LABEL } from "@/lib/leads";

type Props = {
  open: boolean;
  leadName: string | null;
  saving?: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (data: { lossReason: LeadLossReason; lossNote?: string }) => void;
};

export function LeadLossModal({
  open,
  leadName,
  saving = false,
  error,
  onClose,
  onConfirm,
}: Props) {
  const [lossReason, setLossReason] = useState<LeadLossReason>("sem_contato");
  const [lossNote, setLossNote] = useState("");

  if (!open) return null;

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="admin-modal"
        role="dialog"
        aria-labelledby="loss-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="loss-modal-title">Marcar como perdido</h3>
        <p className="muted">
          {leadName ? `Lead: ${leadName}` : "Informe o motivo da perda."} Motivo obrigatório.
        </p>

        <label>
          Motivo
          <select
            value={lossReason}
            onChange={(e) => setLossReason(e.target.value as LeadLossReason)}
          >
            {LOSS_REASONS.map((r) => (
              <option key={r} value={r}>
                {LOSS_REASON_LABEL[r]}
              </option>
            ))}
          </select>
        </label>

        <label>
          Observação (opcional)
          <textarea
            value={lossNote}
            onChange={(e) => setLossNote(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Detalhes adicionais..."
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="admin-modal-actions">
          <button type="button" className="selector-btn" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            type="button"
            className="cta-btn admin-btn-danger"
            disabled={saving}
            onClick={() => onConfirm({ lossReason, lossNote: lossNote.trim() || undefined })}
          >
            {saving ? "Salvando..." : "Confirmar perda"}
          </button>
        </div>
      </div>
    </div>
  );
}
