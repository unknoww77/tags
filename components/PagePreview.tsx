"use client";

import { useEffect, useMemo, useState } from "react";
import { FORM_FIELD_LABELS, type FormFieldKey, type PageEngagementConfig } from "@/lib/page-config";

type Props = {
  brand: "conectcar" | "veloe";
  templateId: string;
  headline: string;
  description: string;
  config: PageEngagementConfig;
};

const CC_ORANGE = "#ff6a38";
const CC_ORANGE_SOFT = "#ff8a5c";
const VL_PURPLE = "#230c87";
const VL_CYAN = "#25d6e9";

export function PagePreview({ brand, headline, description, config }: Props) {
  const isCC = brand === "conectcar";
  const primary = isCC ? CC_ORANGE : VL_PURPLE;
  const accent = isCC ? CC_ORANGE_SOFT : VL_CYAN;

  const heroText = headline || (isCC ? "Peça sua tag ConectCar" : "Peça sua tag Veloe");
  const heroSub =
    description ||
    (isCC
      ? "Pode ir tranquilo, por onde você for!"
      : "A tag de pedágio mais completa do Brasil.");

  const hasQuiz = config.showQuiz && config.quizQuestions.length > 0;
  const hasForm = config.showForm;
  const hasWpp = config.sendToWhatsapp && config.whatsappNumber.length >= 10;
  const vehicleQuestion = useMemo(
    () =>
      config.quizQuestions.find((q) =>
        /ve[ií]culo registrado em seu nome/i.test(q.question)
      )?.question ?? null,
    [config.quizQuestions]
  );
  const [previewStep, setPreviewStep] = useState<"hero" | "quiz" | "form" | "done">(
    hasQuiz ? "quiz" : hasForm ? "form" : "hero"
  );
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    setAnswers({});
    setQuizIndex(0);
    setPreviewStep(hasQuiz ? "quiz" : hasForm ? "form" : "hero");
  }, [hasQuiz, hasForm, config.quizQuestions.length, config.itauMode]);

  const enabledFields = useMemo(() => {
    let fields = (Object.keys(config.formFields) as FormFieldKey[]).filter((k) => config.formFields[k]);
    if (config.itauMode && fields.includes("placa") && vehicleQuestion) {
      const vehicleAnswer = answers[vehicleQuestion] ?? "";
      const hasVehicle = /^sim/i.test(vehicleAnswer);
      fields = fields.filter((key) => key !== "placa" || hasVehicle);
    }
    return fields;
  }, [answers, config.formFields, config.itauMode, vehicleQuestion]);

  function resetFlow() {
    setAnswers({});
    setQuizIndex(0);
    setPreviewStep(hasQuiz ? "quiz" : hasForm ? "form" : "hero");
  }

  function pickQuizAnswer(question: string, option: string) {
    const nextAnswers = { ...answers, [question]: option };
    setAnswers(nextAnswers);
    if (quizIndex + 1 < config.quizQuestions.length) {
      setQuizIndex((prev) => prev + 1);
      return;
    }
    if (hasForm) {
      setPreviewStep("form");
      return;
    }
    setPreviewStep("done");
  }

  return (
    <div className="page-preview-root">
      <div className="page-preview-chrome">
        <span className="page-preview-dot is-red" />
        <span className="page-preview-dot is-yellow" />
        <span className="page-preview-dot is-green" />
        <div className="page-preview-url">top1tags.dev/s/sua-pagina</div>
      </div>

      <div className="page-preview-scroll">
        {/* header */}
        <div
          style={{
            background: isCC ? "#fff" : VL_PURPLE,
            borderBottom: `3px solid ${primary}`,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: 16,
              color: isCC ? primary : "#fff",
              letterSpacing: -0.5,
            }}
          >
            {isCC ? "ConectCar" : "Veloe"}
          </div>
          <div
            style={{
              background: primary,
              color: "#fff",
              borderRadius: 20,
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            Peça já
          </div>
        </div>

        {/* alert bar */}
        <div
          style={{
            background: isCC ? "#fff3cd" : "#e8f4f8",
            color: "#555",
            fontSize: 10,
            padding: "5px 16px",
            textAlign: "center",
          }}
        >
          {isCC
            ? "ATENÇÃO: Cuidado com falsos atendentes. Use apenas canais oficiais."
            : "Vantagens exclusivas para você e sua família."}
        </div>

        {/* hero */}
        <div
          style={{
            background: isCC
              ? `linear-gradient(165deg, ${primary} 0%, ${primary} 55%, ${accent} 100%)`
              : `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`,
            color: "#fff",
            padding: "28px 16px 24px",
            textAlign: "center",
          }}
        >
          <h1 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>
            {heroText}
          </h1>
          <p style={{ margin: "0 0 16px", fontSize: 12, opacity: 0.9 }}>{heroSub}</p>
          <div
            style={{
              background: "#fff",
              color: primary,
              fontWeight: 700,
              fontSize: 12,
              borderRadius: 24,
              padding: "8px 20px",
              display: "inline-block",
            }}
          >
            PEÇA JÁ ↓
          </div>
        </div>

        {/* funil */}
        <div style={{ padding: "20px 16px" }}>
          <div
            style={{
              borderTop: `3px solid ${primary}`,
              paddingTop: 16,
            }}
          >
            {/* Badge Itaú */}
            {config.itauMode && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: "linear-gradient(90deg,#ec7000,#f59e0b)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 20,
                  padding: "4px 12px",
                  marginBottom: 12,
                }}
              >
                🟠 Promoção exclusiva para clientes Itaú
              </div>
            )}
            {config.itauMode && (
              <p style={{ fontSize: 10, color: "#6b7280", margin: "0 0 12px" }}>
                A ativação da promoção depende da validação do débito automático no Itaú.
              </p>
            )}

            {/* STEP indicator */}
            <StepFlow
              hasQuiz={hasQuiz}
              hasForm={hasForm}
              primary={primary}
              activeStep={previewStep}
            />

            {previewStep === "hero" && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                <button
                  type="button"
                  onClick={() => setPreviewStep(hasQuiz ? "quiz" : hasForm ? "form" : "done")}
                  style={previewActionButton(primary)}
                >
                  Ver início do funil
                </button>
              </div>
            )}

            {previewStep === "quiz" && hasQuiz && (
              <QuizPreview
                questions={config.quizQuestions}
                primary={primary}
                quizIndex={quizIndex}
                onPick={pickQuizAnswer}
              />
            )}

            {previewStep === "form" && hasForm && (
              <FormPreview
                fields={enabledFields}
                hasWpp={hasWpp}
                primary={primary}
                hasQuiz={hasQuiz}
                onSubmitPreview={() => setPreviewStep("done")}
              />
            )}

            {previewStep === "done" && (
              <DonePreview hasWpp={hasWpp} primary={primary} onRestart={resetFlow} />
            )}

            {!hasQuiz && !hasForm && (
              <p style={{ color: "#aaa", fontSize: 12, textAlign: "center", padding: "16px 0" }}>
                Nenhum funil configurado. Ative o formulário ou quiz nas opções ao lado.
              </p>
            )}
          </div>
        </div>

        {/* wpp float badge */}
        {config.whatsappNumber.length >= 4 && (
          <div
            style={{
              position: "sticky",
              bottom: 12,
              display: "flex",
              justifyContent: "flex-end",
              paddingRight: 12,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                background: "#25d366",
                color: "#fff",
                borderRadius: 24,
                padding: "7px 14px",
                fontSize: 11,
                fontWeight: 700,
                boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
              }}
            >
              💬 WhatsApp
            </div>
          </div>
        )}

        {/* footer */}
        <div
          style={{
            background: "#111",
            color: "#888",
            fontSize: 10,
            textAlign: "center",
            padding: "10px 8px",
          }}
        >
          © {new Date().getFullYear()} {isCC ? "ConectCar" : "Veloe"} — top1tags.dev
        </div>
      </div>
    </div>
  );
}

