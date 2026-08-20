export type VeloeHeroSlide = {
  eyebrow: string;
  title: string;
  image: string;
  bgColor: string;
  textColor: string;
  ctaLabel: string;
  ctaBg: string;
  ctaColor: string;
};

export type VeloePlan = {
  id: string;
  title: string;
  subtitle: string;
  priceNote: string;
  rows: string[];
  ctaBg: string;
};

export type VeloeWhereCard = {
  title: string;
  text: string;
  cta: string;
};

export type VeloeStep = {
  step: string;
  title: string;
  text: string;
  cta: string;
};

export type VeloeFaqItem = {
  question: string;
  answer: string;
};

export const ASSET = "/brands/veloe";

export const HERO_SLIDES: VeloeHeroSlide[] = [
  {
    eyebrow: "Free Flow com Veloe",
    title: "Pagar pedágios eletrônicos é muito mais fácil!",
    image: `${ASSET}/banners/freeflow.webp`,
    bgColor: "#230C87",
    textColor: "#FFFFFF",
    ctaLabel: "Saiba mais",
    ctaBg: "#25D6E9",
    ctaColor: "#FFFFFF",
  },
  {
    eyebrow: "Mais tempo pra curtir",
    title: "Passagem automática em pedágios e estacionamentos",
    image: `${ASSET}/banners/fim-de-ano.webp`,
    bgColor: "#25D6E9",
    textColor: "#230C87",
    ctaLabel: "Peça sua tag",
    ctaBg: "#0C41ED",
    ctaColor: "#FFFFFF",
  },
];

export const PLANS: VeloePlan[] = [
  {
    id: "combo",
    title: "Pedágios e estacionamentos",
    subtitle: "3 mensalidades grátis",
    priceNote: "Após esse período, a partir de R$18,90/mês",
    rows: [
      "Recarga automática (a partir de R$50) ou Pós-pago",
      "Sem adicional por uso em pedágios ou estacionamentos",
      "Adesão gratuita",
      "Entrega grátis da tag",
      "Pagamento com cartão de crédito e débito em conta",
    ],
    ctaBg: "#25D6E9",
  },
  {
    id: "sem-mensalidade",
    title: "Pedágios e Estacionamentos",
    subtitle: "Sem Mensalidades",
    priceNote: "Recarregue e use quando quiser",
    rows: [
      "Recarga manual",
      "Valores pra recarga: R$50, R$75, R$100, R$150, R$200, R$250, R$350 e R$500 com taxas variáveis",
      "Sem adicional por uso em pedágios ou estacionamentos",
      "Cobrança de R$20 por tag ativa",
      "Entrega grátis da tag",
      "Pagamento com cartão de crédito",
    ],
    ctaBg: "#FF5757",
  },
  {
    id: "pedagios",
    title: "Pedágios",
    subtitle: "3 mensalidades grátis",
    priceNote: "Após esse período, por apenas R$14,90/mês",
    rows: [
      "Recarga automática: a partir de R$50",
      "Adicional de R$1,90 por uso em estacionamentos",
      "Adesão gratuita",
      "Entrega grátis da tag",
      "Pagamento com cartão de crédito",
    ],
    ctaBg: "#8B2CE1",
  },
  {
    id: "estacionamentos",
    title: "Estacionamentos",
    subtitle: "3 mensalidades grátis",
    priceNote: "Após esse período, por apenas R$9,90/mês",
    rows: [
      "Recarga automática: a partir de R$50",
      "Adicional de R$12,00 no mês que usar em pedágios",
      "Adesão gratuita",
      "Entrega grátis da tag",
      "Pagamento com cartão de crédito",
    ],
    ctaBg: "#25D6E9",
  },
];

export const WHERE_CARDS: VeloeWhereCard[] = [
  {
    title: "Pedágio",
    text: "Passe sem precisar parar e com mais praticidade em 100% das estradas pedagiadas do Brasil.",
    cta: "Saiba mais",
  },
  {
    title: "Estacionamento",
    text: "Passe direto em estacionamentos e dê adeus aos tickets para reembolso e filas de pagamento.",
    cta: "Saiba mais",
  },
  {
    title: "Vale-pedágio",
    text: "Receba o pagamento do vale-pedágio de forma digital, dentro da lei e sem manuseio de dinheiro.",
    cta: "Saiba mais",
  },
];

export const STEPS: VeloeStep[] = [
  {
    step: "1",
    title: "Adquira",
    text: "Você recebe a tag na sua casa em até 5 dias úteis.",
    cta: "Quero Veloe",
  },
  {
    step: "2",
    title: "Ative",
    text: "É preciso ativar Veloe antes de começar a usar. Acesse Minha Conta ou o app.",
    cta: "Veja como",
  },
  {
    step: "3",
    title: "Como usar",
    text: "Depois de ativar, veja no manual de aplicação como colar a tag Veloe.",
    cta: "Como colar adesivo",
  },
  {
    step: "4",
    title: "Pronto pra usar",
    text: "Agora você pode aproveitar Veloe e curtir do seu jeito.",
    cta: "Onde usar",
  },
];

export const FAQ_ITEMS: VeloeFaqItem[] = [
  {
    question: "O que é a tag Veloe?",
    answer:
      "É um meio de pagamento que deve ser colocado no para-brisa do veículo. A comunicação é feita radiofrequência com as cancelas automáticas dos estabelecimentos que possuem Veloe, liberando a passagem em pedágios e estacionamentos.",
  },
  {
    question: "Minha tag ainda não chegou, o que eu faço?",
    answer:
      "O prazo de entrega é de até três dias úteis pra São Paulo, capital e até cinco dias úteis pra demais localidades do Brasil. Você pode acompanhar a entrega através do Minha Conta ou pelo app. É só fazer o login e clicar em rastreio do pedido.",
  },
];

export const NAV_DROPDOWNS = [
  {
    label: "Serviços",
    links: ["Pedágios", "Estacionamentos", "Vale-pedágio", "Débitos veiculares"],
  },
  {
    label: "Vantagens",
    links: ["Pague com o App", "Monitor de Combustíveis"],
  },
];

export const NAV_LINKS = ["Nossos parceiros", "Cobertura", "Ajuda", "Ativar"];

export const ACCOUNT_LINKS = [
  "Pessoa Física (Tag)",
  "Pessoa Jurídica (Tag)",
  "Estabelecimento comercial",
  "Veloe Go (Alelo Frota)",
];

export const SOCIAL = [
  { name: "Instagram", href: "https://www.instagram.com/veloebr/", icon: `${ASSET}/social-instagram.png` },
  { name: "Facebook", href: "https://www.facebook.com/Veloebr/", icon: `${ASSET}/social-facebook.png` },
  { name: "YouTube", href: "https://www.youtube.com/c/Veloe", icon: `${ASSET}/social-youtube.png` },
  { name: "Twitter", href: "https://twitter.com/veloebr", icon: `${ASSET}/social-twitter.png` },
  { name: "Spotify", href: "https://open.spotify.com/user/pjad7ksh9sgzgwv78gocc647r", icon: `${ASSET}/social-spotify.png` },
];
