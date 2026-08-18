import type { Page } from "@prisma/client";
import { TrackingBeacon } from "@/components/TrackingBeacon";
import { EngagementBlock } from "@/components/EngagementBlock";

type Props = {
  page: Page;
  domain: string;
  compact?: boolean;
  showDisclaimer?: boolean;
};

export function VeloeLanding({
  page,
  domain,
  compact = false,
  showDisclaimer = true,
}: Props) {
  return (
    <div className={`landing landing-veloe${compact ? " is-compact" : ""}`}>
      <TrackingBeacon pageId={page.id} domain={domain} />
      <header className="landing-nav">
        <strong>Veloe</strong>
        <span className="partner-badge">Parceiro autorizado</span>
      </header>

      <section className="landing-hero">
        <p className="eyebrow">Pedágios, Free Flow e estacionamentos</p>
        <h1>{page.headline || page.title}</h1>
        <p className="lead">
          {page.description ||
            "Passe sem filas com pagamento automático e mais segurança no dia a dia."}
        </p>
        {showDisclaimer && (
          <p className="hero-disclaimer">
            Página de parceiro independente — não é o site oficial da marca.
          </p>
        )}
      </section>

      {!compact && (
        <section className="landing-plans">
          <h2>Onde usar Veloe</h2>
          <div className="plan-grid">
            <article>
              <h3>100% dos pedágios</h3>
              <p>Cobertura nacional em rodovias com cancela ou Free Flow.</p>
            </article>
            <article>
              <h3>+2.600 estacionamentos</h3>
              <p>Shoppings, aeroportos e estabelecimentos parceiros.</p>
            </article>
            <article>
              <h3>App na mão</h3>
              <p>Acompanhe uso, saldo e benefícios direto no celular.</p>
            </article>
          </div>
        </section>
      )}

      <section className="landing-cta-band" id="funil">
        <h2>Quero minha tag Veloe</h2>
        <EngagementBlock pageId={page.id} domain={domain} configRaw={page.configJson} />
      </section>

      {showDisclaimer && (
        <footer className="landing-footer">
          <p>
            Página operada por parceiro independente. Veloe é marca de seus respectivos titulares.
            Esta página facilita o pedido e o acompanhamento de campanhas.
          </p>
        </footer>
      )}
    </div>
  );
}
