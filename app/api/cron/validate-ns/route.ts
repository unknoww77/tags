import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { validatePendingDomains } from "@/lib/domains";

export async function POST(request: Request) {
  const secret = env.cronSecret();
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const results = await validatePendingDomains();
  return NextResponse.json({
    checked: results.length,
    active: results.filter((d) => d.nsStatus === "active").length,
  });
}

export async function GET(request: Request) {
  return POST(request);
}
