import type { Page } from "@prisma/client";
import { TrackingBeacon } from "@/components/TrackingBeacon";
import { EngagementBlock } from "@/components/EngagementBlock";
import { VeloeHeroCarousel } from "@/components/landings/VeloeHeroCarousel";
import { VeloePlansGrid } from "@/components/landings/VeloePlansGrid";
import { VeloeFAQ } from "@/components/landings/VeloeFAQ";
import { VeloeHeader } from "@/components/landings/VeloeHeader";
import {
  ASSET,
  SOCIAL,
  STEPS,
  WHERE_CARDS,
} from "@/lib/veloe-content";

type Props = {
  page: Page;
  domain: string;
  compact?: boolean;
  showDisclaimer?: boolean;
};

const TABS = ["Pessoa Física", "Pessoa Júridica", "Parcerias"];

export function VeloeLanding({
  page,
  domain,
  compact = false,
  showDisclaimer = false,
}: Props) {
  return (
    <div className={`vl-site${compact ? " is-compact" : ""}`} id="topo">
      <TrackingBeacon pageId={page.id} domain={domain} configRaw={page.configJson} />

      <div className="vl-tabs-bar">
        <div className="vl-tabs-inner">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              type="button"
              className={`vl-tab${i === 0 ? " is-active" : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <VeloeHeader />

      {compact ? (
        <section className="vl-hero-compact">
          <h1>{page.headline || page.title}</h1>
          <p>
            {page.description ||
              "Dê adeus às filas em pedágios e estacionamentos. Com Veloe, você tem o caminho livre."}
          </p>
          <a className="vl-btn" href="#funil">
            Peça sua tag
          </a>
        </section>
      ) : (
        <VeloeHeroCarousel ctaHref="#funil" />
      )}

      {!compact && (
        <>
          <VeloePlansGrid ctaHref="#funil" />

          <section className="vl-section vl-where">
            <div className="vl-section-title-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${ASSET}/img-simplifique.png`} alt="" className="vl-section-deco" />
              <h1 className="vl-title">Onde usar Veloe</h1>
            </div>
            <div className="vl-smile" aria-hidden />
            <p className="vl-lead">
              Estamos presentes em todo o Brasil, em 100% das rodovias com pedágios e em mais de
              2600 estacionamentos de shoppings, aeroportos e muito mais.
            </p>
            <a className="vl-btn vl-btn-blue" href="#funil">
              Ver mapa
            </a>
            <div className="vl-where-grid">
              {WHERE_CARDS.map((card, i) => (
                <article key={card.title} className="vl-where-card">
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                  <a href="#funil" className="vl-link">
                    {card.cta}
                  </a>
                  {i < WHERE_CARDS.length - 1 && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${ASSET}/${i % 2 === 0 ? "arrow-face-up.png" : "arrow-face-down.png"}`}
                        alt=""
                        className="vl-where-arrow"
                        aria-hidden
                      />
                    </>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="vl-section vl-steps-section">
            <div className="vl-section-title-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${ASSET}/img-simplifique.png`} alt="" className="vl-section-deco" />
              <h2 className="vl-title">Comece agora</h2>
            </div>
            <div className="vl-smile" aria-hidden />
            <div className="vl-steps">
              {STEPS.map((step, i) => (
                <article key={step.step} className="vl-step-card">
                  <span className="vl-step-num">{step.step}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                  <a href="#funil" className="vl-link">
                    {step.cta}
                  </a>
                  {i < STEPS.length - 1 && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`${ASSET}/${i % 2 === 0 ? "arrow-face-down.png" : "arrow-face-up.png"}`}
                      alt=""
                      className="vl-step-arrow-img"
                      aria-hidden
                    />
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="vl-section vl-contact">
            <div className="vl-contact-inner">
              <h2>Para adquirir Veloe pelo telefone, é só ligar:</h2>
              <p className="vl-contact-hours">Segunda à sexta, das 09h às 19h.</p>
              <div className="vl-phones">
                <div className="vl-phone-block">
                  <span>Capitais e regiões metropolitanas</span>
                  <a href="tel:30039880">3003 9880</a>
                </div>
                <div className="vl-phone-block">
                  <span>Demais localidades</span>
                  <a href="tel:08002089880">0800 208 9880</a>
                </div>
              </div>
              <div className="vl-whatsapp">
                <p>Se preferir, peça Veloe pelo WhatsApp</p>
                <a href="https://wa.me/551130039880" target="_blank" rel="noopener noreferrer">
                  (11) 3003-9880
                </a>
              </div>
            </div>
          </section>

          <VeloeFAQ />
        </>
      )}

      <section className="vl-funil" id="funil">
        <div className="vl-funil-inner">
          <h2>{page.headline || "Quero minha tag Veloe"}</h2>
          <p>
            {page.description ||
              "Preencha abaixo e nossa equipe parceira entra em contato conforme a configuração desta página."}
          </p>
          <EngagementBlock pageId={page.id} domain={domain} configRaw={page.configJson} />
        </div>
      </section>

      <footer className="vl-footer">
        <div className="vl-footer-main">
          <div className="vl-footer-v">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${ASSET}/footer-v.png`} alt="Veloe" />
          </div>
          <div className="vl-footer-links">
            <ul>
              <li>
                <a href="#funil">Ativar</a>
              </li>
              <li>
                <a href="#funil">Blog</a>
              </li>
              <li>
                <a href="#funil">Mapa do site</a>
              </li>
            </ul>
            <div className="vl-footer-social">
              <span>Redes Sociais</span>
              <div className="vl-social-row">
                {SOCIAL.map((s) => (
                  <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.icon} alt="" width={24} height={24} />
                  </a>
                ))}
              </div>
            </div>
            <div className="vl-footer-apps">
              <span>Baixe o app</span>
              <div className="vl-store-row">
                <a
                  href="https://play.google.com/store/apps/details?id=br.com.veloe.mobile"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${ASSET}/badge-googleplay.png`} alt="Google Play" height={38} />
                </a>
                <a
                  href="https://itunes.apple.com/us/app/veloe/id1278343398"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${ASSET}/badge-appstore.png`} alt="App Store" height={38} />
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="vl-footer-legal">
          <p>
            Alelo S.A - Alameda Xingu, 512, Barueri - SP, 06455-030
            <br />© Todos os direitos reservados - Veloe 2026 - CNPJ: 04.740.876/0001-25
          </p>
          <a href="#funil">Contrato Veloe e Política de Privacidade</a>
        </div>
        {showDisclaimer && (
          <p className="vl-partner-note">
            Página operada por parceiro independente. Veloe é marca de seus respectivos titulares.
            Conteúdo inspirado no site oficial para campanhas de indicação.
          </p>
        )}
      </footer>
    </div>
  );
}
