import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAppSession, canAccessTenant } from "@/lib/auth-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const conversation = await prisma.chatConversation.findUnique({
    where: { id },
    include: {
      page: { select: { id: true, title: true, slug: true, brand: true } },
      tenant: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 300 },
    },
  });

  if (!conversation || !canAccessTenant(session.user, conversation.tenantId)) {
    return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
  }

  if (conversation.unreadByAgent > 0) {
    await prisma.chatConversation.update({
      where: { id },
      data: { unreadByAgent: 0 },
    });
  }

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      status: conversation.status,
      visitorName: conversation.visitorName,
      visitorPhone: conversation.visitorPhone,
      domain: conversation.domain,
      lastMessageAt: conversation.lastMessageAt,
      page: conversation.page,
      tenant: conversation.tenant,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        body: m.body,
        agentName: m.agentName,
        createdAt: m.createdAt,
      })),
    },
  });
}

const replySchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request, ctx: Ctx) {
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;
    const body = replySchema.parse(await request.json());

    const conversation = await prisma.chatConversation.findUnique({ where: { id } });
    if (!conversation || !canAccessTenant(session.user, conversation.tenantId)) {
      return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
    }
    if (conversation.status === "closed") {
      return NextResponse.json({ error: "Conversa encerrada" }, { status: 400 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        conversationId: id,
        sender: "agent",
        body: body.body.slice(0, 2000),
        agentUserId: session.user.id,
        agentName: session.user.name,
      },
    });

    await prisma.chatConversation.update({
      where: { id },
      data: {
        lastMessageAt: new Date(),
        unreadByVisitor: { increment: 1 },
        unreadByAgent: 0,
      },
    });

    if (conversation.leadId) {
      await prisma.lead.updateMany({
        where: { id: conversation.leadId, status: "new" },
        data: { status: "contacted" },
      });
    }

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
    return NextResponse.json({ error: "Falha ao responder" }, { status: 500 });
  }
}

const patchSchema = z.object({
  status: z.enum(["open", "closed"]),
});

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;
    const body = patchSchema.parse(await request.json());

    const conversation = await prisma.chatConversation.findUnique({ where: { id } });
    if (!conversation || !canAccessTenant(session.user, conversation.tenantId)) {
      return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
    }

    const updated = await prisma.chatConversation.update({
      where: { id },
      data: { status: body.status },
    });

    return NextResponse.json({ conversation: { id: updated.id, status: updated.status } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Falha ao atualizar" }, { status: 500 });
  }
}
