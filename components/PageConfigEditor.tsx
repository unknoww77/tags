"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EngagementConfigFields } from "@/components/EngagementConfigFields";
import { FunnelFlowEditor } from "@/components/FunnelFlowEditor";
import { PagePreview } from "@/components/PagePreview";
import { SentinelTrackingConfigFields } from "@/components/SentinelTrackingConfigFields";
import { parsePageConfig, type PageEngagementConfig } from "@/lib/page-config";

type Props = {
  pageId: string;
  initialConfig: unknown;
  brand: "conectcar" | "veloe";
  templateId: string;
  title: string;
  headline: string | null;
  description: string | null;
};

export function PageConfigEditor({
  pageId,
  initialConfig,
  brand,
  templateId,
  title,
  headline,
  description,
}: Props) {
  const router = useRouter();
  const [config, setConfig] = useState<PageEngagementConfig>(() => parsePageConfig(initialConfig));
  const [activeTab, setActiveTab] = useState<"engajamento" | "trackeamento">("engajamento");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");

    if (config.sendToWhatsapp && config.whatsappNumber.length < 10) {
      setSaving(false);
      setError("Informe um WhatsApp válido (com DDI).");
      return;
    }

    if (config.sentinel?.enabled && !config.sentinel.apiKey.trim()) {
      setSaving(false);
      setError("Informe a API key do Sentinel para ativar o trackeamento.");
      return;
    }

    const res = await fetch(`/api/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ configJson: config }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Erro ao salvar");
      return;
    }
    setMessage("Configuração salva.");
    router.refresh();
  }

  return (
    <div className="config-editor-stack">
      <div className="config-editor-visual-row">
        <FunnelFlowEditor config={config} onChange={setConfig} compact />
        <div className="config-preview-panel">
          <div className="config-preview-panel-head">
            <div className="new-page-preview-label">Preview do fluxo</div>
            <p className="muted tiny">Clique nas respostas do quiz e avance o funil ao vivo.</p>
          </div>
          <div className="page-preview-frame">
            <PagePreview
              brand={brand}
              templateId={templateId}
              headline={headline || title}
              description={description || ""}
              config={config}
            />
          </div>
        </div>
      </div>

      <div className="config-editor-settings">
        <div className="config-tabs">
          <button
            type="button"
            className={`selector-btn${activeTab === "engajamento" ? " is-active" : ""}`}
            onClick={() => setActiveTab("engajamento")}
          >
            Engajamento
          </button>
          <button
            type="button"
            className={`selector-btn${activeTab === "trackeamento" ? " is-active" : ""}`}
            onClick={() => setActiveTab("trackeamento")}
          >
            Trackeamento
          </button>
        </div>
        {activeTab === "engajamento" ? (
          <EngagementConfigFields value={config} onChange={setConfig} />
        ) : (
          <SentinelTrackingConfigFields value={config} onChange={setConfig} brand={brand} />
        )}
        {error && <p className="form-error">{error}</p>}
        {message && <p className="success-box">{message}</p>}
        <button type="button" onClick={save} disabled={saving}>
          {saving ? "Salvando..." : "Salvar engajamento"}
        </button>
      </div>
    </div>
  );
}
