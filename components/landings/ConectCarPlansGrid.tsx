type PlanRow = { label: string; value: string; highlight?: boolean };

type Plan = {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  priceNote?: string;
  badge?: string;
  featured?: boolean;
  ctaSolid?: boolean;
  rows: PlanRow[];
};

const PLANS: Plan[] = [
  {
    id: "completo",
    name: "Plano Completo",
    subtitle: "Aproveite suas viagens com muito mais comodidade e economia",
    price: "R$ 0,00",
    priceNote: "A partir do 13º mês, R$17,90/mês",
    badge: "O plano mais vendido!",
    featured: true,
    ctaSolid: true,
    rows: [
      { label: "Adesão", value: "Grátis" },
      { label: "Troca de tag", value: "1 troca grátis por ano" },
      { label: "Taxa de recarga", value: "Não possui taxa" },
      { label: "Pagamento", value: "Cartão de crédito" },
    ],
  },
  {
    id: "basico",
    name: "Plano Básico",
    subtitle: "Todas as facilidades ConectCar, livre de mensalidades",
    price: "R$ 0,00",
    priceNote: "O plano Básico possui R$20 de taxa de adesão",
    rows: [
      { label: "Adesão", value: "R$20" },
      { label: "Troca de tag", value: "R$25" },
      { label: "Taxa de recarga", value: "Valor variável", highlight: true },
      { label: "Pagamento", value: "Cartão de crédito e PIX" },
    ],
  },
  {
    id: "flex",
    name: "Plano Flex",
    subtitle: "Não usa, não paga — livre de taxa de adesão",
    price: "R$ 18,90",
    priceNote: "Somente no mês que usar",
    badge: "SEM TAXA DE INATIVIDADE",
    rows: [
      { label: "Adesão", value: "Grátis" },
      { label: "Troca de tag", value: "R$25" },
      { label: "Taxa de inatividade", value: "Não possui" },
      { label: "Pagamento", value: "Cartão de crédito" },
    ],
  },
  {
    id: "freeflow",
    name: "Plano Free Flow",
    subtitle: "Para quem usa apenas nos pórticos Free Flow",
    price: "R$ 0,00",
    priceNote: "R$17,90 no mês que usar fora do Free Flow",
    badge: "FREE FLOW FREE MENSALIDADES",
    rows: [
      { label: "Adesão", value: "R$30 em saldo" },
      { label: "Troca de tag", value: "R$25" },
      { label: "Mensalidade Free Flow", value: "Grátis" },
      { label: "Pagamento", value: "Cartão de crédito" },
    ],
  },
];

type Props = {
  ctaHref?: string;
};

export function ConectCarPlansGrid({ ctaHref = "#funil" }: Props) {
  return (
    <section className="cc-plans-official" id="planos">
      <div className="cc-plans-official-inner">
        <h2>Escolha o plano que mais combina com você</h2>
        <div className="cc-plans-grid">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`cc-plan-official${plan.featured ? " is-featured" : ""}`}
            >
              {plan.badge && <span className="cc-plan-official-badge">{plan.badge}</span>}
              <h3>{plan.name}</h3>
              <p className="cc-plan-official-sub">{plan.subtitle}</p>

              <div className="cc-plan-official-price">
                <strong>
                  {plan.price}
                  <span> /mês</span>
                </strong>
                {plan.priceNote && <small>{plan.priceNote}</small>}
              </div>

              <ul className="cc-plan-official-rows">
                {plan.rows.map((row) => (
                  <li key={row.label}>
                    <span>{row.label}</span>
                    <strong className={row.highlight ? "is-accent" : undefined}>
                      {row.value}
                      {row.highlight && <i className="cc-info-i" aria-hidden>i</i>}
                    </strong>
                  </li>
                ))}
              </ul>

              <a
                className={`cc-plan-official-cta${plan.ctaSolid ? " is-solid" : ""}`}
                href={ctaHref}
              >
                Pedir tag
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
