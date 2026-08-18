import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { detectDevice, getClientIp, hashIp, pickUtms, rateLimit } from "@/lib/tracking";

const schema = z.object({
  pageId: z.string().min(1),
  eventType: z.enum(["view", "cta_click", "lead", "chat_start"]),
  path: z.string().max(500).optional(),
  domain: z.string().max(253).optional(),
  referrer: z.string().max(1000).optional().nullable(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const ip = await getClientIp();
    if (!rateLimit(`t:${ip}`, 120, 60_000)) {
      return NextResponse.json({ error: "Rate limit" }, { status: 429 });
    }

    const body = schema.parse(await request.json());
    const page = await prisma.page.findUnique({ where: { id: body.pageId } });
    if (!page || page.status === "archived") {
      return NextResponse.json({ error: "Página inválida" }, { status: 404 });
    }

    const ua = request.headers.get("user-agent");
    const utms = pickUtms(body);

    await prisma.trackEvent.create({
      data: {
        pageId: page.id,
        domain: (body.domain || "unknown").toLowerCase().slice(0, 253),
        path: body.path || "/",
        eventType: body.eventType,
        utmSource: utms.utmSource,
        utmMedium: utms.utmMedium,
        utmCampaign: utms.utmCampaign,
        utmContent: utms.utmContent,
        utmTerm: utms.utmTerm,
        referrer: body.referrer || null,
        device: detectDevice(ua),
        ipHash: hashIp(ip),
        metaJson: (body.meta as object | undefined) ?? undefined,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
