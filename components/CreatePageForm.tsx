"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND_LABELS, getTemplatesForBrand } from "@/lib/templates";
import { defaultPageConfig, defaultItauPageConfig, veloeSentinelPresets, conectcarSentinelPresets, defaultSentinelConfig } from "@/lib/page-config";
import { EngagementConfigFields } from "@/components/EngagementConfigFields";
import { FunnelFlowEditor } from "@/components/FunnelFlowEditor";
import { FieldLabel } from "@/components/HelpTip";
import { PagePreview } from "@/components/PagePreview";
import { SentinelTrackingConfigFields } from "@/components/SentinelTrackingConfigFields";

export function CreatePageForm() {
  const router = useRouter();
  const [brand, setBrand] = useState<"conectcar" | "veloe">("conectcar");
  const [templateId, setTemplateId] = useState("default");
  const [title, setTitle] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [config, setConfig] = useState(defaultPageConfig());
  const [activeTab, setActiveTab] = useState<"engajamento" | "trackeamento">("engajamento");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const templates = getTemplatesForBrand(brand);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (config.sendToWhatsapp && config.whatsappNumber.length < 10) {
      setLoading(false);
      setError("Informe um WhatsApp válido (com DDI).");
      return;
    }

    if (config.sentinel?.enabled && !config.sentinel.apiKey.trim()) {
      setLoading(false);
      setError("Informe a API key do Sentinel para ativar o trackeamento.");
      return;
    }

    if (config.showForm) {
      const anyField = Object.values(config.formFields).some(Boolean);
      if (!anyField) {
        setLoading(false);
        setError("Selecione ao menos um campo do formulário.");
        return;
      }
    }

    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand,
        templateId,
        title,
        headline: headline || undefined,
        description: description || undefined,
        configJson: config,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Erro ao criar página");
      return;
    }
    router.push(`/dashboard/pages/${data.page.id}`);
    router.refresh();
  }

  return (
    <div className="config-editor-stack">
      <div className="config-editor-visual-row">
        <FunnelFlowEditor config={config} onChange={setConfig} compact />
        <div className="config-preview-panel">
          <div className="config-preview-panel-head">
            <div className="new-page-preview-label">Preview ao vivo</div>
            <p className="muted tiny">Teste o quiz e o formulário clicando no preview.</p>
          </div>
          <div className="page-preview-frame">
            <PagePreview
              brand={brand}
              templateId={templateId}
              headline={headline}
              description={description}
              config={config}
            />
          </div>
        </div>
      </div>
      <div className="config-editor-settings">
      <form className="panel-form new-page-form" onSubmit={onSubmit}>
      <div className="selector-group">
        <span className="selector-label">
          <FieldLabel help="Escolha a marca da landing. Isso define o visual e o texto base (ConectCar ou Veloe). Você pode mudar só criando outra página.">
            Marca / tag
          </FieldLabel>
        </span>
        <div className="selector-row">
          <button
            type="button"
            className={`selector-btn${brand === "conectcar" ? " is-active" : ""}`}
            onClick={() => {
              setBrand("conectcar");
              setTemplateId("default");
              setConfig((prev) => ({
                ...prev,
                sentinel: {
                  ...(prev.sentinel ?? defaultSentinelConfig()),
                  selectors:
                    prev.sentinel?.selectors?.length
                      ? prev.sentinel.selectors
                      : conectcarSentinelPresets(),
                },
              }));
            }}
          >
            {BRAND_LABELS.conectcar}
          </button>
          <button
            type="button"
            className={`selector-btn${brand === "veloe" ? " is-active" : ""}`}
            onClick={() => {
              setBrand("veloe");
              setTemplateId("default");
              setConfig((prev) => ({
                ...prev,
                sentinel: {
                  ...(prev.sentinel ?? defaultSentinelConfig()),
                  selectors:
                    prev.sentinel?.selectors?.length
                      ? prev.sentinel.selectors
                      : veloeSentinelPresets(),
                },
              }));
            }}
          >
            {BRAND_LABELS.veloe}
          </button>
        </div>
      </div>

      <div className="selector-group">
        <span className="selector-label">
          <FieldLabel help="Completo = hero + planos + funil. Compacto = hero curto + funil (melhor para ads).">
            Modelo / template
          </FieldLabel>
        </span>
        <div className="selector-row wrap">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`selector-btn${templateId === t.id ? " is-active" : ""}`}
              onClick={() => setTemplateId(t.id)}
            >
              {t.name.replace(/^ConectCar — |^Veloe — /, "")}
            </button>
          ))}
        </div>
      </div>

      <label>
        <FieldLabel help="Nome interno da página no dashboard. Não aparece para o visitante. Use algo fácil de reconhecer, ex: Campanha Instagram Março.">
          Título interno
        </FieldLabel>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        <FieldLabel help="Título grande no topo da landing (hero). Se deixar vazio, usamos o título interno. Escreva uma frase curta e clara.">
          Headline
        </FieldLabel>
        <input value={headline} onChange={(e) => setHeadline(e.target.value)} />
      </label>
      <label>
        <FieldLabel help="Texto de apoio abaixo da headline. Explique o benefício em 1–2 frases. Se vazio, a landing usa um texto padrão da marca.">
          Descrição
        </FieldLabel>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </label>

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
      <button type="submit" disabled={loading}>
        {loading ? "Criando..." : "Criar página"}
      </button>
    </form>
      </div>
    </div>
  );
}
