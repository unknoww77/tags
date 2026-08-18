import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LandingRenderer } from "@/components/LandingRenderer";
import { env } from "@/lib/env";
import { getEffectiveSettings } from "@/lib/settings";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PreviewSitePage({ params }: Props) {
  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page || page.status === "archived") notFound();

  const settings = await getEffectiveSettings(page.tenantId);
  if (settings.disabled) notFound();

  const domain = `${slug}.${env.platformDomain()}`;
  return (
    <LandingRenderer
      page={page}
      domain={domain}
      showDisclaimer={settings.showPartnerDisclaimer}
    />
  );
}
