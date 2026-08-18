import type { Page } from "@prisma/client";
import { ConectCarLanding } from "@/components/landings/ConectCarLanding";
import { VeloeLanding } from "@/components/landings/VeloeLanding";

type Props = {
  page: Page;
  domain: string;
  showDisclaimer?: boolean;
};

export function LandingRenderer({ page, domain, showDisclaimer = false }: Props) {
  const compact = page.templateId === "compact";
  if (page.brand === "veloe") {
    return (
      <VeloeLanding
        page={page}
        domain={domain}
        compact={compact}
        showDisclaimer={showDisclaimer}
      />
    );
  }
  return (
    <ConectCarLanding
      page={page}
      domain={domain}
      compact={compact}
      showDisclaimer={showDisclaimer}
    />
  );
}
