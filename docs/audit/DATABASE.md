# Banco de dados — Top1Tags

## SGBD e ORM

- **PostgreSQL 16** (Docker `postgres:16-alpine`)
- **Prisma 5.22.0** — sem pasta `prisma/migrations/`; deploy usa `prisma db push` no entrypoint
- Conexão: `DATABASE_URL` (env)

## Modelos

### User
- PK: `id` (cuid)
- Campos: `username` (unique), `email` (unique optional), `name`, `passwordHash`, `role` (SUPER_ADMIN | TENANT_ADMIN), `tenantId`
- Rel: Tenant, Account[], Session[], ChatMessage[]
- Uso: autenticação, agentes de chat

### Tenant
- PK: `id`
- Rel: users, pages, invites, settings, chatConversations
- Uso: isolamento multi-tenant

### Invite
- PK: `id`, `token` (unique)
- Campos: email?, tenantName?, expiresAt, usedAt?, revokedAt?, createdBy
- Uso: onboarding invite-only

### Page
- PK: `id`, `slug` (unique)
- Campos: brand (conectcar|veloe), templateId, title, headline?, description?, ctaLabel, ctaUrl, affiliateCode?, status, configJson (JSON)
- Rel: domains, events, leads, chatConversations
- Índices: tenantId, brand, status

### Domain
- PK: `id`, `hostname` (unique)
- Campos: cloudflareZoneId?, nameservers[], sslMode, nsStatus, lastCheckedAt?, lastError?
- Rel: Page
- Uso: custom domains via Cloudflare

### TrackEvent
- PK: `id`
- Campos: pageId, domain, path, eventType (view|cta_click|lead|chat_start), UTMs, referrer?, device?, ipHash?, metaJson?
- Índices: pageId+createdAt, domain+createdAt, eventType+createdAt

### Lead
- PK: `id`
- Campos: contato (name, phone, email, city), formJson, quizJson, mode, whatsappEnabled, whatsappOpened, whatsappNumberUsed?, status, UTMs, device?, ipHash?
- Índices: pageId+createdAt, whatsappOpened, status
- **Nota:** `whatsappNumberUsed` no schema local; requer `db push` se não aplicado em prod

### ChatConversation / ChatMessage
- Conversa: visitorToken (unique), unread counters, leadId?, status open|closed
- Mensagem: sender visitor|agent, body, agentUserId?, agentName?

### GlobalSettings (singleton id=`global`)
- Limites, Telegram, allowTenantCustomWa, inviteDaysValid, etc.

### TenantSettings
- Overrides por tenant (maxPages, disabled, telegramChatId, etc.)

### AuditLog
- actorId, action, targetType?, targetId?, metaJson?

### Account, Session, VerificationToken
- Auth.js / Prisma adapter (OAuth tables; OAuth provider não configurado no código)

## Seeds

`prisma/seed.ts`: super admin tenant + user + globalSettings.

## ConfigJson (Page)

Tipado em `lib/page-config.ts`: formulário, quiz, WhatsApp multi-número, mensagem WA.

## Fluxo de dados principal

```
Visitante → TrackEvent (view via /api/t)
         → Lead (form/quiz via /api/leads)
         → ChatConversation + Lead (chat via /api/chat/conversations)
Tenant   → lê leads/analytics via APIs autenticadas
Super    → invites, settings globais, audit, impersonate
```

## Retenção de leads

`leadRetentionDays` configurável em UI — **sem job de purge implementado** (apenas setting).
