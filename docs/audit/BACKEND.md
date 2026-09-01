# Backend — Top1Tags

## Entrypoint e bootstrap

| Item | Detalhe |
|------|---------|
| Framework | Next.js 16 App Router (full-stack) |
| HTTP | `next start` via `server.js` (standalone output) |
| Container entry | `scripts/docker-entrypoint.js`: `prisma db push` → seed → `node server.js` |
| Auth bootstrap | `auth.ts` + `app/api/auth/[...nextauth]/route.ts` |

## Mapa de rotas API

### Públicas (sem sessão)

| Método | Endpoint | Handler | Função | Dependências |
|--------|----------|---------|--------|--------------|
| POST | `/api/register` | `app/api/register/route.ts` | Cadastro com convite | Prisma, bcrypt |
| POST | `/api/leads` | `app/api/leads/route.ts` | Salvar lead + roteamento WA | Prisma, page-config, settings, tracking |
| POST | `/api/leads/[id]/opened` | `app/api/leads/[id]/opened/route.ts` | Marca `whatsappOpened=true` | Prisma, rate limit |
| POST | `/api/t` | `app/api/t/route.ts` | Tracking genérico | Prisma, tracking |
| POST | `/api/chat/conversations` | `app/api/chat/conversations/route.ts` | Inicia chat visitante | Prisma, chat, tracking |
| GET | `/api/chat/conversations/[id]` | `app/api/chat/conversations/[id]/route.ts` | Lista mensagens (token) | Prisma |
| POST | `/api/chat/conversations/[id]` | idem | Mensagem visitante | Prisma, rate limit |
| POST | `/api/cron/validate-ns` | `app/api/cron/validate-ns/route.ts` | Valida NS pendentes | Bearer CRON_SECRET, domains |
| GET | `/api/cron/validate-ns` | idem | Alias POST | idem |

### Autenticadas (sessão JWT)

| Método | Endpoint | Auth | Handler | Função |
|--------|----------|------|---------|--------|
| GET/POST | `/api/auth/*` | NextAuth | Auth.js handlers | Login/logout/session |
| GET | `/api/pages` | Tenant | `pages/route.ts` | Lista páginas do tenant |
| POST | `/api/pages` | Tenant + canManage | idem | Cria página |
| GET/PATCH/DELETE | `/api/pages/[id]` | Tenant/super | `pages/[id]/route.ts` | CRUD página |
| POST | `/api/pages/[id]/domain` | Tenant | `domain/route.ts` | Conecta domínio CF |
| GET | `/api/pages/[id]/analytics` | Tenant | `analytics/route.ts` | Analytics 30d |
| GET | `/api/pages/[id]/leads` | Tenant | `leads/route.ts` | Lista leads |
| GET | `/api/pages/[id]/leads/export` | Tenant | `export/route.ts` | CSV leads |
| PATCH | `/api/leads/[id]` | Tenant | `leads/[id]/route.ts` | Status do lead |
| GET | `/api/chat/inbox` | Tenant/super | `chat/inbox/route.ts` | Lista conversas |
| GET/POST/PATCH | `/api/chat/inbox/[id]` | Tenant | `inbox/[id]/route.ts` | Detalhe/resposta/fechar chat |
| POST/DELETE | `/api/impersonate` | SUPER_ADMIN | `impersonate/route.ts` | Impersonação |
| POST | `/api/domains/[id]/validate` | Tenant | `domains/validate/route.ts` | Valida NS manual |

### Super Admin apenas

| Método | Endpoint | Handler |
|--------|----------|---------|
| GET/POST | `/api/invites` | `invites/route.ts` |
| DELETE | `/api/invites/[id]` | `invites/[id]/route.ts` |
| GET/PATCH | `/api/super/settings` | `super/settings/route.ts` |
| GET | `/api/super/stats` | `super/stats/route.ts` |
| GET | `/api/super/audit` | `super/audit/route.ts` |
| GET/PATCH | `/api/super/tenants/[tenantId]/settings` | `super/tenants/.../settings/route.ts` |

## Fluxo típico (lead)

```
POST /api/leads
  → rateLimit(ip)
  → prisma.page.findUnique
  → getEffectiveSettings (tenant disabled?)
  → parsePageConfig + pickWhatsAppNumber (se WA)
  → prisma.lead.create
  → prisma.trackEvent.create
  → notifyTelegramLead (async)
  → JSON { ok, leadId, whatsappUrl? }
```

## Middleware global

`middleware.ts`: rewrite preview `{slug}.platform` → `/site/[slug]`; custom host → `/site/by-host/[hostname]`. Não protege rotas `/dashboard` (proteção via server components + `requireSession`).

## Jobs / cron

- Container `cron` em produção: loop `curl POST /api/cron/validate-ns` cada 600s.
- Sem fila, sem worker separado, sem Redis.

## Tratamento de erros

- Padrão: try/catch + `NextResponse.json({ error })` + `console.error` em rotas críticas.
- Sem logger estruturado, sem Sentry, sem correlação de request ID.

## Rate limiting

`lib/tracking.ts` — `Map` em memória do processo. **Não compartilhado entre instâncias/restarts.**
