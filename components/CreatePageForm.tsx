"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND_LABELS, getTemplatesForBrand } from "@/lib/templates";
import { defaultPageConfig } from "@/lib/page-config";
import { EngagementConfigFields } from "@/components/EngagementConfigFields";
import { FieldLabel } from "@/components/HelpTip";

export function CreatePageForm() {
  const router = useRouter();
  const [brand, setBrand] = useState<"conectcar" | "veloe">("conectcar");
  const [templateId, setTemplateId] = useState("default");
  const [title, setTitle] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [config, setConfig] = useState(defaultPageConfig());
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
    <form className="panel-form" onSubmit={onSubmit}>
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

      <EngagementConfigFields value={config} onChange={setConfig} />

      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Criando..." : "Criar página"}
      </button>
    </form>
  );
}
