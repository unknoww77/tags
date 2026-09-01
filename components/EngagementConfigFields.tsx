"use client";

import { YesNoSelector, SelectorButton } from "@/components/SelectorButton";
import { FieldLabel, HelpTip } from "@/components/HelpTip";
import {
  FORM_FIELD_LABELS,
  DEFAULT_QUIZ_ITAU,
  MAX_WHATSAPP_NUMBERS,
  redistributeEqualWeights,
  whatsappWeightsTotal,
  type FormFieldKey,
  type PageEngagementConfig,
  type QuizQuestion,
  type WhatsAppEntry,
} from "@/lib/page-config";

type Props = {
  value: PageEngagementConfig;
  onChange: (next: PageEngagementConfig) => void;
};

const FIELD_HELP: Record<FormFieldKey, string> = {
  name: "Pede o nome do lead. Ative se quiser personalizar o contato depois.",
  phone: "Pede telefone/WhatsApp do lead. Essencial se você for ligar ou chamar depois.",
  email: "Pede e-mail. Útil para follow-up por e-mail; deixe desligado se não for usar.",
  city: "Pede a cidade. Ajuda a segmentar campanhas regionais.",
  placa: "Pede a placa do veículo. Em modo Itaú, só aparece se o visitante respondeu que tem veículo.",
  cpf: "Pede o CPF para validação comercial e conferência de elegibilidade da promoção.",
  birthDate: "Pede a data de nascimento para completar a proposta e validar dados do cliente.",
  income: "Pede a renda mensal para qualificar melhor o lead antes do atendimento.",
};

