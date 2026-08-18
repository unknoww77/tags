export type FormFieldKey =
  | "name"
  | "phone"
  | "email"
  | "city"
  | "placa"
  | "cpf"
  | "birthDate"
  | "income";

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
};

export type FlowLayout = {
  positions: Record<string, { x: number; y: number }>;
};

export type PageEngagementConfig = {
  showForm: boolean;
  showQuiz: boolean;
  sendToWhatsapp: boolean;
  whatsappNumber: string;
  whatsappMessage: string;
  formFields: Record<FormFieldKey, boolean>;
  quizQuestions: QuizQuestion[];
  /** quando true, exibe badge "Exclusivo Itaú" e pergunta de placa condicional */
  itauMode?: boolean;
  /** posições dos blocos no editor visual de fluxo */
  flowLayout?: FlowLayout;
};

export const FORM_FIELD_LABELS: Record<FormFieldKey, string> = {
  name: "Nome completo",
  phone: "Telefone / WhatsApp",
  email: "E-mail",
  city: "Cidade",
  placa: "Placa do veículo",
  cpf: "CPF",
  birthDate: "Data de nascimento",
  income: "Renda mensal",
};

export const DEFAULT_QUIZ: QuizQuestion[] = [
  {
    id: "uso",
    question: "Com que frequência você usa pedágio?",
    options: ["Todo dia", "Algumas vezes por semana", "Só em viagens", "Quase nunca"],
  },
  {
    id: "objetivo",
    question: "Qual seu principal objetivo com a tag?",
    options: ["Economizar tempo", "Estacionamento", "Frota / trabalho", "Viagens"],
  },
  {
    id: "tem_tag",
    question: "Você já tem alguma tag de pedágio?",
    options: ["Não tenho", "Tenho e quero trocar", "Tenho e quero outra"],
  },
];

/** Quiz padrão para campanha Itaú — qualifica correntista + veículo */
export const DEFAULT_QUIZ_ITAU: QuizQuestion[] = [
  {
    id: "itau_conta",
    question: "Qual é o seu tipo de conta no Itaú?",
    options: ["Corrente", "Poupança", "Não sou cliente Itaú"],
  },
  {
    id: "tem_veiculo",
    question: "Você tem veículo registrado em seu nome?",
    options: ["Sim, tenho", "Não tenho"],
  },
  {
    id: "tem_tag",
    question: "Você já tem alguma tag de pedágio?",
    options: ["Não tenho", "Tenho e quero trocar", "Tenho e quero outra"],
  },
  {
    id: "debito_itau",
    question: "Você consegue validar a promoção com débito automático no Itaú?",
    options: ["Sim, consigo validar", "Preciso de ajuda para validar"],
  },
];

export function defaultPageConfig(): PageEngagementConfig {
  return {
    showForm: true,
    showQuiz: false,
    sendToWhatsapp: false,
    whatsappNumber: "",
    whatsappMessage: "Olá! Vim pela landing e quero saber mais sobre a tag.",
    formFields: {
      name: true,
      phone: true,
      email: false,
      city: false,
      placa: false,
      cpf: false,
      birthDate: false,
      income: false,
    },
    quizQuestions: DEFAULT_QUIZ,
    itauMode: false,
  };
}

export function defaultItauPageConfig(): PageEngagementConfig {
  return {
    showForm: true,
    showQuiz: true,
    sendToWhatsapp: false,
    whatsappNumber: "",
    whatsappMessage: "Olá! Vim pela landing do Itaú e quero saber mais sobre a tag.",
    formFields: {
      name: true,
      phone: true,
      email: true,
      city: false,
      placa: true,
      cpf: true,
      birthDate: true,
      income: true,
    },
    quizQuestions: DEFAULT_QUIZ_ITAU,
    itauMode: true,
  };
}

export function parsePageConfig(raw: unknown): PageEngagementConfig {
  const base = defaultPageConfig();
  if (!raw || typeof raw !== "object") return base;
  const c = raw as Partial<PageEngagementConfig>;

  return {
    showForm: Boolean(c.showForm ?? base.showForm),
    showQuiz: Boolean(c.showQuiz ?? base.showQuiz),
    sendToWhatsapp: Boolean(c.sendToWhatsapp ?? base.sendToWhatsapp),
    whatsappNumber: String(c.whatsappNumber ?? base.whatsappNumber).replace(/\D/g, ""),
    whatsappMessage: String(c.whatsappMessage ?? base.whatsappMessage).slice(0, 500),
    itauMode: Boolean(c.itauMode ?? base.itauMode),
    flowLayout:
      c.flowLayout && typeof c.flowLayout === "object" && c.flowLayout.positions
        ? {
            positions: Object.fromEntries(
              Object.entries(c.flowLayout.positions as Record<string, { x?: number; y?: number }>).map(
                ([id, pos]) => [id, { x: Number(pos.x ?? 0), y: Number(pos.y ?? 0) }]
              )
            ),
          }
        : base.flowLayout,
    formFields: {
      name: Boolean(c.formFields?.name ?? base.formFields.name),
      phone: Boolean(c.formFields?.phone ?? base.formFields.phone),
      email: Boolean(c.formFields?.email ?? base.formFields.email),
      city: Boolean(c.formFields?.city ?? base.formFields.city),
      placa: Boolean(c.formFields?.placa ?? base.formFields.placa),
      cpf: Boolean(c.formFields?.cpf ?? base.formFields.cpf),
      birthDate: Boolean(c.formFields?.birthDate ?? base.formFields.birthDate),
      income: Boolean(c.formFields?.income ?? base.formFields.income),
    },
    quizQuestions:
      Array.isArray(c.quizQuestions) && c.quizQuestions.length > 0
        ? c.quizQuestions.map((q, i) => ({
            id: String(q.id || `q${i}`),
            question: String(q.question || "").slice(0, 200),
            options: Array.isArray(q.options)
              ? q.options.map((o) => String(o).slice(0, 80)).filter(Boolean).slice(0, 6)
              : [],
          }))
        : base.quizQuestions,
  };
}

export function buildWhatsAppUrl(
  number: string,
  message: string,
  extras?: Record<string, string>
): string {
  const digits = number.replace(/\D/g, "");
  const parts = [message];
  if (extras) {
    for (const [k, v] of Object.entries(extras)) {
      if (v) parts.push(`${k}: ${v}`);
    }
  }
  const text = encodeURIComponent(parts.join("\n"));
  return `https://wa.me/${digits}?text=${text}`;
}
