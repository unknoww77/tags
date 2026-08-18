const ASSET = "/brands/conectcar";

export type ConectCarPlan = {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  priceNote?: string;
  badge?: string;
  featured?: boolean;
  ctaSolid?: boolean;
  rows: { label: string; value: string; highlight?: boolean }[];
};

/** Dados espelhados de lp.conectcar.com/planos + layout do card de comparação. */
export const CONECTCAR_PLANS: ConectCarPlan[] = [
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

export { ASSET };
