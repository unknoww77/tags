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
  trackingSalt: () => process.env.TRACKING_IP_SALT ?? "top1tags-dev-salt",
  superAdminEmail: () => process.env.SUPER_ADMIN_EMAIL ?? "admin@top1tags.dev",
  superAdminPassword: () => process.env.SUPER_ADMIN_PASSWORD ?? "ChangeMeNow123!",
  superAdminName: () => process.env.SUPER_ADMIN_NAME ?? "Super Admin",
};

export function isPlatformHost(host: string): boolean {
  const domain = env.platformDomain();
  const h = host.toLowerCase().split(":")[0];
  return h === domain || h === `www.${domain}` || h === "localhost" || h.endsWith(".localhost");
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
