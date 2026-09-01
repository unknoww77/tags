#!/usr/bin/env node
/**
 * Verifica idempotência do bootstrap (seed) sem usar banco de produção.
 *
 * Uso:
 *   BOOTSTRAP_TEST_DATABASE_URL='postgresql://top1tags:top1tags@127.0.0.1:5433/top1tags_bootstrap_test?schema=public' \
 *     node scripts/verify-bootstrap-idempotent.mjs
 *
 * Requer Postgres acessível (ex.: docker-compose.dev postgres em 5433).
 * Cria o database de teste se não existir, roda db push + seed 3x e valida passwordHash/settings.
 */

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_TEST_URL =
  "postgresql://top1tags:top1tags@127.0.0.1:5433/top1tags_bootstrap_test?schema=public";

function run(cmd, args, env) {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    throw new Error(`${cmd} ${args.join(" ")} failed (status ${r.status})`);
  }
  return r.stdout?.trim() ?? "";
}

function parseDbName(url) {
  const m = url.match(/\/([^/?]+)(\?|$)/);
  return m?.[1] ?? null;
}

async function ensureTestDatabase(testUrl) {
  const adminUrl = testUrl.replace(/\/([^/?]+)(\?.*)?$/, "/postgres$2");
  const dbName = parseDbName(testUrl);
  if (!dbName) throw new Error("Could not parse database name from BOOTSTRAP_TEST_DATABASE_URL");

  const admin = new PrismaClient({ datasources: { db: { url: adminUrl } } });
  try {
    const rows = await admin.$queryRawUnsafe(
      `SELECT 1 AS ok FROM pg_database WHERE datname = '${dbName.replace(/'/g, "''")}'`,
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      await admin.$executeRawUnsafe(`CREATE DATABASE "${dbName.replace(/"/g, "")}"`);
      console.log(`[verify] created database ${dbName}`);
    }
  } finally {
    await admin.$disconnect();
  }
}

async function readState(testUrl) {
  const prisma = new PrismaClient({ datasources: { db: { url: testUrl } } });
  try {
    const user = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
      select: { id: true, passwordHash: true },
    });
    const settings = await prisma.globalSettings.findUnique({
      where: { id: "global" },
      select: { maxPagesPerTenant: true, notifyTelegramOnLead: true },
    });
    return { user, settings };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const testUrl = process.env.BOOTSTRAP_TEST_DATABASE_URL ?? DEFAULT_TEST_URL;
  const seedEnvBase = {
    DATABASE_URL: testUrl,
    NODE_ENV: "development",
    SUPER_ADMIN_USERNAME: "bootstrap_test_admin",
    SUPER_ADMIN_EMAIL: "bootstrap-test@top1tags.dev",
    SUPER_ADMIN_NAME: "Bootstrap Test",
    SUPER_ADMIN_PASSWORD: "BootstrapTestPwd1!",
  };

  console.log("[verify] ensuring isolated test database…");
  await ensureTestDatabase(testUrl);

  console.log("[verify] prisma db push (test db)…");
  run("npx", ["prisma", "db", "push", "--skip-generate"], { DATABASE_URL: testUrl });

  console.log("[verify] seed run #1 (create)…");
  run("npx", ["tsx", "prisma/seed.ts"], seedEnvBase);

  const afterFirst = await readState(testUrl);
  if (!afterFirst.user?.passwordHash) {
    throw new Error("Run 1: SUPER_ADMIN was not created");
  }
  const hash1 = afterFirst.user.passwordHash;

  console.log("[verify] seed run #2 (must preserve passwordHash)…");
  run("npx", ["tsx", "prisma/seed.ts"], seedEnvBase);

  const afterSecond = await readState(testUrl);
  if (afterSecond.user?.passwordHash !== hash1) {
    throw new Error("Run 2: passwordHash changed — seed is not idempotent");
  }

  console.log("[verify] altering globalSettings in DB…");
  const prisma = new PrismaClient({ datasources: { db: { url: testUrl } } });
  await prisma.globalSettings.update({
    where: { id: "global" },
    data: { maxPagesPerTenant: 42, notifyTelegramOnLead: true },
  });
  await prisma.$disconnect();

  console.log("[verify] seed run #3 (different SUPER_ADMIN_PASSWORD env)…");
  run("npx", ["tsx", "prisma/seed.ts"], {
    ...seedEnvBase,
    SUPER_ADMIN_PASSWORD: "TotallyDifferentPwd9!",
  });

  const afterThird = await readState(testUrl);
  if (afterThird.user?.passwordHash !== hash1) {
    throw new Error("Run 3: passwordHash changed after env password change");
  }
  if (afterThird.settings?.maxPagesPerTenant !== 42) {
    throw new Error("Run 3: globalSettings.maxPagesPerTenant was reset by seed");
  }
  if (!afterThird.settings?.notifyTelegramOnLead) {
    throw new Error("Run 3: globalSettings.notifyTelegramOnLead was reset by seed");
  }

  console.log("[verify] OK — bootstrap seed is idempotent for credentials and settings.");
}

main().catch((err) => {
  console.error("[verify] FAILED:", err.message ?? err);
  console.error(
    "\nTip: start dev Postgres (docker compose -f docker-compose.dev.yaml up postgres -d) or set BOOTSTRAP_TEST_DATABASE_URL.",
  );
  process.exit(1);
});
