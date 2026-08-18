import type { Edge, Node } from "@xyflow/react";
import {
  FORM_FIELD_LABELS,
  type FlowLayout,
  type FormFieldKey,
  type PageEngagementConfig,
  type QuizQuestion,
} from "@/lib/page-config";

export function defaultFlowLayout(config: PageEngagementConfig): FlowLayout {
  const positions: Record<string, { x: number; y: number }> = {};
  let y = 0;
  const x = 120;

  positions.start = { x, y };
  y += 110;

  if (config.itauMode) {
    positions.itau = { x, y };
    y += 100;
  }

  if (config.showQuiz) {
    for (const q of config.quizQuestions) {
      positions[`quiz-${q.id}`] = { x, y };
      y += 130;
    }
  }

  if (config.showForm) {
    positions.form = { x, y };
    y += 130;
  }

  if (config.sendToWhatsapp) {
    positions.whatsapp = { x, y };
    y += 110;
  }

  positions.end = { x, y };
  return { positions };
}

export function mergeFlowLayout(
  config: PageEngagementConfig,
  saved?: FlowLayout | null
): FlowLayout {
  const defaults = defaultFlowLayout(config);
  if (!saved?.positions) return defaults;
  return {
    positions: { ...defaults.positions, ...saved.positions },
  };
}

export function configToFlow(
  config: PageEngagementConfig
): { nodes: Node[]; edges: Edge[] } {
  const layout = mergeFlowLayout(config, config.flowLayout);
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const chain: string[] = ["start"];

  nodes.push({
    id: "start",
    type: "funnel",
    position: layout.positions.start ?? { x: 120, y: 0 },
    data: { kind: "start", label: "Início da landing" },
    draggable: true,
  });

  if (config.itauMode) {
    chain.push("itau");
    nodes.push({
      id: "itau",
      type: "funnel",
      position: layout.positions.itau ?? { x: 120, y: 110 },
      data: { kind: "itau", label: "Selo Itaú + débito automático" },
      draggable: true,
    });
  }

  if (config.showQuiz) {
    for (const q of config.quizQuestions) {
      const id = `quiz-${q.id}`;
      chain.push(id);
      nodes.push({
        id,
        type: "funnel",
        position: layout.positions[id] ?? { x: 120, y: nodes.length * 120 },
        data: {
          kind: "quiz",
          label: q.question,
          questionId: q.id,
          options: q.options,
        },
        draggable: true,
      });
    }
  }

  if (config.showForm) {
    chain.push("form");
    const activeFields = (Object.keys(config.formFields) as FormFieldKey[]).filter(
      (k) => config.formFields[k]
    );
    nodes.push({
      id: "form",
      type: "funnel",
      position: layout.positions.form ?? { x: 120, y: nodes.length * 120 },
      data: {
        kind: "form",
        label: "Formulário de dados",
        fields: activeFields.map((k) => FORM_FIELD_LABELS[k]),
      },
      draggable: true,
    });
  }

  if (config.sendToWhatsapp) {
    chain.push("whatsapp");
    nodes.push({
      id: "whatsapp",
      type: "funnel",
      position: layout.positions.whatsapp ?? { x: 120, y: nodes.length * 120 },
      data: { kind: "whatsapp", label: "Abrir WhatsApp" },
      draggable: true,
    });
  }

  chain.push("end");
  nodes.push({
    id: "end",
    type: "funnel",
    position: layout.positions.end ?? { x: 120, y: nodes.length * 120 },
    data: { kind: "end", label: "Lead salvo / concluído" },
    draggable: true,
  });

  for (let i = 0; i < chain.length - 1; i++) {
    edges.push({
      id: `e-${chain[i]}-${chain[i + 1]}`,
      source: chain[i],
      target: chain[i + 1],
      animated: true,
      style: { stroke: "#38bdf8", strokeWidth: 2 },
    });
  }

  return { nodes, edges };
}

/** Reordena quiz conforme caminho start → … → form/end nas edges */
export function applyFlowEdgesToConfig(
  config: PageEngagementConfig,
  edges: Edge[]
): PageEngagementConfig {
  if (!config.showQuiz || !config.quizQuestions.length) return config;

  const order: string[] = [];
  let current = "start";
  const seen = new Set<string>();

  for (let step = 0; step < 32; step++) {
    const edge = edges.find((e) => e.source === current);
    if (!edge) break;
    current = edge.target;
    if (seen.has(current)) break;
    seen.add(current);
    if (current.startsWith("quiz-")) {
      order.push(current.replace("quiz-", ""));
    }
    if (current === "form" || current === "end" || current === "whatsapp") break;
  }

  if (order.length === 0) return config;

  const byId = new Map(config.quizQuestions.map((q) => [q.id, q]));
  const reordered: QuizQuestion[] = [];
  for (const id of order) {
    const q = byId.get(id);
    if (q) reordered.push(q);
  }
  for (const q of config.quizQuestions) {
    if (!order.includes(q.id)) reordered.push(q);
  }

  return { ...config, quizQuestions: reordered };
}

export function applyNodePositions(
  config: PageEngagementConfig,
  nodes: Node[]
): PageEngagementConfig {
  const positions: Record<string, { x: number; y: number }> = {
    ...(config.flowLayout?.positions ?? {}),
  };
  for (const n of nodes) {
    positions[n.id] = { x: n.position.x, y: n.position.y };
  }
  return { ...config, flowLayout: { positions } };
}

export function addQuizNode(config: PageEngagementConfig): PageEngagementConfig {
  const id = `q${Date.now().toString(36)}`;
  const newQ: QuizQuestion = {
    id,
    question: "Nova pergunta do quiz",
    options: ["Opção 1", "Opção 2"],
  };
  const positions = { ...(config.flowLayout?.positions ?? {}) };
  const lastQuiz = config.quizQuestions[config.quizQuestions.length - 1];
  const base = lastQuiz
    ? positions[`quiz-${lastQuiz.id}`] ?? { x: 120, y: 200 }
    : { x: 120, y: config.itauMode ? 220 : 120 };
  positions[`quiz-${id}`] = { x: base.x + 40, y: base.y + 140 };

  return {
    ...config,
    showQuiz: true,
    quizQuestions: [...config.quizQuestions, newQ],
    flowLayout: { positions },
  };
}

export function updateQuizInConfig(
  config: PageEngagementConfig,
  questionId: string,
  patch: Partial<QuizQuestion>
): PageEngagementConfig {
  return {
    ...config,
    quizQuestions: config.quizQuestions.map((q) =>
      q.id === questionId ? { ...q, ...patch } : q
    ),
  };
}

export function removeQuizFromConfig(
  config: PageEngagementConfig,
  questionId: string
): PageEngagementConfig {
  const positions = { ...(config.flowLayout?.positions ?? {}) };
  delete positions[`quiz-${questionId}`];
  return {
    ...config,
    quizQuestions: config.quizQuestions.filter((q) => q.id !== questionId),
    flowLayout: { positions },
  };
}
