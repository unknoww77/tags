import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LandingRenderer } from "@/components/LandingRenderer";
import { getEffectiveSettings } from "@/lib/settings";

type Props = {
  params: Promise<{ hostname: string }>;
};

export default async function CustomDomainSitePage({ params }: Props) {
  const { hostname: encoded } = await params;
  const hostname = decodeURIComponent(encoded).toLowerCase();

  const domain = await prisma.domain.findUnique({
    where: { hostname },
    include: { page: true },
  });

  if (!domain || domain.nsStatus !== "active" || domain.page.status === "archived") {
    notFound();
  }

  const settings = await getEffectiveSettings(domain.page.tenantId);
  if (settings.disabled) notFound();

  return (
    <LandingRenderer
      page={domain.page}
      domain={hostname}
      showDisclaimer={settings.showPartnerDisclaimer}
    />
  );
}
