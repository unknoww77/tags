"use client";

import { useEffect, useState } from "react";
import { HelpTip } from "@/components/HelpTip";

type Props = {
  tenantId: string;
  tenantName: string;
};

type TenantSettings = {
  maxPages: number | null;
  leadRetentionDays: number | null;
  notifyTelegramOnLead: boolean | null;
  telegramChatId: string | null;
  disabled: boolean;
  notes: string | null;
};

const empty: TenantSettings = {
  maxPages: null,
  leadRetentionDays: null,
  notifyTelegramOnLead: null,
  telegramChatId: null,
  disabled: false,
  notes: null,
};

export function TenantSettingsForm({ tenantId, tenantName }: Props) {
  const [settings, setSettings] = useState<TenantSettings>(empty);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch(`/api/super/tenants/${tenantId}/settings`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Erro");
        setSettings(d.tenant.settings ?? empty);
      })
      .catch((e) => setError(e.message));
  }, [tenantId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMsg("");
    const res = await fetch(`/api/super/tenants/${tenantId}/settings`, {
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
    setSettings(data.settings ?? empty);
    setMsg(`Override de ${tenantName} salvo.`);
  }

  async function clearOverrides() {
    setSaving(true);
    const res = await fetch(`/api/super/tenants/${tenantId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearOverrides: true }),
    });
    setSaving(false);
    if (res.ok) {
      setSettings(empty);
      setMsg("Overrides removidos — herda o global.");
    }
  }

  return (
    <form className="panel-form" onSubmit={save}>
      <p className="muted">
        Campos vazios / null herdam a config global. Só preencha o que quiser diferente para{" "}
        <strong>{tenantName}</strong>.
      </p>
      <label>
        <span className="field-label-row">
          Máx. páginas (override)
          <HelpTip text="Deixe vazio para herdar o global. Número = limite só deste tenant." />
        </span>
        <input
          type="number"
          min={1}
          placeholder="herda global"
          value={settings.maxPages ?? ""}
          onChange={(e) =>
            setSettings({
              ...settings,
              maxPages: e.target.value === "" ? null : Number(e.target.value),
            })
          }
        />
      </label>
      <label>
        Retenção leads dias (override)
        <input
          type="number"
          min={7}
          placeholder="herda global"
          value={settings.leadRetentionDays ?? ""}
          onChange={(e) =>
            setSettings({
              ...settings,
              leadRetentionDays: e.target.value === "" ? null : Number(e.target.value),
            })
          }
        />
      </label>
      <label>
        Telegram Chat ID (override)
        <input
          value={settings.telegramChatId || ""}
          onChange={(e) =>
            setSettings({ ...settings, telegramChatId: e.target.value || null })
          }
          placeholder="herda global"
        />
      </label>
      <div className="selector-group">
        <span className="selector-label">Notify Telegram (override)</span>
        <div className="selector-row wrap">
          <button
            type="button"
            className={`selector-btn${settings.notifyTelegramOnLead === null ? " is-active" : ""}`}
            onClick={() => setSettings({ ...settings, notifyTelegramOnLead: null })}
          >
            Herdar
          </button>
          <button
            type="button"
            className={`selector-btn${settings.notifyTelegramOnLead === true ? " is-active" : ""}`}
            onClick={() => setSettings({ ...settings, notifyTelegramOnLead: true })}
          >
            Sim
          </button>
          <button
            type="button"
            className={`selector-btn${settings.notifyTelegramOnLead === false ? " is-active" : ""}`}
            onClick={() => setSettings({ ...settings, notifyTelegramOnLead: false })}
          >
            Não
          </button>
        </div>
      </div>
      <div className="selector-group">
        <span className="selector-label">
          Conta desativada
          <HelpTip text="Se Sim, o tenant não cria páginas nem recebe leads." />
        </span>
        <div className="selector-row">
          <button
            type="button"
            className={`selector-btn${settings.disabled ? " is-active" : ""}`}
            onClick={() => setSettings({ ...settings, disabled: true })}
          >
            Sim
          </button>
          <button
            type="button"
            className={`selector-btn${!settings.disabled ? " is-active" : ""}`}
            onClick={() => setSettings({ ...settings, disabled: false })}
          >
            Não
          </button>
        </div>
      </div>
      <label>
        Notas
        <textarea
          rows={2}
          value={settings.notes || ""}
          onChange={(e) => setSettings({ ...settings, notes: e.target.value || null })}
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      {msg && <p className="success-box">{msg}</p>}
      <div className="selector-row wrap">
        <button type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar override"}
        </button>
        <button type="button" className="selector-btn" onClick={clearOverrides} disabled={saving}>
          Limpar overrides
        </button>
      </div>
    </form>
  );
}
