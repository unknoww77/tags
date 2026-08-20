import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createVisitorToken } from "@/lib/chat";
import { detectDevice, getClientIp, hashIp, rateLimit } from "@/lib/tracking";
import { getEffectiveSettings } from "@/lib/settings";

const startSchema = z.object({
  pageId: z.string().min(1),
  domain: z.string().max(253).optional(),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(40),
});

export async function POST(request: Request) {
  try {
    const ip = await getClientIp();
    if (!rateLimit(`chat-start:${ip}`, 20, 60_000)) {
      return NextResponse.json({ error: "Rate limit" }, { status: 429 });
    }

    const body = startSchema.parse(await request.json());
    const phone = body.phone.replace(/\D/g, "");
    if (phone.length < 8) {
      return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });
    }

    const page = await prisma.page.findUnique({ where: { id: body.pageId } });
    if (!page || page.status === "archived") {
      return NextResponse.json({ error: "Página inválida" }, { status: 404 });
    }

    const settings = await getEffectiveSettings(page.tenantId);
    if (settings.disabled) {
      return NextResponse.json({ error: "Conta desativada" }, { status: 403 });
    }

    const domain = (body.domain || "unknown").toLowerCase().slice(0, 253);
    const ua = request.headers.get("user-agent");
    const visitorToken = createVisitorToken();

    const lead = await prisma.lead.create({
      data: {
        pageId: page.id,
        domain,
        name: body.name.slice(0, 120),
        phone: phone.slice(0, 40),
        formJson: { name: body.name, phone },
        quizJson: {},
        mode: "chat",
        whatsappEnabled: false,
        whatsappOpened: false,
        status: "colhido",
        device: detectDevice(ua),
        ipHash: hashIp(ip),
      },
    });

    const conversation = await prisma.chatConversation.create({
      data: {
        pageId: page.id,
        tenantId: page.tenantId,
        domain,
        visitorName: body.name.slice(0, 120),
        visitorPhone: phone.slice(0, 40),
        visitorToken,
        leadId: lead.id,
        unreadByAgent: 1,
        messages: {
          create: {
            sender: "visitor",
            body: `Olá! Sou ${body.name}. Quero atendimento.`,
          },
        },
      },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        visitorToken: conversation.visitorToken,
        visitorName: conversation.visitorName,
        visitorPhone: conversation.visitorPhone,
        status: conversation.status,
        messages: conversation.messages.map((m) => ({
          id: m.id,
          sender: m.sender,
          body: m.body,
          agentName: m.agentName,
          createdAt: m.createdAt,
        })),
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: e.flatten() }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Falha ao iniciar chat" }, { status: 500 });
  }
}
