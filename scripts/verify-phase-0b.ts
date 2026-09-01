/**
 * Verificação FASE 0B — token opened + status de página (sem produção).
 *
 * Uso: npx tsx scripts/verify-phase-0b.ts
 * Opcional: BOOTSTRAP_TEST_DATABASE_URL para testes de idempotência no DB.
 */

import { createHmac } from "node:crypto";
import {
  createLeadOpenedToken,
  verifyLeadOpenedToken,
  isPageAcceptingPublicLeads,
} from "../lib/lead-opened-token";

const TEST_SECRET = "phase-0b-test-secret-min-12-chars";
process.env.AUTH_SECRET = TEST_SECRET;
process.env.NEXTAUTH_SECRET = TEST_SECRET;

function assert(name: string, condition: boolean) {
  if (!condition) throw new Error(`FAIL: ${name}`);
  console.log(`OK ${name}`);
}

function buildTokenManual(
  leadId: string,
  issuedAt: number,
  expiresAt: number,
  secret: string = TEST_SECRET,
): string {
  const material = `v1|lead-opened|${leadId}|${issuedAt}|${expiresAt}`;
  const sig = createHmac("sha256", secret).update(material).digest("base64url");
  const wire = `${leadId}|${issuedAt}|${expiresAt}|${sig}`;
  return Buffer.from(wire, "utf8").toString("base64url");
}

function testTokens() {
  const leadA = "cltest_lead_a_0001";
  const leadB = "cltest_lead_b_0002";

  const valid = createLeadOpenedToken(leadA);
  assert("token válido aceito", verifyLeadOpenedToken(leadA, valid));

  const tampered = valid.slice(0, -4) + "XXXX";
  assert("token alterado rejeitado", !verifyLeadOpenedToken(leadA, tampered));

  assert(
    "token de A não vale em B",
    !verifyLeadOpenedToken(leadB, valid),
  );

  const expired = buildTokenManual(leadA, Date.now() - 600_000, Date.now() - 60_000);
  assert("token expirado rejeitado", !verifyLeadOpenedToken(leadA, expired));

  const validWire = Buffer.from(valid, "base64url").toString("utf8");
  const wireParts = validWire.split("|");
  wireParts[2] = String(Number(wireParts[2]) + 999_999_999);
  const forged = Buffer.from(wireParts.join("|"), "utf8").toString("base64url");
  assert("payload adulterado rejeitado", !verifyLeadOpenedToken(leadA, forged));

  assert(
    "fabricar só com leadId não basta",
    !verifyLeadOpenedToken(leadA, Buffer.from(leadA).toString("base64url")),
  );
}

function testPageStatus() {
  assert("published aceito", isPageAcceptingPublicLeads("published"));
  assert("draft bloqueado", !isPageAcceptingPublicLeads("draft"));
  assert("archived bloqueado", !isPageAcceptingPublicLeads("archived"));
  assert("status inesperado bloqueado", !isPageAcceptingPublicLeads("unknown"));
}

async function ensureDatabase(url: string) {
  const adminUrl = url.replace(/\/([^/?]+)(\?.*)?$/, "/postgres$2");
  const dbName = url.match(/\/([^/?]+)(\?|$)/)?.[1];
  if (!dbName) return;

  const { PrismaClient } = await import("@prisma/client");
  const admin = new PrismaClient({ datasources: { db: { url: adminUrl } } });
  try {
    const rows = await admin.$queryRawUnsafe(
      `SELECT 1 AS ok FROM pg_database WHERE datname = '${dbName.replace(/'/g, "''")}'`,
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      await admin.$executeRawUnsafe(`CREATE DATABASE "${dbName.replace(/"/g, "")}"`);
    }
  } finally {
    await admin.$disconnect();
  }

  const { spawnSync } = await import("node:child_process");
  spawnSync("npx", ["prisma", "db", "push", "--skip-generate"], {
    env: { ...process.env, DATABASE_URL: url },
    cwd: process.cwd(),
    stdio: "pipe",
  });
}

async function testOpenedIdempotencyDb() {
  const url = process.env.BOOTSTRAP_TEST_DATABASE_URL;
  if (!url) {
    console.log("SKIP opened DB tests (set BOOTSTRAP_TEST_DATABASE_URL)");
    return;
  }

  await ensureDatabase(url);

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasources: { db: { url } } });

  try {
    const tenant = await prisma.tenant.create({ data: { name: "Phase0B Test" } });
    const page = await prisma.page.create({
      data: {
        tenantId: tenant.id,
        slug: `phase-0b-${Date.now()}`,
        title: "Test",
        brand: "conectcar",
        status: "published",
        ctaUrl: "https://example.com",
        configJson: {},
      },
    });

    const lead = await prisma.lead.create({
      data: {
        pageId: page.id,
        domain: "test.local",
        whatsappEnabled: true,
        whatsappOpened: false,
        mode: "whatsapp",
        formJson: {},
        quizJson: {},
      },
    });

    const token = createLeadOpenedToken(lead.id);
    assert("token válido antes do update", verifyLeadOpenedToken(lead.id, token));

    if (!verifyLeadOpenedToken(lead.id, token)) throw new Error("pre-check");

    await prisma.lead.update({ where: { id: lead.id }, data: { whatsappOpened: true } });
    const after = await prisma.lead.findUnique({ where: { id: lead.id } });
    assert("whatsappOpened true após update", after?.whatsappOpened === true);

    await prisma.lead.update({ where: { id: lead.id }, data: { whatsappOpened: true } });
    const again = await prisma.lead.findUnique({ where: { id: lead.id } });
    assert("segunda update idempotente", again?.whatsappOpened === true);

    const bad = createLeadOpenedToken(lead.id);
    assert("token inválido não altera", !verifyLeadOpenedToken("other_id", bad));

    await prisma.lead.delete({ where: { id: lead.id } });
    await prisma.page.delete({ where: { id: page.id } });
    await prisma.tenant.delete({ where: { id: tenant.id } });
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log("[verify-phase-0b] tokens…");
  testTokens();
  console.log("[verify-phase-0b] page status…");
  testPageStatus();
  console.log("[verify-phase-0b] opened idempotency (optional DB)…");
  await testOpenedIdempotencyDb();
  console.log("[verify-phase-0b] ALL PASSED");
}

main().catch((e) => {
  console.error("[verify-phase-0b] FAILED:", e.message ?? e);
  process.exit(1);
});
