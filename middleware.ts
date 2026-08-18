import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPreviewSlug, isPlatformHost } from "@/lib/env";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Preview: {slug}.top1tags.dev
  const previewSlug = getPreviewSlug(host);
  if (previewSlug) {
    const url = request.nextUrl.clone();
    url.pathname = `/site/${previewSlug}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Custom domain (not platform)
  if (!isPlatformHost(host)) {
    const hostname = host.toLowerCase().split(":")[0];
    const url = request.nextUrl.clone();
    url.pathname = `/site/by-host/${encodeURIComponent(hostname)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
