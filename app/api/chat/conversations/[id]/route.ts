import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/tracking";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const token = new URL(request.url).searchParams.get("token") || "";
    if (!token) {
      return NextResponse.json({ error: "Token obrigatório" }, { status: 401 });
    }

    const conversation = await prisma.chatConversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 200 },
      },
    });

    if (!conversation || conversation.visitorToken !== token) {
      return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
    }

    if (conversation.unreadByVisitor > 0) {
      await prisma.chatConversation.update({
        where: { id },
        data: { unreadByVisitor: 0 },
      });
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        status: conversation.status,
        visitorName: conversation.visitorName,
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
    console.error(e);
    return NextResponse.json({ error: "Falha ao carregar chat" }, { status: 500 });
  }
}

const messageSchema = z.object({
  token: z.string().min(10),
  body: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request, ctx: Ctx) {
  try {
    const ip = await getClientIp();
    if (!rateLimit(`chat-msg:${ip}`, 60, 60_000)) {
      return NextResponse.json({ error: "Rate limit" }, { status: 429 });
    }

    const { id } = await ctx.params;
    const body = messageSchema.parse(await request.json());

    const conversation = await prisma.chatConversation.findUnique({ where: { id } });
    if (!conversation || conversation.visitorToken !== body.token) {
      return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
    }
    if (conversation.status === "closed") {
      return NextResponse.json({ error: "Conversa encerrada" }, { status: 400 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        conversationId: id,
        sender: "visitor",
        body: body.body.slice(0, 2000),
      },
    });

    await prisma.chatConversation.update({
      where: { id },
      data: {
        lastMessageAt: new Date(),
        unreadByAgent: { increment: 1 },
      },
    });

    return NextResponse.json({
      message: {
        id: message.id,
        sender: message.sender,
        body: message.body,
        agentName: message.agentName,
        createdAt: message.createdAt,
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Mensagem inválida" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Falha ao enviar" }, { status: 500 });
  }
}
