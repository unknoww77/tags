import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@prisma/client";
import { getImpersonation, type ImpersonationPayload } from "@/lib/impersonation";

export type AppSessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** Tenant efetivo (próprio ou impersonado) */
  tenantId: string | null;
  /** Tenant real do usuário logado (sem impersonação) */
  realTenantId: string | null;
  impersonating: boolean;
  impersonation: ImpersonationPayload | null;
};

export type AppSession = {
  user: AppSessionUser;
};

export async function getAppSession(): Promise<AppSession | null> {
  const session = await auth();
  if (!session?.user) return null;

  const realTenantId = session.user.tenantId;
  let impersonation: ImpersonationPayload | null = null;

  if (session.user.role === "SUPER_ADMIN") {
    impersonation = await getImpersonation();
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      realTenantId,
      tenantId: impersonation?.tenantId ?? realTenantId,
      impersonating: Boolean(impersonation),
      impersonation,
    },
  };
}

export async function requireSession() {
  const session = await getAppSession();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(roles: Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireSuperAdmin() {
  return requireRole(["SUPER_ADMIN"]);
}

/** Super admin (com tenant próprio ou impersonando) ou tenant admin. */
export async function requireTenantAdmin() {
  const session = await requireSession();
  if (session.user.role === "SUPER_ADMIN") {
    return session;
  }
  if (session.user.role !== "TENANT_ADMIN" || !session.user.tenantId) {
    redirect("/login");
  }
  return session;
}

export async function requireTenantContext() {
  const session = await requireTenantAdmin();
  if (!session.user.tenantId) {
    redirect("/dashboard");
  }
  return session;
}

export function canManagePages(user: AppSessionUser): boolean {
  return Boolean(user.tenantId) && (user.role === "TENANT_ADMIN" || user.role === "SUPER_ADMIN");
}

/** Acesso a recurso de um tenant: super vê tudo (exceto se impersonando). */
export function canAccessTenant(user: AppSessionUser, tenantId: string): boolean {
  if (user.role === "SUPER_ADMIN") {
    if (user.impersonating) return user.tenantId === tenantId;
    return true;
  }
  return user.tenantId === tenantId;
}

/** Acesso a uma página pelo ID (links do /super, conflito de domínio). Super admin sempre pode. */
export function canAccessPage(user: AppSessionUser, pageTenantId: string): boolean {
  if (user.role === "SUPER_ADMIN") return true;
  return user.tenantId === pageTenantId;
}
