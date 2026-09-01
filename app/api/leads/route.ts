import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getEffectiveSettings, notifyTelegramLead } from "@/lib/settings";
import { detectDevice, getClientIp, hashIp, pickUtms, rateLimit } from "@/lib/tracking";
import {
  buildWhatsAppUrl,
  parsePageConfig,
  pickWhatsAppNumber,
} from "@/lib/page-config";

const schema = z.object({
  pageId: z.string().min(1),
  domain: z.string().max(253).optional(),
  form: z.record(z.string(), z.string()).default({}),
  quiz: z.record(z.string(), z.string()).default({}),
  whatsappEnabled: z.boolean().default(false),
  whatsappOpened: z.boolean().default(false),
  mode: z.enum(["contact", "whatsapp", "chat"]).optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const ip = await getClientIp();
    if (!rateLimit(`lead:${ip}`, 30, 60_000)) {
      return NextResponse.json({ error: "Rate limit" }, { status: 429 });
    }

    const body = schema.parse(await request.json());
    const page = await prisma.page.findUnique({ where: { id: body.pageId } });
    if (!page || page.status === "archived") {
      return NextResponse.json({ error: "Página inválida" }, { status: 404 });
    }

    const settings = await getEffectiveSettings(page.tenantId);
    if (settings.disabled) {
      return NextResponse.json({ error: "Conta desativada" }, { status: 403 });
    }

    const ua = request.headers.get("user-agent");
    const utms = pickUtms(body);
    const form = body.form ?? {};
    const pageConfig = parsePageConfig(page.configJson);

    let whatsappNumberUsed: string | null = null;
    let whatsappUrl: string | undefined;

    if (body.whatsappEnabled && pageConfig.sendToWhatsapp) {
      const priorLeads = await prisma.lead.findMany({
        where: {
          pageId: page.id,
          whatsappEnabled: true,
          whatsappNumberUsed: { not: null },
        },
        select: { whatsappNumberUsed: true },
      });

      const countsByNumber: Record<string, number> = {};
      for (const row of priorLeads) {
        if (row.whatsappNumberUsed) {
          countsByNumber[row.whatsappNumberUsed] =
            (countsByNumber[row.whatsappNumberUsed] ?? 0) + 1;
        }
      }

      whatsappNumberUsed = pickWhatsAppNumber(pageConfig.whatsappNumbers, countsByNumber);

      if (whatsappNumberUsed) {
        const extras: Record<string, string> = { ...form, ...(body.quiz ?? {}) };
        whatsappUrl = buildWhatsAppUrl(
          whatsappNumberUsed,
          pageConfig.whatsappMessage,
          extras
        );
      }
    }

    const lead = await prisma.lead.create({
      data: {
        pageId: page.id,
        domain: (body.domain || "unknown").toLowerCase().slice(0, 253),
        name: form.name?.slice(0, 120) || null,
        phone: form.phone?.slice(0, 40) || null,
        email: form.email?.slice(0, 120) || null,
        city: form.city?.slice(0, 80) || null,
        formJson: form,
        quizJson: body.quiz ?? {},
        mode:
          body.mode ||
          (body.whatsappEnabled ? "whatsapp" : "contact"),
        whatsappEnabled: body.whatsappEnabled || body.mode === "chat",
        whatsappOpened:
          body.whatsappEnabled || body.mode === "chat"
            ? body.whatsappOpened
            : false,
        whatsappNumberUsed,
        status: "colhido",
        utmSource: utms.utmSource,
        utmMedium: utms.utmMedium,
        utmCampaign: utms.utmCampaign,
        device: detectDevice(ua),
        ipHash: hashIp(ip),
      },
    });

    await prisma.trackEvent.create({
      data: {
        pageId: page.id,
        domain: lead.domain,
        path: "/",
        eventType: "lead",
        utmSource: utms.utmSource,
        utmMedium: utms.utmMedium,
        utmCampaign: utms.utmCampaign,
        utmContent: utms.utmContent,
        utmTerm: utms.utmTerm,
        device: detectDevice(ua),
        ipHash: hashIp(ip),
        metaJson: {
          leadId: lead.id,
          mode: lead.mode,
          whatsappOpened: lead.whatsappOpened,
          whatsappNumberUsed: lead.whatsappNumberUsed,
        },
      },
    });

    void notifyTelegramLead({
      tenantId: page.tenantId,
      pageTitle: page.title,
      leadName: lead.name,
      leadPhone: lead.phone,
      mode: lead.mode,
      whatsappOpened: lead.whatsappOpened,
      whatsappNumberUsed: lead.whatsappNumberUsed,
    });

    return NextResponse.json({
      ok: true,
      leadId: lead.id,
      whatsappUrl,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
