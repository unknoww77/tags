"use client";

import { FieldLabel, HelpTip } from "@/components/HelpTip";
import { YesNoSelector } from "@/components/SelectorButton";
import {
  defaultSentinelConfig,
  veloeSentinelPresets,
  conectcarSentinelPresets,
  type PageEngagementConfig,
  type SentinelEventType,
  type SentinelSelectorRule,
} from "@/lib/page-config";

type Props = {
  value: PageEngagementConfig;
  onChange: (next: PageEngagementConfig) => void;
  brand?: "conectcar" | "veloe";
};

const EVENT_OPTIONS: SentinelEventType[] = [
  "pageview",
  "init_checkout",
  "add_to_cart",
  "purchase",
];

export function SentinelTrackingConfigFields({ value, onChange, brand }: Props) {
  const sentinel = value.sentinel ?? defaultSentinelConfig();

  function patch(partial: Partial<typeof sentinel>) {
    onChange({ ...value, sentinel: { ...sentinel, ...partial } });
  }

  function updateSelector(id: string, partial: Partial<SentinelSelectorRule>) {
    patch({
      selectors: sentinel.selectors.map((rule) => (rule.id === id ? { ...rule, ...partial } : rule)),
    });
  }

  function addSelector() {
    patch({
      selectors: [
        ...sentinel.selectors,
        {
          id: `selector_${Date.now().toString(36)}`,
          selector: "",
          eventType: "add_to_cart",
          label: "",
        },
      ],
    });
  }

  function removeSelector(id: string) {
    patch({ selectors: sentinel.selectors.filter((rule) => rule.id !== id) });
  }

  return (
    <div className="engagement-config">
      <h3 className="field-label-row">
        Trackeamento
        <HelpTip text="Configure a integração com o Sentinel para enviar pageview, eventos do funil e cliques por seletor. O envio é feito pelo servidor para não expor a chave na página pública." />
      </h3>

      <YesNoSelector
        label="Ativar Sentinel Tracking nesta página?"
        value={sentinel.enabled}
        onChange={(enabled) => patch({ enabled })}
        help="Quando ativado, esta página envia pageview e eventos do funil para o Sentinel usando a chave configurada abaixo."
      />

      <div className="stack-tight">
        <label>
          <FieldLabel help="Chave pública ou de ingestão usada para enviar os eventos ao Sentinel. Ela fica salva na configuração da página, mas o envio é feito pelo backend.">
            API Key do Sentinel
          </FieldLabel>
          <input
            value={sentinel.apiKey}
            onChange={(e) => patch({ apiKey: e.target.value })}
            placeholder="Cole aqui a API key do Sentinel"
          />
        </label>

        <label>
          <FieldLabel help="Endpoint de ingestão do Sentinel. Já deixei um padrão preenchido para acelerar, mas você pode trocar se sua conta usar outro domínio/rota.">
            Endpoint de eventos
          </FieldLabel>
          <input
            value={sentinel.endpoint}
            onChange={(e) => patch({ endpoint: e.target.value })}
            placeholder="https://sentinel.1001api.com/api/v1/event"
          />
        </label>

        <label>
          <FieldLabel help="Nome do parâmetro de click id que vem da mídia. Exemplo comum: click_id. Também usamos esse valor para anexar a atribuição do visitante ao evento enviado.">
            Parâmetro do click_id
          </FieldLabel>
          <input
            value={sentinel.clickIdParam}
            onChange={(e) => patch({ clickIdParam: e.target.value })}
            placeholder="click_id"
          />
        </label>
      </div>

      <YesNoSelector
        label="Enviar pageview automaticamente?"
        value={sentinel.pageviewEnabled}
        onChange={(pageviewEnabled) => patch({ pageviewEnabled })}
        help="Recomendado para medir tráfego e alimentar a atribuição desde a chegada do visitante."
      />

      <div className="selector-group">
        <span className="selector-label">
          <FieldLabel help="Escolha qual evento o Sentinel recebe quando o visitante conclui o fluxo sem WhatsApp. Normalmente add_to_cart para lead e purchase só para conversão quente.">
            Evento ao finalizar o quiz/form sem WhatsApp
          </FieldLabel>
        </span>
        <div className="selector-row wrap">
          {EVENT_OPTIONS.map((eventType) => (
            <button
              key={eventType}
              type="button"
              className={`selector-btn${sentinel.finalNoWhatsappEvent === eventType ? " is-active" : ""}`}
              onClick={() => patch({ finalNoWhatsappEvent: eventType })}
            >
              {eventType}
            </button>
          ))}
        </div>
      </div>

      <div className="selector-group">
        <span className="selector-label">
          <FieldLabel help="Se a página abre o WhatsApp, você decide qual evento enviar no clique do botão final. Minha recomendação: purchase para tráfego mais quente ou add_to_cart se seu time ainda vai qualificar depois.">
            Evento ao clicar no botão do WhatsApp
          </FieldLabel>
        </span>
        <div className="selector-row wrap">
          {EVENT_OPTIONS.map((eventType) => (
            <button
              key={eventType}
              type="button"
              className={`selector-btn${sentinel.whatsappClickEvent === eventType ? " is-active" : ""}`}
              onClick={() => patch({ whatsappClickEvent: eventType })}
            >
              {eventType}
            </button>
          ))}
        </div>
      </div>

      <div className="selector-group">
        <span className="selector-label">
          <FieldLabel help="Seletores CSS extras para disparar eventos em outros botões ou links da landing. Exemplo: .hero-cta, .faq-whatsapp, [data-track='banner'].">
            Seletores adicionais
          </FieldLabel>
        </span>
        {brand && (
          <div className="selector-row wrap">
            <button
              type="button"
              className="selector-btn"
              onClick={() =>
                patch({
                  selectors: brand === "veloe" ? veloeSentinelPresets() : conectcarSentinelPresets(),
                })
              }
            >
              Aplicar presets {brand === "veloe" ? "Veloe" : "ConectCar"}
            </button>
          </div>
        )}
        <div className="stack">
          {sentinel.selectors.map((rule, index) => (
            <div key={rule.id} className="quiz-editor-card">
              <label>
                <FieldLabel help="Seletor CSS do elemento que deve disparar o evento.">
                  Seletor {index + 1}
                </FieldLabel>
                <input
                  value={rule.selector}
                  onChange={(e) => updateSelector(rule.id, { selector: e.target.value })}
                  placeholder=".hero-cta"
                />
              </label>
              <label>
                <FieldLabel help="Nome amigável para identificar o clique no Sentinel.">
                  Rótulo
                </FieldLabel>
                <input
                  value={rule.label}
                  onChange={(e) => updateSelector(rule.id, { label: e.target.value })}
                  placeholder="Hero CTA"
                />
              </label>
              <div className="selector-row wrap">
                {EVENT_OPTIONS.map((eventType) => (
                  <button
                    key={eventType}
                    type="button"
                    className={`selector-btn${rule.eventType === eventType ? " is-active" : ""}`}
                    onClick={() => updateSelector(rule.id, { eventType })}
                  >
                    {eventType}
                  </button>
                ))}
                <button type="button" className="linkish" onClick={() => removeSelector(rule.id)}>
                  Remover seletor
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="selector-btn" onClick={addSelector}>
            + adicionar seletor
          </button>
        </div>
      </div>

      <div className="info-box">
        <strong>Fluxo recomendado</strong>
        <p>
          `pageview` na entrada da página, `init_checkout` em um CTA importante da landing
          (opcional via seletor), `add_to_cart` ao concluir quiz/form sem WhatsApp e `purchase` no
          clique do WhatsApp quando esse clique já representa lead quente.
        </p>
      </div>
    </div>
  );
}
