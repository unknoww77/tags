import type { Page } from "@prisma/client";
import { TrackingBeacon } from "@/components/TrackingBeacon";
import { EngagementBlock } from "@/components/EngagementBlock";
import { ConectCarHeroCarousel } from "@/components/landings/ConectCarHeroCarousel";
import { ConectCarChatWidget } from "@/components/landings/ConectCarChatWidget";
import { ConectCarPlansGrid } from "@/components/landings/ConectCarPlansGrid";

type Props = {
  page: Page;
  domain: string;
  compact?: boolean;
  showDisclaimer?: boolean;
};

const ASSET = "/brands/conectcar";

const WHERE = [
  {
    title: "100% dos pedágios",
    text: "Com cancela ou Free Flow em todo o Brasil.",
    icon: `${ASSET}/icon-pedagio.png`,
  },
  {
    title: "Free Flow",
    text: "Passe sem parar nos pórticos Free Flow.",
    icon: `${ASSET}/icon-freeflow.png`,
  },
  {
    title: "Estacionamentos com e sem cancela",
    text: "Shoppings, aeroportos e hospitais",
    icon: `${ASSET}/icon-estacionamento.png`,
  },
  {
    title: "Escolas e universidades",
    text: "Clube, estádios, teatros",
    icon: `${ASSET}/icon-escola.png`,
  },
];

const PARTNERS = [
  { name: "Uniprime", src: `${ASSET}/partner-uniprime.png` },
  { name: "Maxi Frota", src: `${ASSET}/partner-maxifrota.png` },
  { name: "Itaú", src: `${ASSET}/partner-itau.png` },
  { name: "Porto Bank", src: `${ASSET}/partner-porto.png` },
  { name: "Mercado Pago", src: `${ASSET}/partner-mp.png` },
  { name: "Localiza Meoo", src: `${ASSET}/partner-meoo.png` },
  { name: "Localiza", src: `${ASSET}/partner-localiza.png` },
  { name: "SegSat", src: `${ASSET}/partner-segsat.png` },
  { name: "Unicred", src: `${ASSET}/partner-unicred.png` },
];

const NAV = [
  "Para Você",
  "Para Empresas",
  "Ativar",
  "Como Funciona",
  "Compre na Loja",
  "Blog ConectCar",
  "Free Flow",
  "Ajuda",
  "Login",
];

