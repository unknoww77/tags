import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAppSession } from "@/lib/auth-helpers";

/** Lista conversas para admin (tenant) ou super (todas). */
export async function GET(request: Request) {
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const tenantIdFilter = url.searchParams.get("tenantId");

  const where: {
    tenantId?: string;
    status?: "open" | "closed";
  } = {};

  if (session.user.role === "SUPER_ADMIN" && !session.user.impersonating) {
    if (tenantIdFilter) where.tenantId = tenantIdFilter;
  } else if (session.user.tenantId) {
    where.tenantId = session.user.tenantId;
  } else {
    return NextResponse.json({ conversations: [] });
  }

  if (status === "open" || status === "closed") {
    where.status = status;
  }

  const conversations = await prisma.chatConversation.findMany({
    where,
    include: {
      page: { select: { id: true, title: true, slug: true, brand: true } },
      tenant: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    conversations: conversations.map((c) => ({
      id: c.id,
      status: c.status,
      visitorName: c.visitorName,
      visitorPhone: c.visitorPhone,
      domain: c.domain,
      unreadByAgent: c.unreadByAgent,
      lastMessageAt: c.lastMessageAt,
      lastMessage: c.messages[0]
        ? {
            body: c.messages[0].body,
            sender: c.messages[0].sender,
            createdAt: c.messages[0].createdAt,
          }
        : null,
      page: c.page,
      tenant: c.tenant,
    })),
  });
}
