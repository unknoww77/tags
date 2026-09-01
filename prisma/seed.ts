import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import {
  assertBootstrapSuperAdminConfig,
  readBootstrapSuperAdminConfig,
} from "../lib/bootstrap-env";

const prisma = new PrismaClient();

const SUPER_ADMIN_TENANT_ID = "super-admin-tenant";

const GLOBAL_SETTINGS_DEFAULTS = {
  id: "global",
  maxPagesPerTenant: 20,
  leadRetentionDays: 180,
  defaultSslMode: "flexible",
  showPartnerDisclaimer: true,
  notifyTelegramOnLead: false,
  allowTenantCustomWa: true,
  inviteDaysValid: 7,
} as const;

async function ensureSuperAdminTenant() {
  return prisma.tenant.upsert({
    where: { id: SUPER_ADMIN_TENANT_ID },
    update: {},
    create: {
      id: SUPER_ADMIN_TENANT_ID,
      name: "Super Admin (teste)",
    },
  });
}

async function ensureGlobalSettings() {
  await prisma.globalSettings.upsert({
    where: { id: "global" },
    update: {},
    create: { ...GLOBAL_SETTINGS_DEFAULTS },
  });
}

async function createInitialSuperAdmin() {
  const config = readBootstrapSuperAdminConfig();
  assertBootstrapSuperAdminConfig(config);

  const tenant = await ensureSuperAdminTenant();
  const passwordHash = await bcrypt.hash(config.password, 12);

  const user = await prisma.user.create({
    data: {
      username: config.username,
      email: config.email,
      name: config.name,
      passwordHash,
      role: "SUPER_ADMIN",
      tenantId: tenant.id,
    },
  });

  console.log(
    `Super admin created: username=${user.username} tenantId=${tenant.id}`,
  );
}

async function main() {
  await ensureGlobalSettings();

  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
    select: { id: true, username: true },
  });

  if (existingSuperAdmin) {
    console.log(
      `Super admin already exists (id=${existingSuperAdmin.id}); credentials preserved.`,
    );
    return;
  }

  const config = readBootstrapSuperAdminConfig();

  const collision = await prisma.user.findFirst({
    where: {
      OR: [{ email: config.email }, { username: config.username }],
    },
    select: { id: true, role: true },
  });

  if (collision) {
    throw new Error(
      `Cannot bootstrap SUPER_ADMIN: email/username already used by user ${collision.id} (role=${collision.role}). Resolve manually or use a different SUPER_ADMIN_EMAIL/SUPER_ADMIN_USERNAME.`,
    );
  }

  await createInitialSuperAdmin();
}

main()
  .catch((error) => {
    console.error("[seed] bootstrap failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