function StepFlow({
  hasQuiz,
  hasForm,
  primary,
  activeStep,
}: {
  hasQuiz: boolean;
  hasForm: boolean;
  primary: string;
  activeStep: "hero" | "quiz" | "form" | "done";
}) {
  const steps: string[] = [];
  if (hasQuiz) steps.push("Quiz");
  if (hasForm) steps.push("Dados");
  steps.push("✓ Pronto");

  if (steps.length === 1) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 16, justifyContent: "center" }}>
      {steps.map((s, i) => (
        <span key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              background:
                (activeStep === "quiz" && i === 0) ||
                (activeStep === "form" && ((hasQuiz && i <= 1) || (!hasQuiz && i === 0))) ||
                (activeStep === "done")
                  ? primary
                  : "#e5e7eb",
              color:
                (activeStep === "quiz" && i === 0) ||
                (activeStep === "form" && ((hasQuiz && i <= 1) || (!hasQuiz && i === 0))) ||
                activeStep === "done"
                  ? "#fff"
                  : "#555",
              borderRadius: 12,
              padding: "2px 10px",
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {s}
          </span>
          {i < steps.length - 1 && <span style={{ color: "#ccc", fontSize: 10 }}>→</span>}
        </span>
      ))}
    </div>
  );
}

function QuizPreview({
  questions,
  primary,
  quizIndex,
  onPick,
}: {
  questions: { id: string; question: string; options: string[] }[];
  primary: string;
  quizIndex: number;
  onPick: (question: string, option: string) => void;
}) {
  const q = questions[Math.min(quizIndex, questions.length - 1)];

  if (!q) return null;

  return (
    <div
      style={{
        background: "#f9fafb",
        borderRadius: 10,
        padding: "14px 12px",
        marginBottom: 14,
        border: `1px solid #e5e7eb`,
      }}
    >
      <p style={{ fontSize: 10, color: "#888", margin: "0 0 6px" }}>
        Pergunta {quizIndex + 1} de {questions.length}
      </p>
      <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 12px", color: "#111" }}>{q.question}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {q.options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onPick(q.question, opt)}
            style={{
              background: "#fff",
              border: `2px solid ${primary}`,
              color: primary,
              borderRadius: 20,
              padding: "5px 12px",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {opt}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 9, color: "#aaa", marginTop: 8 }}>
        Clique numa resposta para avançar no fluxo
      </p>
    </div>
  );
}

