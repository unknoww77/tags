import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/tracking";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const ip = await getClientIp();
  if (!rateLimit(`lead-open:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  }

  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead || !lead.whatsappEnabled) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  if (!lead.whatsappOpened) {
    await prisma.lead.update({
      where: { id },
      data: { whatsappOpened: true },
    });
  }

  return NextResponse.json({ ok: true });
}
