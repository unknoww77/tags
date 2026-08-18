import type { Brand } from "@prisma/client";

export type TemplateMeta = {
  id: string;
  brand: Brand;
  name: string;
  description: string;
};

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "default",
    brand: "conectcar",
    name: "ConectCar — Completo",
    description: "Hero + planos + funil completo.",
  },
  {
    id: "compact",
    brand: "conectcar",
    name: "ConectCar — Compacto",
    description: "Hero curto + funil (menos seções).",
  },
  {
    id: "default",
    brand: "veloe",
    name: "Veloe — Completo",
    description: "Hero + cobertura + funil.",
  },
  {
    id: "compact",
    brand: "veloe",
    name: "Veloe — Compacto",
    description: "Hero curto + funil.",
  },
];

export function getTemplatesForBrand(brand: Brand): TemplateMeta[] {
  return TEMPLATES.filter((t) => t.brand === brand);
}

export const BRAND_LABELS: Record<Brand, string> = {
  conectcar: "ConectCar",
  veloe: "Veloe",
};
