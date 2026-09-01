/**
 * Credenciais e validação do bootstrap inicial (prisma/seed.ts).
 * Não usar para login em runtime — apenas criação do primeiro SUPER_ADMIN.
 */

const INSECURE_PASSWORDS = new Set([
  "changemenow123!",
  "change_me_before_first_boot",
  "admin123",
  "password",
  "123456",
  "localdevonly123!",
]);

export function isProductionNodeEnv(): boolean {
  return process.env.NODE_ENV === "production";
}

export function normalizeBootstrapUsername(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export function isPlaceholderOrInsecurePassword(password: string): boolean {
  const normalized = password.trim().toLowerCase();
  if (!normalized) return true;
  if (INSECURE_PASSWORDS.has(normalized)) return true;
  if (normalized.startsWith("change_me")) return true;
  if (normalized === "troque" || normalized.includes("troque-por")) return true;
  return false;
}

export function validateBootstrapPassword(password: string): void {
  const trimmed = password.trim();
  if (trimmed.length < 12) {
    throw new Error(
      "SUPER_ADMIN_PASSWORD must be at least 12 characters for initial bootstrap.",
    );
  }
  if (isPlaceholderOrInsecurePassword(trimmed)) {
    throw new Error(
      "SUPER_ADMIN_PASSWORD is a placeholder or known insecure value. Set a strong unique password before first bootstrap.",
    );
  }
}

export type BootstrapSuperAdminConfig = {
  username: string;
  email: string;
  name: string;
  password: string;
};

/**
 * Lê env do bootstrap. Em produção não há fallbacks para credenciais.
 * Em desenvolvimento, defaults locais facilitam docker-compose.dev.
 */
export function readBootstrapSuperAdminConfig(): BootstrapSuperAdminConfig {
  const isProd = isProductionNodeEnv();

  const usernameRaw = process.env.SUPER_ADMIN_USERNAME ?? (isProd ? "" : "admin");
  const emailRaw = process.env.SUPER_ADMIN_EMAIL ?? (isProd ? "" : "admin@top1tags.dev");
  const nameRaw = process.env.SUPER_ADMIN_NAME ?? (isProd ? "" : "Super Admin");
  const passwordRaw = process.env.SUPER_ADMIN_PASSWORD ?? (isProd ? "" : "LocalDevOnly123!");

  const username = normalizeBootstrapUsername(usernameRaw);
  const email = emailRaw.toLowerCase().trim();
  const name = nameRaw.trim();
  const password = passwordRaw;

  return { username, email, name, password };
}

export function assertBootstrapSuperAdminConfig(
  config: BootstrapSuperAdminConfig,
): void {
  if (!config.username) {
    throw new Error("Missing SUPER_ADMIN_USERNAME for initial bootstrap.");
  }
  if (!config.email) {
    throw new Error("Missing SUPER_ADMIN_EMAIL for initial bootstrap.");
  }
  if (!config.name) {
    throw new Error("Missing SUPER_ADMIN_NAME for initial bootstrap.");
  }
  validateBootstrapPassword(config.password);
}