function FormPreview({
  fields,
  hasWpp,
  primary,
  hasQuiz,
  onSubmitPreview,
}: {
  fields: FormFieldKey[];
  hasWpp: boolean;
  primary: string;
  hasQuiz: boolean;
  onSubmitPreview: () => void;
}) {
  if (fields.length === 0) return null;

  return (
    <div
      style={{
        background: "#f9fafb",
        borderRadius: 10,
        padding: "14px 12px",
        border: `1px solid #e5e7eb`,
      }}
    >
      <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 12px", color: "#111" }}>
        {hasQuiz ? "Quase lá — seus dados" : "Prefere que a gente te chame?"}
      </p>
      {fields.map((key) => (
        <div key={key} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: "#555", marginBottom: 3 }}>
            {FORM_FIELD_LABELS[key]}
          </div>
          <div
            style={{
              background: "#fff",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              padding: "7px 10px",
              fontSize: 11,
              color: "#bbb",
            }}
          >
            {key === "phone"
              ? "(11) 99999-9999"
              : key === "email"
                ? "seu@email.com"
                : key === "city"
                  ? "São Paulo"
                  : key === "placa"
                    ? "ABC1D23"
              : key === "cpf"
                ? "00000000000"
              : key === "birthDate"
                ? "1995-08-18"
              : key === "income"
                ? "3500"
                    : "Seu nome"}
          </div>
        </div>
      ))}
      <button
        type="button"
        style={{
          background: primary,
          color: "#fff",
          borderRadius: 8,
          padding: "9px 12px",
          textAlign: "center",
          fontWeight: 700,
          fontSize: 12,
          marginTop: 10,
          cursor: "pointer",
          border: "none",
          width: "100%",
        }}
        onClick={onSubmitPreview}
      >
        {hasWpp ? "Enviar e abrir WhatsApp" : "Enviar dados para contato"}
      </button>
    </div>
  );
}

function DonePreview({
  hasWpp,
  primary,
  onRestart,
}: {
  hasWpp: boolean;
  primary: string;
  onRestart: () => void;
}) {
  return (
    <div
      style={{
        background: "#f9fafb",
        borderRadius: 10,
        padding: "18px 14px",
        border: "1px solid #e5e7eb",
        textAlign: "center",
      }}
    >
      <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 8px", color: "#111" }}>
        {hasWpp ? "Lead enviado e WhatsApp aberto" : "Lead enviado com sucesso"}
      </p>
      <p style={{ fontSize: 11, color: "#666", margin: "0 0 14px" }}>
        Este é o estado final que o visitante vê depois de passar por todo o fluxo.
      </p>
      <button type="button" onClick={onRestart} style={previewActionButton(primary)}>
        Recomeçar preview
      </button>
    </div>
  );
}

function previewActionButton(primary: string) {
  return {
    background: primary,
    color: "#fff",
    border: "none",
    borderRadius: 999,
    padding: "8px 16px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  } as const;
}