export function ConectCarLanding({
  page,
  domain,
  compact = false,
  showDisclaimer = false,
}: Props) {
  return (
    <div className={`cc-site${compact ? " is-compact" : ""}`}>
      <TrackingBeacon pageId={page.id} domain={domain} />

      <header className="cc-header">
        <div className="cc-header-inner">
          <a href="#topo" className="cc-logo" aria-label="ConectCar">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${ASSET}/logo-header.png`} alt="ConectCar" height={36} />
          </a>
          <nav className="cc-nav" aria-label="Menu primário">
            {NAV.map((item) => (
              <a key={item} href={item === "Como Funciona" ? "#como-funciona" : "#funil"}>
                {item}
              </a>
            ))}
          </nav>
          <a className="cc-header-cta" href="#funil">
            Peça já
          </a>
          <button type="button" className="cc-menu-btn" aria-label="Menu">
            Menu
          </button>
        </div>
      </header>

      <div className="cc-alert" id="topo">
        ATENÇÃO: Falsos atendentes estão se passando por nossa central de atendimento. Para sua
        segurança, fale com a gente apenas pelos nossos canais oficiais.
      </div>

      {compact ? (
        <section className="cc-hero-compact">
          <h1>{page.headline || page.title}</h1>
          <p>{page.description || "Pode ir tranquilo, por onde você for!"}</p>
          <a className="cc-btn-white" href="#funil">
            PEÇA JÁ
          </a>
        </section>
      ) : (
        <ConectCarHeroCarousel ctaHref="#funil" />
      )}

      {!compact && (
        <>
          <ConectCarPlansGrid ctaHref="#funil" />

          <section className="cc-section cc-section-muted">
            <h2>Compare e escolha o plano para seu perfil de uso</h2>
            <div className="cc-table-wrap">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>Plano</th>
                    <th>Mensalidade</th>
                    <th>Taxa de adesão</th>
                    <th>Método de pagamento</th>
                    <th>Recarga automática</th>
                    <th>Benefícios</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Completo</td>
                    <td>R$17,90/mês após 13º mês</td>
                    <td>—</td>
                    <td>Cartão de crédito</td>
                    <td>—</td>
                    <td>1 troca gratuita por ano</td>
                  </tr>
                  <tr>
                    <td>Básico</td>
                    <td>Sem mensalidade</td>
                    <td>R$20</td>
                    <td>Cartão de crédito e PIX</td>
                    <td>Opcional</td>
                    <td>Não possui mensalidade</td>
                  </tr>
                  <tr>
                    <td>Flex</td>
                    <td>R$18,90 no mês que usar</td>
                    <td>—</td>
                    <td>Cartão de crédito</td>
                    <td>—</td>
                    <td>Não usa, não paga</td>
                  </tr>
                  <tr>
                    <td>Free Flow</td>
                    <td>R$17,90 no mês que usar</td>
                    <td>R$30 revertido em saldo</td>
                    <td>Cartão de crédito</td>
                    <td>—</td>
                    <td>Sem mensalidade no free flow</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="cc-frotas">
            <div className="cc-frotas-grid">
              <div className="cc-frotas-copy">
                <h2>ConectCar Frotas: facilite a gestão de pedágios na sua empresa</h2>
                <ul className="cc-checks">
                  <li>CONTROLE</li>
                  <li>TRANSPARÊNCIA</li>
                  <li>AGILIDADE</li>
                  <li>SUPORTE</li>
                </ul>
                <p className="cc-frotas-extra">
                  E MAIS ECONOMIA: desconto de 1% em todos os abastecimentos!
                </p>
                <a className="cc-btn-white" href="#funil">
                  Conheça o ConectCar Frotas
                </a>
              </div>
              <div className="cc-frotas-visual">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${ASSET}/frota.png`} alt="ConectCar Frotas" />
              </div>
            </div>
          </section>

          <section className="cc-section" id="onde-usar">
            <h2>Presente por onde você for</h2>
            <p className="cc-lead">Consulte onde usar sua tag em pedágios e estacionamentos.</p>
            <a className="cc-link-orange" href="#funil">
              Consulte Onde Usar
            </a>
            <div className="cc-where">
              {WHERE.map((item) => (
                <article key={item.title}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.icon} alt="" className="cc-where-icon" />
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="cc-section cc-section-muted" id="como-funciona">
            <div className="cc-split">
              <div>
                <h2>Como funciona o pagamento com a sua Tag</h2>
                <p>
                  Pré-pago para você não se preocupar com saldo, recarga automática ou manual: veja
                  como funcionam as formas de pagamento da Tag ConectCar.
                </p>
                <a className="cc-btn-orange" href="#funil">
                  Saiba mais
                </a>
              </div>
              <div className="cc-split-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${ASSET}/pagamento.jpg`} alt="Pagamento com a Tag ConectCar" />
              </div>
            </div>
          </section>

          <section className="cc-section">
            <h2>Parceiros com ofertas exclusivas</h2>
            <p className="cc-lead">
              É cliente de um de nossos parceiros? Clique e garanta sua tag ConectCar com condições
              especiais!
            </p>
            <div className="cc-partners-track">
              {PARTNERS.map((p) => (
                <a key={p.name} href="#funil" className="cc-partner-logo" title={p.name}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.name} />
                </a>
              ))}
            </div>
          </section>

          <section className="cc-section cc-section-muted">
            <div className="cc-split">
              <div className="cc-split-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${ASSET}/sua-marca.png`} alt="Tag com a sua marca" />
              </div>
              <div>
                <h2>Possui uma empresa e quer oferecer mais esse benefício?</h2>
                <p>Veja como é fácil ter uma tag com a sua marca.</p>
                <a className="cc-btn-orange" href="#funil">
                  Seja nosso parceiro
                </a>
              </div>
            </div>
          </section>

          <section className="cc-app">
            <div className="cc-app-grid">
              <div className="cc-app-copy">
                <h2>
                  Quer mais da sua tag? Baixe o app ConectCar e tenha mais controle e autonomia
                </h2>
                <p>
                  Acompanhe seu saldo, acesse o extrato detalhado, gerencie suas recargas, confira
                  onde usar sua tag e muito mais!
                </p>
                <div className="cc-store-badges">
                  <a
                    href="https://itunes.apple.com/br/app/conectcar-mobile/id925081766?mt=8"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${ASSET}/badge-appstore.png`}
                      alt="Disponível na App Store"
                      height={54}
                    />
                  </a>
                  <a
                    href="https://play.google.com/store/apps/details?id=br.com.conectcar"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${ASSET}/badge-googleplay.png`}
                      alt="Disponível no Google Play"
                      height={54}
                    />
                  </a>
                </div>
              </div>
              <div className="cc-app-visual">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${ASSET}/app-phone.png`} alt="App ConectCar" />
              </div>
            </div>
          </section>
        </>
      )}

      <section className="cc-funil" id="funil">
        <div className="cc-funil-inner">
          <h2>Peça sua tag com atendimento de parceiro</h2>
          <p>
            Preencha o funil abaixo. Nossa equipe parceira entra em contato ou abre o WhatsApp,
            conforme a configuração desta página.
          </p>
          <EngagementBlock pageId={page.id} domain={domain} configRaw={page.configJson} />
        </div>
      </section>

      <footer className="cc-footer">
        <div className="cc-footer-top">
          <div className="cc-footer-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${ASSET}/logo-footer.png`} alt="ConectCar" height={40} />
            <div className="cc-iso-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${ASSET}/iso-27001.png`} alt="Certificação ISO 27001" height={72} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${ASSET}/iso-9001.png`} alt="Certificação ISO 9001" height={72} />
            </div>
          </div>

          <div>
            <h4>Políticas</h4>
            <ul>
              <li>Política de Privacidade</li>
              <li>Política Segurança da Informação</li>
              <li>Código de Conduta</li>
              <li>Política da Qualidade</li>
            </ul>
          </div>
          <div>
            <h4>A ConectCar</h4>
            <ul>
              <li>Sobre a ConectCar</li>
              <li>Manual do usuário</li>
              <li>Canais de Atendimento</li>
              <li>Segurança</li>
              <li>Planos para você</li>
            </ul>
          </div>
          <div>
            <h4>Regulamentos</h4>
            <ul>
              <li>Termo de adesão</li>
              <li>Termo de adesão – vale pedágio</li>
              <li>Regulamentos de benefícios</li>
            </ul>
          </div>
          <div className="cc-footer-aside">
            <h5>Siga a ConectCar</h5>
            <div className="cc-social">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${ASSET}/social-ig.png`} alt="Instagram" width={36} height={36} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${ASSET}/social-fb.png`} alt="Facebook" width={36} height={36} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${ASSET}/social-li.png`} alt="LinkedIn" width={36} height={36} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${ASSET}/social-yt.png`} alt="YouTube" width={36} height={36} />
            </div>
            <h5>Baixe nosso app</h5>
            <div className="cc-footer-stores">
              <a
                href="https://itunes.apple.com/br/app/conectcar-mobile/id925081766?mt=8"
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${ASSET}/btn-appstore-footer.png`} alt="App Store" height={40} />
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=br.com.conectcar"
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${ASSET}/btn-googleplay-footer.png`} alt="Google Play" height={40} />
              </a>
            </div>
          </div>
        </div>

        <div className="cc-footer-bottom">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${ASSET}/acionistas.png`} alt="Acionistas" className="cc-acionistas" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${ASSET}/selos.png`} alt="Selos e prêmios" className="cc-selos" />
        </div>

        {showDisclaimer && (
          <p className="cc-footer-legal">
            Página operada por parceiro independente da rede Top1Tags. ConectCar é marca de seus
            respectivos titulares. Conteúdo e imagens comerciais inspirados no site oficial para
            campanhas de indicação; condições podem variar.
          </p>
        )}
      </footer>

      <ConectCarChatWidget pageId={page.id} domain={domain} brandLabel="ConectCar" />
    </div>
  );
}
