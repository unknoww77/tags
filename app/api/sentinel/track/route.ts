import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { detectDevice, getClientIp, rateLimit } from "@/lib/tracking";
import { parsePageConfig } from "@/lib/page-config";

const schema = z.object({
  pageId: z.string().min(1),
  domain: z.string().min(1),
  eventType: z.enum(["pageview", "init_checkout", "add_to_cart", "purchase"]),
  label: z.string().min(1).max(120),
  pageUrl: z.string().url().max(1000).optional(),
  referrer: z.string().max(1000).optional(),
  clickIdParam: z.string().max(80).optional(),
  clickId: z.string().max(300).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const ip = await getClientIp();
    if (!rateLimit(`sentinel:${ip}`, 120, 60_000)) {
      return NextResponse.json({ error: "Rate limit" }, { status: 429 });
    }

    const body = schema.parse(await request.json());
    const page = await prisma.page.findUnique({ where: { id: body.pageId } });
    if (!page || page.status === "archived") {
      return NextResponse.json({ error: "Página inválida" }, { status: 404 });
    }

    const config = parsePageConfig(page.configJson).sentinel;
    if (!config?.enabled || !config.apiKey) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const endpoint = config.endpoint;
    if (!endpoint) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const ua = request.headers.get("user-agent") || "";
    const payload = {
      PublicKey: config.apiKey,
      EventType: body.eventType,
      EventLabel: body.label,
      PageURL: body.pageUrl,
      Referrer: body.referrer || "",
      UserAgent: ua,
      DeviceType: detectDevice(ua),
      FiredAt: new Date().toISOString(),
      ClickID: body.clickId,
      click_id: body.clickId,
      metadata: {
        pageId: page.id,
        pageSlug: page.slug,
        domain: body.domain,
        clickIdParam: body.clickIdParam || config.clickIdParam,
        ...(body.metadata ?? {}),
      },
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": config.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Sentinel track error", res.status, text);
      return NextResponse.json({ error: "Falha ao enviar ao Sentinel" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
