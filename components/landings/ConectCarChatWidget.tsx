"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  pageId: string;
  domain: string;
  brandLabel?: string;
};

type ChatMsg = {
  id: string;
  sender: "visitor" | "agent";
  body: string;
  agentName?: string | null;
  createdAt: string;
};

type StoredSession = {
  id: string;
  visitorToken: string;
  visitorName: string;
};

function storageKeyForPage(pageId: string) {
  return `top1tags_chat_${pageId}`;
}

export function ConectCarChatWidget({
  pageId,
  domain,
  brandLabel = "ConectCar",
}: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"gate" | "chat">("gate");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<StoredSession | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [status, setStatus] = useState<"open" | "closed">("open");
  const bottomRef = useRef<HTMLDivElement>(null);

  const storageKey = useMemo(() => storageKeyForPage(pageId), [pageId]);

  const loadMessages = useCallback(async (convId: string, token: string) => {
    const res = await fetch(`/api/chat/conversations/${convId}?token=${encodeURIComponent(token)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.conversation as {
      status: "open" | "closed";
      messages: ChatMsg[];
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredSession;
      if (!parsed?.id || !parsed?.visitorToken) return;
      setSession(parsed);
      setName(parsed.visitorName || "");
      setStep("chat");
      void loadMessages(parsed.id, parsed.visitorToken).then((conv) => {
        if (!conv) {
          localStorage.removeItem(storageKey);
          setSession(null);
          setStep("gate");
          return;
        }
        setMessages(conv.messages);
        setStatus(conv.status);
      });
    } catch {
      /* ignore */
    }
  }, [storageKey, loadMessages]);

  useEffect(() => {
    if (!open || step !== "chat" || !session) return;
    const tick = async () => {
      const conv = await loadMessages(session.id, session.visitorToken);
      if (conv) {
        setMessages(conv.messages);
        setStatus(conv.status);
      }
    };
    const id = window.setInterval(() => void tick(), 2500);
    return () => window.clearInterval(id);
  }, [open, step, session, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, step]);

  async function startChat(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, domain, name, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao iniciar");

      const next: StoredSession = {
        id: data.conversation.id,
        visitorToken: data.conversation.visitorToken,
        visitorName: data.conversation.visitorName,
      };
      localStorage.setItem(storageKey, JSON.stringify(next));
      setSession(next);
      setMessages(data.conversation.messages);
      setStatus(data.conversation.status);
      setStep("chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao iniciar chat");
    } finally {
      setSending(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !draft.trim() || status === "closed") return;
    setSending(true);
    setError(null);
    const text = draft.trim();
    setDraft("");
    try {
      const res = await fetch(`/api/chat/conversations/${session.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: session.visitorToken, body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao enviar");
      setMessages((prev) => [...prev, data.message]);
    } catch (err) {
      setDraft(text);
      setError(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="cc-chat">
      {open && (
        <div className="cc-chat-panel" role="dialog" aria-label={`Chat ${brandLabel}`}>
          <header className="cc-chat-header">
            <div className="cc-chat-brand">
              <span className="cc-chat-avatar" aria-hidden>
                cc
              </span>
              <strong>{brandLabel}</strong>
            </div>
            <div className="cc-chat-header-actions">
              <button type="button" aria-label="Menu" className="cc-chat-icon-btn">
                ⋮
              </button>
              <button
                type="button"
                aria-label="Fechar"
                className="cc-chat-icon-btn"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
          </header>

          {step === "gate" ? (
            <form className="cc-chat-gate" onSubmit={startChat}>
              <p className="cc-chat-prompt">
                Antes de falar com o atendimento, informe seu nome e telefone.
              </p>
              <label>
                Nome
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  placeholder="Seu nome"
                  autoComplete="name"
                />
              </label>
              <label>
                Telefone / WhatsApp
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  minLength={8}
                  placeholder="(11) 99999-9999"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </label>
              {error && <p className="cc-chat-status">{error}</p>}
              <button type="submit" className="cc-chat-start-btn" disabled={sending}>
                {sending ? "Abrindo..." : "Iniciar conversa"}
              </button>
              <p className="cc-chat-powered">
                <span className="cc-chat-powered-dot" aria-hidden />
                Powered by Sunshine
              </p>
            </form>
          ) : (
            <>
              <div className="cc-chat-thread">
                <p className="cc-chat-thread-meta">
                  Olá, {session?.visitorName || name}! Nossa equipe responde por aqui.
                </p>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`cc-chat-bubble is-${m.sender}`}
                  >
                    {m.sender === "agent" && m.agentName && (
                      <span className="cc-chat-bubble-name">{m.agentName}</span>
                    )}
                    <p>{m.body}</p>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {status === "closed" ? (
                <p className="cc-chat-closed">Conversa encerrada pelo atendimento.</p>
              ) : (
                <form className="cc-chat-composer" onSubmit={sendMessage}>
                  <span className="cc-chat-plus" aria-hidden>
                    +
                  </span>
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Escreva uma mensagem"
                    aria-label="Escreva uma mensagem"
                    disabled={sending}
                  />
                  <button type="submit" disabled={sending || !draft.trim()}>
                    Enviar
                  </button>
                </form>
              )}
              {error && <p className="cc-chat-status cc-chat-status-foot">{error}</p>}
            </>
          )}
        </div>
      )}

      <button
        type="button"
        className={`cc-chat-launcher${open ? " is-open" : ""}`}
        aria-label={open ? "Fechar chat" : "Abrir chat"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "×" : <ChatBubbleIcon />}
      </button>
    </div>
  );
}

function ChatBubbleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
      <path
        fill="currentColor"
        d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
      />
    </svg>
  );
}
