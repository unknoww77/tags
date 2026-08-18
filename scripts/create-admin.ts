import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@teste.dev";
  const password = "Admin123!";
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });
  let tenantId = existing?.tenantId;

  if (!tenantId) {
    const tenant = await prisma.tenant.create({ data: { name: "Tenant Teste" } });
    tenantId = tenant.id;
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Admin Teste",
      passwordHash,
      role: "TENANT_ADMIN",
      tenantId,
    },
    create: {
      email,
      name: "Admin Teste",
      passwordHash,
      role: "TENANT_ADMIN",
      tenantId,
    },
  });

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId! } });
  console.log("Conta criada:");
  console.log(`  E-mail: ${user.email}`);
  console.log(`  Senha:  ${password}`);
  console.log(`  Tenant: ${tenant?.name}`);
  console.log(`  UserId: ${user.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
