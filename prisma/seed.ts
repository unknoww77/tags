import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

async function main() {
  const username = normalizeUsername(process.env.SUPER_ADMIN_USERNAME ?? "admin");
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

  const existingByEmail = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  const user = existingByEmail
    ? await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          username,
          email,
          name,
          passwordHash,
          role: "SUPER_ADMIN",
          tenantId: tenant.id,
        },
      })
    : await prisma.user.create({
        data: {
          username,
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

  console.log(`Super admin ready: vulgo=${user.username} (tenant ${tenant.name})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
