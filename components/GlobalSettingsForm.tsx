"use client";

import { useEffect, useState } from "react";
import { HelpTip } from "@/components/HelpTip";

type GlobalSettings = {
  maxPagesPerTenant: number;
  leadRetentionDays: number;
  defaultSslMode: string;
  showPartnerDisclaimer: boolean;
  notifyTelegramOnLead: boolean;
  telegramBotToken: string | null;
  telegramChatId: string | null;
  allowTenantCustomWa: boolean;
  inviteDaysValid: number;
  notes: string | null;
};

export function GlobalSettingsForm() {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/super/settings")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Erro");
        setSettings(d.settings);
      })
      .catch((e) => setError(e.message));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError("");
    setMsg("");
    const res = await fetch("/api/super/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Falha");
      return;
    }
    setSettings(data.settings);
    setMsg("Configuração global salva. Vale para todos os tenants (exceto overrides).");
  }

  if (error && !settings) return <p className="form-error">{error}</p>;
  if (!settings) return <p className="muted">Carregando...</p>;

  return (
    <form className="panel-form" onSubmit={save}>
      <label>
        <span className="field-label-row">
          Máx. páginas por tenant
          <HelpTip text="Limite padrão de landings ativas por conta. Pode sobrescrever por tenant." />
        </span>
        <input
          type="number"
          min={1}
          max={500}
          value={settings.maxPagesPerTenant}
          onChange={(e) =>
            setSettings({ ...settings, maxPagesPerTenant: Number(e.target.value) })
          }
        />
      </label>
      <label>
        <span className="field-label-row">
          Retenção de leads (dias)
          <HelpTip text="Política de retenção documentada. Use para limpeza futura / compliance." />
        </span>
        <input
          type="number"
          min={7}
          max={3650}
          value={settings.leadRetentionDays}
          onChange={(e) =>
            setSettings({ ...settings, leadRetentionDays: Number(e.target.value) })
          }
        />
      </label>
      <label>
        <span className="field-label-row">
          SSL padrão Cloudflare
          <HelpTip text="flexible = origem HTTP. full/strict exige certificado na origem. Novos domínios usam este valor." />
        </span>
        <select
          value={settings.defaultSslMode}
          onChange={(e) => setSettings({ ...settings, defaultSslMode: e.target.value })}
        >
          <option value="flexible">flexible</option>
          <option value="full">full</option>
          <option value="strict">strict</option>
        </select>
      </label>
      <label>
        <span className="field-label-row">
          Dias de validade do convite
          <HelpTip text="Padrão ao gerar novos convites (o formulário de convite ainda pode usar 7; este valor é a política global)." />
        </span>
        <input
          type="number"
          min={1}
          max={90}
          value={settings.inviteDaysValid}
          onChange={(e) =>
            setSettings({ ...settings, inviteDaysValid: Number(e.target.value) })
          }
        />
      </label>

      <div className="selector-group">
        <span className="selector-label">
          Disclaimer de parceiro nas landings
          <HelpTip text="Se ligado, mostra aviso de página de parceiro no hero e rodapé." />
        </span>
        <div className="selector-row">
          <button
            type="button"
            className={`selector-btn${settings.showPartnerDisclaimer ? " is-active" : ""}`}
            onClick={() => setSettings({ ...settings, showPartnerDisclaimer: true })}
          >
            Sim
          </button>
          <button
            type="button"
            className={`selector-btn${!settings.showPartnerDisclaimer ? " is-active" : ""}`}
            onClick={() => setSettings({ ...settings, showPartnerDisclaimer: false })}
          >
            Não
          </button>
        </div>
      </div>

      <div className="selector-group">
        <span className="selector-label">
          Notificar Telegram em novo lead
          <HelpTip text="Envia alerta no Telegram quando um lead entra. Precisa de bot token e chat id." />
        </span>
        <div className="selector-row">
          <button
            type="button"
            className={`selector-btn${settings.notifyTelegramOnLead ? " is-active" : ""}`}
            onClick={() => setSettings({ ...settings, notifyTelegramOnLead: true })}
          >
            Sim
          </button>
          <button
            type="button"
            className={`selector-btn${!settings.notifyTelegramOnLead ? " is-active" : ""}`}
            onClick={() => setSettings({ ...settings, notifyTelegramOnLead: false })}
          >
            Não
          </button>
        </div>
      </div>

      <label>
        Telegram Bot Token
        <input
          value={settings.telegramBotToken || ""}
          onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value || null })}
          placeholder="123456:ABC..."
        />
      </label>
      <label>
        Telegram Chat ID (global)
        <input
          value={settings.telegramChatId || ""}
          onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value || null })}
          placeholder="-100..."
        />
      </label>
      <label>
        Notas internas
        <textarea
          rows={2}
          value={settings.notes || ""}
          onChange={(e) => setSettings({ ...settings, notes: e.target.value || null })}
        />
      </label>

      {error && <p className="form-error">{error}</p>}
      {msg && <p className="success-box">{msg}</p>}
      <button type="submit" disabled={saving}>
        {saving ? "Salvando..." : "Salvar config global"}
      </button>
    </form>
  );
}
