export type FormFieldKey = "name" | "phone" | "email" | "city";

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
};

export type PageEngagementConfig = {
  showForm: boolean;
  showQuiz: boolean;
  sendToWhatsapp: boolean;
  whatsappNumber: string;
  whatsappMessage: string;
  formFields: Record<FormFieldKey, boolean>;
  quizQuestions: QuizQuestion[];
};

export const FORM_FIELD_LABELS: Record<FormFieldKey, string> = {
  name: "Nome",
  phone: "Telefone / WhatsApp",
  email: "E-mail",
  city: "Cidade",
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
    },
    quizQuestions: DEFAULT_QUIZ,
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
    formFields: {
      name: Boolean(c.formFields?.name ?? base.formFields.name),
      phone: Boolean(c.formFields?.phone ?? base.formFields.phone),
      email: Boolean(c.formFields?.email ?? base.formFields.email),
      city: Boolean(c.formFields?.city ?? base.formFields.city),
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