export function EngagementConfigFields({ value, onChange }: Props) {
  const weightsTotal = whatsappWeightsTotal(value.whatsappNumbers);
  const weightsOk = weightsTotal === 100;

  function patch(partial: Partial<PageEngagementConfig>) {
    onChange({ ...value, ...partial });
  }

  function patchWhatsAppNumbers(entries: WhatsAppEntry[]) {
    const whatsappNumbers = entries;
    const whatsappNumber = entries[0]?.number ?? "";
    patch({ whatsappNumbers, whatsappNumber });
  }

  function toggleField(key: FormFieldKey) {
    patch({
      formFields: { ...value.formFields, [key]: !value.formFields[key] },
    });
  }

  function updateQuestion(index: number, next: Partial<QuizQuestion>) {
    const quizQuestions = value.quizQuestions.map((q, i) =>
      i === index ? { ...q, ...next } : q
    );
    patch({ quizQuestions });
  }

  function updateOption(qIndex: number, oIndex: number, text: string) {
    const quizQuestions = value.quizQuestions.map((q, i) => {
      if (i !== qIndex) return q;
      const options = q.options.map((o, j) => (j === oIndex ? text : o));
      return { ...q, options };
    });
    patch({ quizQuestions });
  }

  function addQuestion() {
    patch({
      quizQuestions: [
        ...value.quizQuestions,
        {
          id: `q${Date.now().toString(36)}`,
          question: "Nova pergunta",
          options: ["Opção 1", "Opção 2"],
        },
      ],
    });
  }

  function removeQuestion(index: number) {
    patch({ quizQuestions: value.quizQuestions.filter((_, i) => i !== index) });
  }

  function activateItauMode(active: boolean) {
    if (active) {
      patch({
        itauMode: true,
        showQuiz: true,
        quizQuestions: DEFAULT_QUIZ_ITAU,
        formFields: {
          ...value.formFields,
          name: true,
          phone: true,
          email: true,
          placa: true,
          cpf: true,
          birthDate: true,
          income: true,
        },
      });
    } else {
      patch({ itauMode: false });
    }
  }

  function updateWhatsAppEntry(index: number, partial: Partial<WhatsAppEntry>) {
    const next = value.whatsappNumbers.map((e, i) =>
      i === index ? { ...e, ...partial } : e
    );
    patchWhatsAppNumbers(next);
  }

  function addWhatsAppNumber() {
    if (value.whatsappNumbers.length >= MAX_WHATSAPP_NUMBERS) return;
    const next = redistributeEqualWeights([
      ...value.whatsappNumbers,
      { number: "", weight: 0 },
    ]);
    patchWhatsAppNumbers(next);
  }

  function removeWhatsAppNumber(index: number) {
    if (value.whatsappNumbers.length <= 1) return;
    const next = redistributeEqualWeights(
      value.whatsappNumbers.filter((_, i) => i !== index)
    );
    patchWhatsAppNumbers(next);
  }

  return (
    <div className="engagement-config">
      <h3 className="field-label-row">
        Engajamento da página
        <HelpTip text="Aqui você define o funil: formulário, quiz e/ou WhatsApp. Os leads ficam salvos no dashboard da página." />
      </h3>

      {/* Itaú mode toggle */}
      <div className="itau-mode-toggle">
        <span className="itau-mode-badge">🟠 Modo Itaú</span>
        <span className="itau-mode-desc">
          Ativa um funil Itaú mais completo com conta, veículo, débito automático e captura dos dados principais do cliente.
        </span>
        <YesNoSelector
          label="Campanha exclusiva Itaú?"
          value={Boolean(value.itauMode)}
          onChange={activateItauMode}
          help="Quando ativado, o quiz padrão vira o fluxo Itaú completo, a landing mostra aviso de promoção exclusiva e o formulário captura nome completo, CPF, nascimento, renda, telefone, e-mail e placa quando houver veículo."
        />
      </div>

      <YesNoSelector
        label="Mostrar formulário na página?"
        value={value.showForm}
        onChange={(showForm) => patch({ showForm })}
        help="Se Sim, o visitante preenche dados (nome, telefone etc.) e você salva o lead para contato. Se Não, a página não mostra formulário (pode usar só quiz ou nada)."
      />

      {value.showForm && (
        <div className="selector-group">
          <span className="selector-label">
            <FieldLabel help="Clique nos botões para ligar/desligar cada campo. Pelo menos um deve ficar ativo se o formulário estiver ligado.">
              Campos do formulário
            </FieldLabel>
          </span>
          <div className="selector-row wrap">
            {(Object.keys(FORM_FIELD_LABELS) as FormFieldKey[]).map((key) => (
              <span key={key} className="field-with-help">
                <SelectorButton
                  label={FORM_FIELD_LABELS[key]}
                  active={value.formFields[key]}
                  onClick={() => toggleField(key)}
                />
                <HelpTip text={FIELD_HELP[key]} />
              </span>
            ))}
          </div>
        </div>
      )}

      <YesNoSelector
        label="Incluir quiz antes do formulário?"
        value={value.showQuiz}
        onChange={(showQuiz) => patch({ showQuiz })}
        help="Se Sim, o visitante responde perguntas com botões antes do formulário. As respostas vão junto no lead. Ideal para qualificar (frequência de uso, objetivo etc.)."
      />

      {value.showQuiz && (
        <div className="quiz-editor">
          <p className="muted field-label-row">
            Perguntas estilo quiz
            <HelpTip text="Edite o texto da pergunta e das opções. Cada opção vira um botão na landing. Use poucas opções claras (2–4). Pode adicionar ou remover perguntas." />
          </p>
          {value.quizQuestions.map((q, qi) => (
            <div key={q.id} className="quiz-editor-card">
              <label>
                <FieldLabel help="Texto da pergunta que aparece na landing. Ex: Com que frequência você usa pedágio?">
                  Pergunta {qi + 1}
                </FieldLabel>
                <input
                  value={q.question}
                  onChange={(e) => updateQuestion(qi, { question: e.target.value })}
                />
              </label>
              {q.options.map((opt, oi) => (
                <label key={`${q.id}-${oi}`}>
                  <FieldLabel help="Texto do botão de resposta. O visitante clica em uma opção para avançar.">
                    Opção {oi + 1}
                  </FieldLabel>
                  <input value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} />
                </label>
              ))}
              <div className="selector-row">
                <button
                  type="button"
                  className="linkish"
                  onClick={() =>
                    updateQuestion(qi, { options: [...q.options, `Opção ${q.options.length + 1}`] })
                  }
                >
                  + opção
                </button>
                {value.quizQuestions.length > 1 && (
                  <button type="button" className="linkish" onClick={() => removeQuestion(qi)}>
                    Remover pergunta
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="button" className="selector-btn" onClick={addQuestion}>
            + adicionar pergunta
          </button>
        </div>
      )}

      <YesNoSelector
        label="Ao enviar o formulário, levar para o WhatsApp?"
        value={value.sendToWhatsapp}
        onChange={(sendToWhatsapp) => patch({ sendToWhatsapp })}
        help="Se Sim, após o envio do formulário abrimos o WhatsApp com mensagem + dados do lead. Os leads são distribuídos entre os números conforme os percentuais abaixo."
      />

      <div className="stack-tight">
        <div>
          <FieldLabel help="Adicione até 5 números com DDI (55 + DDD + número). Os percentuais devem somar 100%. Ao adicionar números, a divisão é automática (ex.: 2 números = 50% cada).">
            Números de WhatsApp de atendimento
          </FieldLabel>
          <p className="muted tiny">
            Total:{" "}
            <span className={weightsOk ? "status-active" : "status-error"}>
              {weightsTotal}%
            </span>
            {!weightsOk && " — a soma deve ser 100%"}
          </p>
        </div>

        {value.whatsappNumbers.map((entry, index) => (
          <div key={index} className="whatsapp-number-row selector-row wrap">
            <label className="whatsapp-number-field">
              <span className="muted tiny">Número {index + 1}</span>
              <input
                value={entry.number}
                onChange={(e) =>
                  updateWhatsAppEntry(index, { number: e.target.value.replace(/\D/g, "") })
                }
                placeholder="5511999999999"
                inputMode="numeric"
              />
            </label>
            <label className="whatsapp-weight-field">
              <span className="muted tiny">%</span>
              <input
                type="number"
                min={0}
                max={100}
                value={entry.weight}
                onChange={(e) =>
                  updateWhatsAppEntry(index, {
                    weight: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                  })
                }
              />
            </label>
            {value.whatsappNumbers.length > 1 && (
              <button
                type="button"
                className="linkish"
                onClick={() => removeWhatsAppNumber(index)}
              >
                Remover
              </button>
            )}
          </div>
        ))}

        {value.whatsappNumbers.length < MAX_WHATSAPP_NUMBERS && (
          <button type="button" className="selector-btn" onClick={addWhatsAppNumber}>
            + adicionar número
          </button>
        )}

        <label>
          <FieldLabel help="Texto inicial da conversa no WhatsApp ao enviar o formulário. Dados do lead podem ser anexados automaticamente.">
            Mensagem inicial
          </FieldLabel>
          <textarea
            value={value.whatsappMessage}
            onChange={(e) => patch({ whatsappMessage: e.target.value })}
            rows={3}
          />
        </label>
      </div>
    </div>
  );
}
