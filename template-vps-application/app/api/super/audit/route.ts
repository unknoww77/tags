import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getAppSession();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const take = Math.min(Number(url.searchParams.get("take") || 100), 300);

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });

  return NextResponse.json({ logs });
}
