import Link from "next/link";
import { signOut } from "@/auth";
import { getAppSession } from "@/lib/auth-helpers";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";

export async function PlatformHeader() {
  const session = await getAppSession();

  return (
    <>
      {session?.user.impersonating && session.user.impersonation && (
        <ImpersonationBanner
          userName={session.user.impersonation.userName}
          tenantName={session.user.impersonation.tenantName}
        />
      )}
      <header className="platform-header">
        <Link href={session ? "/dashboard" : "/"} className="brand">
          Top1Tags
        </Link>
        <nav>
          {session?.user ? (
            <>
              <span className="user-chip">
                {session.user.impersonating
                  ? `Super → ${session.user.impersonation?.userName}`
                  : `${session.user.name} · ${session.user.role === "SUPER_ADMIN" ? "Super" : "Admin"}`}
              </span>
              {session.user.role === "SUPER_ADMIN" && !session.user.impersonating && (
                <Link href="/super">Super Admin</Link>
              )}
              {session.user.role === "SUPER_ADMIN" && session.user.impersonating && (
                <Link href="/super">Painel Super</Link>
              )}
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/dashboard/chat">Chat</Link>
              {session.user.role === "SUPER_ADMIN" && !session.user.impersonating && (
                <Link href="/super/chat">Chat Global</Link>
              )}
              <form
                action={async () => {
                  "use server";
                  const { clearImpersonationCookie } = await import("@/lib/impersonation");
                  await clearImpersonationCookie();
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button type="submit" className="linkish">
                  Sair
                </button>
              </form>
            </>
          ) : (
            <Link href="/login">Entrar</Link>
          )}
        </nav>
      </header>
    </>
  );
}
