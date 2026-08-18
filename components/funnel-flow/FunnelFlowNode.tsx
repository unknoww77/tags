"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

export type FunnelNodeData = {
  kind: "start" | "itau" | "quiz" | "form" | "whatsapp" | "end";
  label: string;
  questionId?: string;
  options?: string[];
  fields?: string[];
};

const KIND_META: Record<
  FunnelNodeData["kind"],
  { icon: string; accent: string; title: string }
> = {
  start: { icon: "▶", accent: "#2dd4bf", title: "Início" },
  itau: { icon: "🟠", accent: "#ec7000", title: "Itaú" },
  quiz: { icon: "?", accent: "#38bdf8", title: "Quiz" },
  form: { icon: "📝", accent: "#a78bfa", title: "Formulário" },
  whatsapp: { icon: "💬", accent: "#25d366", title: "WhatsApp" },
  end: { icon: "✓", accent: "#4ade80", title: "Fim" },
};

export function FunnelFlowNode({ data, selected }: NodeProps) {
  const d = data as FunnelNodeData;
  const meta = KIND_META[d.kind];

  return (
    <div className={`funnel-flow-node${selected ? " is-selected" : ""}`}>
      {d.kind !== "start" && (
        <Handle type="target" position={Position.Top} className="funnel-flow-handle" />
      )}
      <div className="funnel-flow-node-head" style={{ borderColor: meta.accent }}>
        <span className="funnel-flow-node-icon">{meta.icon}</span>
        <span className="funnel-flow-node-type">{meta.title}</span>
      </div>
      <p className="funnel-flow-node-label">{d.label}</p>
      {d.kind === "quiz" && d.options && (
        <div className="funnel-flow-node-options">
          {d.options.slice(0, 3).map((o) => (
            <span key={o} className="funnel-flow-option-pill">
              {o}
            </span>
          ))}
          {d.options.length > 3 && (
            <span className="funnel-flow-option-pill muted">+{d.options.length - 3}</span>
          )}
        </div>
      )}
      {d.kind === "form" && d.fields && (
        <div className="funnel-flow-node-options">
          {d.fields.slice(0, 4).map((f) => (
            <span key={f} className="funnel-flow-option-pill">
              {f}
            </span>
          ))}
          {d.fields.length > 4 && (
            <span className="funnel-flow-option-pill muted">+{d.fields.length - 4}</span>
          )}
        </div>
      )}
      {d.kind !== "end" && (
        <Handle type="source" position={Position.Bottom} className="funnel-flow-handle" />
      )}
    </div>
  );
}
