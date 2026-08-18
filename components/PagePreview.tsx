"use client";

import { useState } from "react";
import { FORM_FIELD_LABELS, type FormFieldKey, type PageEngagementConfig } from "@/lib/page-config";

type Props = {
  brand: "conectcar" | "veloe";
  templateId: string;
  headline: string;
  description: string;
  config: PageEngagementConfig;
};

const CC_ORANGE = "#e65c00";
const CC_GREEN = "#00a651";
const VL_BLUE = "#0033a0";
const VL_TEAL = "#00bfb3";

export function PagePreview({ brand, headline, description, config }: Props) {
  const isCC = brand === "conectcar";
  const primary = isCC ? CC_ORANGE : VL_BLUE;
  const accent = isCC ? CC_GREEN : VL_TEAL;

    const heroText = headline || (isCC ? "Peça sua tag ConectCar" : "Peça sua tag Veloe");
  const heroSub =
    description ||
    (isCC
      ? "Pode ir tranquilo, por onde você for!"
      : "A tag de pedágio mais completa do Brasil.");

  const enabledFields = (Object.keys(config.formFields) as FormFieldKey[]).filter(
    (k) => config.formFields[k]
  );

  const hasQuiz = config.showQuiz && config.quizQuestions.length > 0;
  const hasForm = config.showForm;
  const hasWpp = config.sendToWhatsapp && config.whatsappNumber.length >= 10;

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        background: "#fff",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 4px 32px rgba(0,0,0,0.18)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontSize: 13,
      }}
    >
      {/* browser chrome */}
      <div
        style={{
          background: "#23272f",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57", display: "block" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e", display: "block" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840", display: "block" }} />
        <div
          style={{
            flex: 1,
            background: "#3a3f4b",
            borderRadius: 6,
            padding: "3px 10px",
            color: "#aaa",
            fontSize: 11,
            marginLeft: 8,
          }}
        >
          top1tags.dev/s/sua-pagina
        </div>
      </div>

      {/* page scroll area */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {/* header */}
        <div
          style={{
            background: isCC ? "#fff" : VL_BLUE,
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
            background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`,
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

            {/* STEP indicator */}
            <StepFlow hasQuiz={hasQuiz} hasForm={hasForm} primary={primary} />

            {/* quiz preview */}
            {hasQuiz && (
              <QuizPreview questions={config.quizQuestions} primary={primary} accent={accent} />
            )}

            {/* form preview */}
            {hasForm && (
              <FormPreview
                fields={enabledFields}
                hasWpp={hasWpp}
                primary={primary}
                hasQuiz={hasQuiz}
              />
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
}: {
  hasQuiz: boolean;
  hasForm: boolean;
  primary: string;
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
              background: i === 0 ? primary : "#e5e7eb",
              color: i === 0 ? "#fff" : "#555",
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
  accent,
}: {
  questions: { id: string; question: string; options: string[] }[];
  primary: string;
  accent: string;
}) {
  const [qi, setQi] = useState(0);
  const q = questions[Math.min(qi, questions.length - 1)];

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
        Pergunta {qi + 1} de {questions.length}
      </p>
      <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 12px", color: "#111" }}>{q.question}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {q.options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setQi((prev) => Math.min(prev + 1, questions.length - 1))}
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
        ↑ clique para simular o fluxo do quiz
      </p>
    </div>
  );
}

function FormPreview({
  fields,
  hasWpp,
  primary,
  hasQuiz,
}: {
  fields: FormFieldKey[];
  hasWpp: boolean;
  primary: string;
  hasQuiz: boolean;
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
                    : "Seu nome"}
          </div>
        </div>
      ))}
      <div
        style={{
          background: primary,
          color: "#fff",
          borderRadius: 8,
          padding: "9px 12px",
          textAlign: "center",
          fontWeight: 700,
          fontSize: 12,
          marginTop: 10,
        }}
      >
        {hasWpp ? "Enviar e abrir WhatsApp" : "Enviar dados para contato"}
      </div>
    </div>
  );
}
