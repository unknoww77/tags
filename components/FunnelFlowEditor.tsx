"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FunnelFlowNode, type FunnelNodeData } from "@/components/funnel-flow/FunnelFlowNode";
import {
  addQuizNode,
  applyFlowEdgesToConfig,
  applyNodePositions,
  configToFlow,
  removeQuizFromConfig,
  updateQuizInConfig,
} from "@/lib/funnel-flow";
import type { PageEngagementConfig } from "@/lib/page-config";

type Props = {
  config: PageEngagementConfig;
  onChange: (next: PageEngagementConfig) => void;
  compact?: boolean;
};

const nodeTypes: NodeTypes = {
  funnel: FunnelFlowNode,
};

export function FunnelFlowEditor({ config, onChange, compact = false }: Props) {
  const built = useMemo(() => configToFlow(config), [config]);
  const [nodes, setNodes, onNodesChange] = useNodesState(built.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(built.edges);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setNodes(built.nodes);
    setEdges(built.edges);
  }, [built.nodes, built.edges, setNodes, setEdges]);

  const selectedQuiz = useMemo(() => {
    if (!selectedId?.startsWith("quiz-")) return null;
    const qid = selectedId.replace("quiz-", "");
    return config.quizQuestions.find((q) => q.id === qid) ?? null;
  }, [selectedId, config.quizQuestions]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const next = addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: "#38bdf8", strokeWidth: 2 },
          },
          eds
        );
        onChange(applyFlowEdgesToConfig(config, next));
        return next;
      });
    },
    [config, onChange, setEdges]
  );

  const onNodeDragStop = useCallback(() => {
    setNodes((nds) => {
      onChange(applyNodePositions(config, nds));
      return nds;
    });
  }, [config, onChange, setNodes]);

  const onSelectionChange = useCallback(
    ({ nodes: sel }: { nodes: Node[] }) => {
      setSelectedId(sel[0]?.id ?? null);
    },
    []
  );

  function handleAddQuiz() {
    onChange(addQuizNode(config));
  }

  function handleRemoveSelectedQuiz() {
    if (!selectedQuiz) return;
    onChange(removeQuizFromConfig(config, selectedQuiz.id));
    setSelectedId(null);
  }

  function patchSelectedQuiz(patch: { question?: string; options?: string[] }) {
    if (!selectedQuiz) return;
    onChange(updateQuizInConfig(config, selectedQuiz.id, patch));
  }

  return (
    <div className={`funnel-flow-shell${compact ? " is-compact" : ""}`}>
      <div className="funnel-flow-toolbar">
        <div>
          <strong>Editor de fluxo</strong>
          <p className="muted tiny">
            Arraste os blocos, conecte as setas para definir a ordem e clique para editar.
          </p>
        </div>
        <div className="selector-row wrap">
          <button type="button" className="selector-btn" onClick={handleAddQuiz}>
            + Pergunta quiz
          </button>
          {selectedQuiz && (
            <button type="button" className="selector-btn" onClick={handleRemoveSelectedQuiz}>
              Remover selecionada
            </button>
          )}
        </div>
      </div>

      <div className="funnel-flow-canvas-wrap">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgesDelete={(deleted) => {
            const remaining = edges.filter(
              (e) => !deleted.some((d) => d.id === e.id)
            );
            onChange(applyFlowEdgesToConfig(config, remaining));
          }}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.35, maxZoom: 1 }}
          minZoom={0.25}
          maxZoom={1.2}
          defaultEdgeOptions={{
            type: "smoothstep",
            animated: true,
            style: { stroke: "#38bdf8", strokeWidth: 2 },
          }}
          deleteKeyCode={null}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={18} size={1} color="rgba(255,255,255,0.06)" />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(n) => {
              const k = (n.data as FunnelNodeData).kind;
              if (k === "quiz") return "#38bdf8";
              if (k === "form") return "#a78bfa";
              if (k === "itau") return "#ec7000";
              if (k === "end") return "#4ade80";
              return "#2dd4bf";
            }}
            maskColor="rgba(11,18,32,0.75)"
          />
        </ReactFlow>
      </div>

      {selectedQuiz && (
        <div className="funnel-flow-inspector">
          <h4>Editar pergunta selecionada</h4>
          <label>
            Texto da pergunta
            <input
              value={selectedQuiz.question}
              onChange={(e) => patchSelectedQuiz({ question: e.target.value })}
            />
          </label>
          {selectedQuiz.options.map((opt, i) => (
            <label key={`${selectedQuiz.id}-${i}`}>
              Opção {i + 1}
              <input
                value={opt}
                onChange={(e) => {
                  const options = [...selectedQuiz.options];
                  options[i] = e.target.value;
                  patchSelectedQuiz({ options });
                }}
              />
            </label>
          ))}
          <button
            type="button"
            className="linkish"
            onClick={() =>
              patchSelectedQuiz({
                options: [...selectedQuiz.options, `Opção ${selectedQuiz.options.length + 1}`],
              })
            }
          >
            + adicionar opção
          </button>
        </div>
      )}

      {!selectedQuiz && selectedId && (
        <div className="funnel-flow-inspector">
          <p className="muted">
            Bloco selecionado: <strong>{selectedId}</strong>. Use os campos abaixo para ajustar
            formulário, WhatsApp e modo Itaú.
          </p>
        </div>
      )}
    </div>
  );
}
