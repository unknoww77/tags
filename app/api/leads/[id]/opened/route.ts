import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyLeadOpenedToken } from "@/lib/lead-opened-token";
import { getClientIp, rateLimit } from "@/lib/tracking";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  token: z.string().min(16).max(512),
});

export async function POST(request: Request, { params }: Params) {
  const ip = await getClientIp();
  if (!rateLimit(`lead-open:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  }

  const { id } = await params;

  let token: string;
  try {
    const body = bodySchema.parse(await request.json());
    token = body.token;
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  if (!verifyLeadOpenedToken(id, token)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead || !lead.whatsappEnabled) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  if (!lead.whatsappOpened) {
    await prisma.lead.update({
      where: { id },
      data: { whatsappOpened: true },
    });
  }

  return NextResponse.json({ ok: true });
}
