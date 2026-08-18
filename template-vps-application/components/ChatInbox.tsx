"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ConversationListItem = {
  id: string;
  status: "open" | "closed";
  visitorName: string;
  visitorPhone: string;
  domain: string;
  unreadByAgent: number;
  lastMessageAt: string;
  lastMessage: { body: string; sender: string; createdAt: string } | null;
  page: { id: string; title: string; slug: string; brand: string };
  tenant: { id: string; name: string };
};

type ChatMsg = {
  id: string;
  sender: "visitor" | "agent";
  body: string;
  agentName?: string | null;
  createdAt: string;
};

type Props = {
  title?: string;
  showTenant?: boolean;
};

export function ChatInbox({ title = "Chat / Atendimento", showTenant = false }: Props) {
  const [list, setList] = useState<ConversationListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [meta, setMeta] = useState<ConversationListItem | null>(null);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"open" | "closed">("open");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refreshList = useCallback(async () => {
    const res = await fetch("/api/chat/inbox");
    if (!res.ok) return;
    const data = await res.json();
    setList(data.conversations || []);
    setLoading(false);
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    const res = await fetch(`/api/chat/inbox/${id}`);
    if (!res.ok) {
      setError("Não foi possível abrir a conversa");
      return;
    }
    const data = await res.json();
    setMessages(data.conversation.messages);
    setStatus(data.conversation.status);
    setMeta((prev) =>
      prev && prev.id === id
        ? { ...prev, unreadByAgent: 0, visitorName: data.conversation.visitorName, visitorPhone: data.conversation.visitorPhone }
        : prev
    );
  }, []);

  useEffect(() => {
    void refreshList();
    const id = window.setInterval(() => void refreshList(), 4000);
    return () => window.clearInterval(id);
  }, [refreshList]);

  useEffect(() => {
    if (!selectedId) return;
    void loadConversation(selectedId);
    const id = window.setInterval(() => void loadConversation(selectedId), 2500);
    return () => window.clearInterval(id);
  }, [selectedId, loadConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function selectConversation(item: ConversationListItem) {
    setSelectedId(item.id);
    setMeta(item);
    setError(null);
    setList((prev) =>
      prev.map((c) => (c.id === item.id ? { ...c, unreadByAgent: 0 } : c))
    );
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !draft.trim() || status === "closed") return;
    setSending(true);
    setError(null);
    const text = draft.trim();
    setDraft("");
    try {
      const res = await fetch(`/api/chat/inbox/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao enviar");
      setMessages((prev) => [...prev, data.message]);
      void refreshList();
    } catch (err) {
      setDraft(text);
      setError(err instanceof Error ? err.message : "Erro ao responder");
    } finally {
      setSending(false);
    }
  }

  async function toggleStatus() {
    if (!selectedId) return;
    const next = status === "open" ? "closed" : "open";
    const res = await fetch(`/api/chat/inbox/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      setStatus(next);
      void refreshList();
    }
  }

  const unreadTotal = list.reduce((sum, c) => sum + c.unreadByAgent, 0);

  return (
    <div className="chat-inbox">
      <div className="dashboard-head">
        <div>
          <h1>{title}</h1>
          <p className="muted">
            Conversas iniciadas no chat da landing.
            {unreadTotal > 0 ? ` · ${unreadTotal} não lida${unreadTotal === 1 ? "" : "s"}` : ""}
          </p>
        </div>
      </div>

      <div className="chat-inbox-grid">
        <aside className="chat-inbox-list panel">
          {loading && <p className="muted">Carregando...</p>}
          {!loading && list.length === 0 && (
            <p className="muted">Nenhuma conversa ainda.</p>
          )}
          {list.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chat-inbox-item${selectedId === c.id ? " is-active" : ""}`}
              onClick={() => selectConversation(c)}
            >
              <div className="chat-inbox-item-top">
                <strong>{c.visitorName}</strong>
                {c.unreadByAgent > 0 && (
                  <span className="chat-unread">{c.unreadByAgent}</span>
                )}
              </div>
              <span className="muted tiny">
                {c.visitorPhone}
                {showTenant ? ` · ${c.tenant.name}` : ""} · {c.page.title}
              </span>
              <span className="chat-inbox-preview">
                {c.lastMessage?.body || "—"}
              </span>
              <span className={`chat-status-pill is-${c.status}`}>
                {c.status === "open" ? "Aberta" : "Encerrada"}
              </span>
            </button>
          ))}
        </aside>

        <section className="chat-inbox-thread panel">
          {!selectedId || !meta ? (
            <p className="muted">Selecione uma conversa para atender.</p>
          ) : (
            <>
              <div className="chat-inbox-thread-head">
                <div>
                  <strong>{meta.visitorName}</strong>
                  <p className="muted tiny">
                    {meta.visitorPhone} · {meta.domain}
                    {showTenant ? ` · ${meta.tenant.name}` : ""}
                  </p>
                </div>
                <button type="button" className="selector-btn" onClick={() => void toggleStatus()}>
                  {status === "open" ? "Encerrar" : "Reabrir"}
                </button>
              </div>

              <div className="chat-inbox-messages">
                {messages.map((m) => (
                  <div key={m.id} className={`cc-chat-bubble is-${m.sender}`}>
                    {m.sender === "agent" && (
                      <span className="cc-chat-bubble-name">{m.agentName || "Atendente"}</span>
                    )}
                    {m.sender === "visitor" && (
                      <span className="cc-chat-bubble-name">{meta.visitorName}</span>
                    )}
                    <p>{m.body}</p>
                    <time className="tiny muted">
                      {new Date(m.createdAt).toLocaleString("pt-BR")}
                    </time>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {status === "closed" ? (
                <p className="muted">Conversa encerrada. Reabra para responder.</p>
              ) : (
                <form className="chat-inbox-composer" onSubmit={sendReply}>
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Responder ao lead..."
                    disabled={sending}
                  />
                  <button type="submit" disabled={sending || !draft.trim()}>
                    Enviar
                  </button>
                </form>
              )}
              {error && <p className="form-error">{error}</p>}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
