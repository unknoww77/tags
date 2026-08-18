"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EngagementConfigFields } from "@/components/EngagementConfigFields";
import { parsePageConfig, type PageEngagementConfig } from "@/lib/page-config";

type Props = {
  pageId: string;
  initialConfig: unknown;
};

export function PageConfigEditor({ pageId, initialConfig }: Props) {
  const router = useRouter();
  const [config, setConfig] = useState<PageEngagementConfig>(() => parsePageConfig(initialConfig));
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
    <div className="stack">
      <EngagementConfigFields value={config} onChange={setConfig} />
      {error && <p className="form-error">{error}</p>}
      {message && <p className="success-box">{message}</p>}
      <button type="button" onClick={save} disabled={saving}>
        {saving ? "Salvando..." : "Salvar engajamento"}
      </button>
    </div>
  );
}
