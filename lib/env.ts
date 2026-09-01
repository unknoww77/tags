function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

export const env = {
  databaseUrl: () => required("DATABASE_URL"),
  authSecret: () => required("AUTH_SECRET", process.env.NEXTAUTH_SECRET),
  platformDomain: () => (process.env.PLATFORM_DOMAIN ?? "top1tags.dev").toLowerCase(),
  appUrl: () => process.env.APP_URL ?? `https://${process.env.PLATFORM_DOMAIN ?? "top1tags.dev"}`,
  cronSecret: () => process.env.CRON_SECRET ?? "",
  cloudflareApiToken: () => process.env.CLOUDFLARE_API_TOKEN ?? "",
  cloudflareAccountId: () => process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
  /** Global API Key (legado) — tem zone.create; preferível junto com CLOUDFLARE_EMAIL */
  cloudflareApiKey: () => process.env.CLOUDFLARE_API_KEY ?? "",
  cloudflareEmail: () => process.env.CLOUDFLARE_EMAIL ?? "",
  trackingSalt: () => process.env.TRACKING_IP_SALT ?? "top1tags-dev-salt",
  /** Usado apenas em documentação/bootstrap — não há login via estes getters no runtime. */
  superAdminEmail: () => {
    const value = process.env.SUPER_ADMIN_EMAIL;
    if (value) return value;
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing env: SUPER_ADMIN_EMAIL");
    }
    return "admin@top1tags.dev";
  },
  superAdminUsername: () => {
    const value = process.env.SUPER_ADMIN_USERNAME;
    if (value) return value;
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing env: SUPER_ADMIN_USERNAME");
    }
    return "admin";
  },
  superAdminPassword: () => {
    const value = process.env.SUPER_ADMIN_PASSWORD;
    if (value) return value;
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing env: SUPER_ADMIN_PASSWORD");
    }
    return "LocalDevOnly123!";
  },
  superAdminName: () => {
    const value = process.env.SUPER_ADMIN_NAME;
    if (value) return value;
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing env: SUPER_ADMIN_NAME");
    }
    return "Super Admin";
  },
  /** IP público da VPS — registros A dos custom domains na Cloudflare apontam aqui. */
  originIp: () => process.env.ORIGIN_IP?.trim() ?? "",
};

export function isPlatformHost(host: string): boolean {
  const domain = env.platformDomain();
  const h = host.toLowerCase().split(":")[0];
  return (
    h === domain ||
    h === `www.${domain}` ||
    h === "localhost" ||
    h === "127.0.0.1" ||
    h.endsWith(".localhost")
  );
}

export function getPreviewSlug(host: string): string | null {
  const domain = env.platformDomain();
  const h = host.toLowerCase().split(":")[0];
  if (h === domain || h === `www.${domain}`) return null;
  if (h.endsWith(`.${domain}`)) {
    const slug = h.slice(0, -(domain.length + 1));
    if (!slug || slug.includes(".")) return null;
    return slug;
  }
  return null;
}
