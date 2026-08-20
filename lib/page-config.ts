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

export type SentinelEventType =
  | "pageview"
  | "init_checkout"
  | "add_to_cart"
  | "purchase";

export type SentinelSelectorRule = {
  id: string;
  selector: string;
  eventType: SentinelEventType;
  label: string;
};

export type SentinelTrackingConfig = {
  enabled: boolean;
  apiKey: string;
  endpoint: string;
  pageviewEnabled: boolean;
  finalNoWhatsappEvent: SentinelEventType;
  whatsappClickEvent: SentinelEventType;
  clickIdParam: string;
  selectors: SentinelSelectorRule[];
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
  /** integração com Sentinel Tracking */
  sentinel?: SentinelTrackingConfig;
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

export function defaultSentinelConfig(): SentinelTrackingConfig {
  return {
    enabled: false,
    apiKey: "",
    endpoint: "https://sentinel.1001api.com/api/v1/event",
    pageviewEnabled: true,
    finalNoWhatsappEvent: "add_to_cart",
    whatsappClickEvent: "purchase",
    clickIdParam: "click_id",
    selectors: [],
  };
}

export function veloeSentinelPresets(): SentinelSelectorRule[] {
  return [
    {
      id: "vl_hero_cta",
      selector: ".vl-hero .vl-btn",
      eventType: "init_checkout",
      label: "Hero CTA",
    },
    {
      id: "vl_header_cta",
      selector: ".vl-header-cta",
      eventType: "add_to_cart",
      label: "Header CTA",
    },
    {
      id: "vl_plan_cta",
      selector: ".vl-plan-cta",
      eventType: "add_to_cart",
      label: "Plano CTA",
    },
    {
      id: "vl_funil_submit",
      selector: "#funil button[type=submit]",
      eventType: "add_to_cart",
      label: "Funil submit",
    },
    {
      id: "vl_whatsapp",
      selector: "a[href*='wa.me']",
      eventType: "purchase",
      label: "WhatsApp click",
    },
  ];
}

export function conectcarSentinelPresets(): SentinelSelectorRule[] {
  return [
    {
      id: "cc_hero_cta",
      selector: ".cc-hero .cc-btn",
      eventType: "init_checkout",
      label: "Hero CTA",
    },
    {
      id: "cc_header_cta",
      selector: ".cc-header-cta",
      eventType: "add_to_cart",
      label: "Header CTA",
    },
    {
      id: "cc_funil_submit",
      selector: "#funil button[type=submit]",
      eventType: "add_to_cart",
      label: "Funil submit",
    },
    {
      id: "cc_whatsapp",
      selector: "a[href*='wa.me']",
      eventType: "purchase",
      label: "WhatsApp click",
    },
  ];
}

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
    sentinel: defaultSentinelConfig(),
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
    sentinel: defaultSentinelConfig(),
  };
}

export function parsePageConfig(raw: unknown): PageEngagementConfig {
  const base = defaultPageConfig();
  if (!raw || typeof raw !== "object") return base;
  const c = raw as Partial<PageEngagementConfig>;
  const sentinelBase = defaultSentinelConfig();

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
    sentinel:
      c.sentinel && typeof c.sentinel === "object"
        ? {
            enabled: Boolean(c.sentinel.enabled ?? sentinelBase.enabled),
            apiKey: String(c.sentinel.apiKey ?? sentinelBase.apiKey).slice(0, 300),
            endpoint: String(c.sentinel.endpoint ?? sentinelBase.endpoint).slice(0, 500),
            pageviewEnabled: Boolean(c.sentinel.pageviewEnabled ?? sentinelBase.pageviewEnabled),
            finalNoWhatsappEvent:
              c.sentinel.finalNoWhatsappEvent === "purchase" ||
              c.sentinel.finalNoWhatsappEvent === "init_checkout" ||
              c.sentinel.finalNoWhatsappEvent === "pageview"
                ? c.sentinel.finalNoWhatsappEvent
                : sentinelBase.finalNoWhatsappEvent,
            whatsappClickEvent:
              c.sentinel.whatsappClickEvent === "add_to_cart" ||
              c.sentinel.whatsappClickEvent === "init_checkout" ||
              c.sentinel.whatsappClickEvent === "pageview"
                ? c.sentinel.whatsappClickEvent
                : c.sentinel.whatsappClickEvent === "purchase"
                  ? "purchase"
                  : sentinelBase.whatsappClickEvent,
            clickIdParam: String(c.sentinel.clickIdParam ?? sentinelBase.clickIdParam)
              .replace(/[^a-zA-Z0-9_-]/g, "")
              .slice(0, 80) || sentinelBase.clickIdParam,
            selectors: Array.isArray(c.sentinel.selectors)
              ? c.sentinel.selectors
                  .map((rule, index) => ({
                    id: String(rule.id || `selector_${index}`),
                    selector: String(rule.selector || "").slice(0, 200),
                    eventType:
                      rule.eventType === "pageview" ||
                      rule.eventType === "init_checkout" ||
                      rule.eventType === "purchase" ||
                      rule.eventType === "add_to_cart"
                        ? rule.eventType
                        : sentinelBase.finalNoWhatsappEvent,
                    label: String(rule.label || "").slice(0, 120),
                  }))
                  .filter((rule) => rule.selector)
              : sentinelBase.selectors,
          }
        : sentinelBase,
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
