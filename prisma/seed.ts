import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SUPER_ADMIN_EMAIL ?? "admin@top1tags.dev").toLowerCase().trim();
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "ChangeMeNow123!";
  const name = process.env.SUPER_ADMIN_NAME ?? "Super Admin";

  const passwordHash = await bcrypt.hash(password, 12);

  const tenant = await prisma.tenant.upsert({
    where: { id: "super-admin-tenant" },
    update: { name: "Super Admin (teste)" },
    create: {
      id: "super-admin-tenant",
      name: "Super Admin (teste)",
    },
  });

  // upsert by email — if tenant id fixed fails on first run without where unique on name
  // Tenant.id is cuid by default; fixed id works for upsert.

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: "SUPER_ADMIN",
      tenantId: tenant.id,
    },
    create: {
      email,
      name,
      passwordHash,
      role: "SUPER_ADMIN",
      tenantId: tenant.id,
    },
  });

  await prisma.globalSettings.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      maxPagesPerTenant: 20,
      leadRetentionDays: 180,
      defaultSslMode: "flexible",
      showPartnerDisclaimer: true,
      notifyTelegramOnLead: false,
      allowTenantCustomWa: true,
      inviteDaysValid: 7,
    },
  });

  console.log(`Super admin ready: ${user.email} (tenant ${tenant.name})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
