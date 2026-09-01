import { prisma } from "@/lib/prisma";

export type EffectiveSettings = {
  maxPagesPerTenant: number;
  leadRetentionDays: number;
  defaultSslMode: string;
  showPartnerDisclaimer: boolean;
  notifyTelegramOnLead: boolean;
  telegramBotToken: string | null;
  telegramChatId: string | null;
  allowTenantCustomWa: boolean;
  inviteDaysValid: number;
  disabled: boolean;
  notes: string | null;
};

export const DEFAULT_GLOBAL = {
  id: "global" as const,
  maxPagesPerTenant: 20,
  leadRetentionDays: 180,
  defaultSslMode: "flexible",
  showPartnerDisclaimer: true,
  notifyTelegramOnLead: false,
  telegramBotToken: null as string | null,
  telegramChatId: null as string | null,
  allowTenantCustomWa: true,
  inviteDaysValid: 7,
  notes: null as string | null,
};

export async function ensureGlobalSettings() {
  return prisma.globalSettings.upsert({
    where: { id: "global" },
    update: {},
    create: { ...DEFAULT_GLOBAL },
  });
}

export async function getGlobalSettings() {
  return ensureGlobalSettings();
}

export async function getEffectiveSettings(tenantId?: string | null): Promise<EffectiveSettings> {
  const global = await ensureGlobalSettings();
  if (!tenantId) {
    return {
      maxPagesPerTenant: global.maxPagesPerTenant,
      leadRetentionDays: global.leadRetentionDays,
      defaultSslMode: global.defaultSslMode,
      showPartnerDisclaimer: global.showPartnerDisclaimer,
      notifyTelegramOnLead: global.notifyTelegramOnLead,
      telegramBotToken: global.telegramBotToken,
      telegramChatId: global.telegramChatId,
      allowTenantCustomWa: global.allowTenantCustomWa,
      inviteDaysValid: global.inviteDaysValid,
      disabled: false,
      notes: global.notes,
    };
  }

  const tenant = await prisma.tenantSettings.findUnique({ where: { tenantId } });
  return {
    maxPagesPerTenant: tenant?.maxPages ?? global.maxPagesPerTenant,
    leadRetentionDays: tenant?.leadRetentionDays ?? global.leadRetentionDays,
    defaultSslMode: global.defaultSslMode,
    showPartnerDisclaimer: global.showPartnerDisclaimer,
    notifyTelegramOnLead: tenant?.notifyTelegramOnLead ?? global.notifyTelegramOnLead,
    telegramBotToken: global.telegramBotToken,
    telegramChatId: tenant?.telegramChatId ?? global.telegramChatId,
    allowTenantCustomWa: global.allowTenantCustomWa,
    inviteDaysValid: global.inviteDaysValid,
    disabled: tenant?.disabled ?? false,
    notes: tenant?.notes ?? global.notes,
  };
}

export async function writeAudit(input: {
  actorId: string;
  actorEmail?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metaJson?: object;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      actorEmail: input.actorEmail ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metaJson: input.metaJson,
    },
  });
}

export async function notifyTelegramLead(opts: {
  tenantId: string;
  pageTitle: string;
  leadName?: string | null;
  leadPhone?: string | null;
  mode: string;
  whatsappOpened: boolean;
  whatsappNumberUsed?: string | null;
}) {
  const settings = await getEffectiveSettings(opts.tenantId);
  if (!settings.notifyTelegramOnLead || !settings.telegramBotToken || !settings.telegramChatId) {
    return;
  }

  const waNumberLine =
    opts.whatsappNumberUsed
      ? `Número WA: ${opts.whatsappNumberUsed}`
      : null;

  const text = [
    "🆕 Novo lead Top1Tags",
    `Página: ${opts.pageTitle}`,
    `Nome: ${opts.leadName || "—"}`,
    `Telefone: ${opts.leadPhone || "—"}`,
    `Modo: ${opts.mode}`,
    `WhatsApp: ${opts.whatsappOpened ? "abriu" : opts.mode === "whatsapp" ? "não abriu" : "n/a"}`,
    waNumberLine,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: settings.telegramChatId,
        text,
      }),
    });
  } catch (error) {
    console.error("telegram notify failed", error);
  }
}
