# FASE 0B — Public Lead Flow Hardening

**Data:** 2026-09-01  
**Status:** implementado localmente — sem commit/push/deploy

---

## Diagnóstico anterior

### Fluxo legítimo (antes)

```
EngagementBlock.finish()
  → POST /api/leads { pageId, form, quiz, whatsappEnabled, whatsappOpened: false }
  → rate limit 30/min/IP
  → page findUnique
  → bloqueio só se !page || status === "archived"
  → draft PASSAVA
  → create Lead + TrackEvent + Telegram
  → retorna { ok, leadId, whatsappUrl }
  → window.open(whatsappUrl)  // após await fetch — popup pode bloquear
  → POST /api/leads/:id/opened  // sem body, sem auth
  → find lead → update whatsappOpened=true
```

### DIAGNÓSTICO FASE 0B (pré-implementação)

| # | Situação |
|---|----------|
| 1 | `page.status` validado apenas para `archived` |
| 2 | Enum `PageStatus`: `draft`, `published`, `archived` |
| 3 | `archived` já bloqueado (404 "Página inválida") |
| 4 | `draft` não bloqueado — preview `/site/[slug]` usa mesma API pública |
| 5 | `leadId` retornado no JSON do POST /api/leads |
| 6 | `/opened` validava só existência do lead + `whatsappEnabled` |
| 7 | Enumeration: cuid difícil mas endpoint aberto permitia marcar qualquer lead WA conhecido |
| 8 | Rate limit: leads 30/min/IP; opened 60/min/IP — in-memory Map |
| 9 | Dados suficientes para vincular abertura: leadId + segredo servidor + expiração |
| 10 | Solução stateless com HMAC — **sem alteração de schema** |

---

## Threat model

| Ameaça | Mitigação 0B |
|--------|----------------|
| Lead em página draft/archived | Backend exige `status === published` |
| Marcar `whatsappOpened` de lead arbitrário | Token HMAC vinculado ao `leadId` + TTL |
| Reutilizar token em outro lead | `leadId` no payload assinado |
| Forjar token só com leadId | HMAC com `AUTH_SECRET` + domain separation |
| Enumeration de leads via /opened | 403 genérico "Não autorizado" |
| Token permanente | Expira em 5 minutos |

---

## Draft/published behavior

| Status | POST /api/leads |
|--------|-----------------|
| `published` | Permitido (tenant ativo, rate limit, etc.) |
| `draft` | 404 "Página inválida" — sem Lead, TrackEvent, Telegram, whatsappUrl |
| `archived` | Idem |
| Outro | Fail closed |

**Preview:** `/site/[slug]` continua renderizando draft para o tenant; **não** cria leads reais.

**Mudança de comportamento:** preview/dashboard que dependia de lead real em draft **não funcionará** via API pública — documentado. Não há "lead de teste" nesta fase.

---

## Opened token design

- **Nome na API:** `openedToken` (resposta de POST /api/leads)
- **Formato wire:** `base64url(leadId|issuedAt|expiresAt|signature)`
- **Assinatura:** `HMAC-SHA256(AUTH_SECRET, "v1|lead-opened|leadId|issuedAt|expiresAt")` → base64url
- **Emitido:** somente quando `whatsappUrl` é gerado com sucesso
- **Não** persistido em DB, localStorage, sessionStorage ou cookies

---

## Criptografia/assinatura

- `node:crypto` `createHmac` + `timingSafeEqual` na verificação da assinatura
- Reutiliza `env.authSecret()` (`AUTH_SECRET` / `NEXTAUTH_SECRET`)
- Domain separation: prefixo `v1|lead-opened|` no material assinado
- Secret nunca retornado, logado ou enviado ao cliente

---

## Expiração

- **TTL:** 5 minutos (`LEAD_OPENED_TOKEN_TTL_MS`)
- Coerente com: POST lead → `window.open` → confirmação imediata
- Token expirado rejeitado em `verifyLeadOpenedToken`

---

## Fluxo frontend

1. `await fetch("/api/leads", …)` — mantido (popup após resposta)
2. Recebe `leadId`, `whatsappUrl`, `openedToken`
3. `window.open(whatsappUrl)` — **sem mudança de ordem** (após POST completo)
4. Se popup OK e há `openedToken`: `POST /api/leads/:id/opened` com `{ token }` em memória
5. Token não armazenado em storage persistente

**Popup blocker:** comportamento idêntico ao anterior; `await` antes de `open` já existia.

---

## Arquivos modificados (FASE 0B)

| Arquivo | Mudança |
|---------|---------|
| `lib/lead-opened-token.ts` | **novo** — create/verify HMAC, `isPageAcceptingPublicLeads` |
| `app/api/leads/route.ts` | Bloqueio draft/archived; emite `openedToken` |
| `app/api/leads/[id]/opened/route.ts` | Exige body `{ token }`; 403 fail-closed |
| `components/EngagementBlock.tsx` | Envia `openedToken` no POST opened |
| `scripts/verify-phase-0b.ts` | **novo** — testes token + status + DB opcional |
| `package.json` | script `verify:phase-0b` |
| `docs/audit/PHASE_0B_PUBLIC_LEAD_HARDENING.md` | este relatório |

**Não alterados:** `prisma/schema.prisma`, landings visuais, Cloudflare, Telegram, Caddy, Actions.

---

## Testes

### `npm run verify:phase-0b`

| Caso | Resultado |
|------|-----------|
| Token válido | OK |
| Token alterado | Rejeita |
| Token lead A em lead B | Rejeita |
| Token expirado | Rejeita |
| Payload adulterado (expiresAt sem resign) | Rejeita |
| Base64 só leadId | Rejeita |
| published | Aceito |
| draft / archived / unknown | Bloqueado |
| DB: update whatsappOpened | OK |
| DB: idempotência | OK |

### Outros

| Comando | Resultado |
|---------|-----------|
| `npx prisma validate` | OK |
| `npx prisma generate` | OK |
| `npx tsc --noEmit` | OK |
| `npm run verify:bootstrap` | OK (DB isolado) |
| `npm run build` | OK |

---

## Segurança validada

| Pergunta | Resposta |
|----------|----------|
| Alterar leadId no request? | Token assinado para ID específico → 403 |
| Reutilizar token em outro lead? | Não — leadId no payload |
| Alterar expiresAt? | Invalida assinatura |
| Fabricar token só com leadId? | Não — precisa HMAC com secret |
| Token expira? | Sim — 5 min |
| Chamada duplicada? | Idempotente — ok:true |
| Resposta revela outros leads? | 403 genérico |
| Draft gera token? | Não — não cria lead |
| Archived gera token? | Não |
| Secret em logs/resposta? | Não |

---

## Regressões verificadas (estática)

- Form/quiz flow — inalterado exceto `openedToken` no opened
- WhatsApp multi-número — `pickWhatsAppNumber` / `whatsappNumberUsed` intactos
- UTMs, TrackEvent, Telegram — só após validação published
- Lead sem WhatsApp — sem `openedToken`
- Chat interno — não usa `/opened`
- Dashboard/CSV — não tocados

---

## Mudanças de comportamento

1. **Draft/archived:** API pública não aceita leads.
2. **/opened:** requer `openedToken` válido; clientes antigos sem token falham (403).
3. **Preview:** visual OK; conversão real exige `published`.

---

## Limitações (fora de 0B)

- Rate limit in-memory (sem Redis)
- Sem CAPTCHA
- `whatsappOpened` no create ainda aceita valor do body (EngagementBlock envia `false`)
- Popup após `await` — risco de bloqueio do browser
- Token não prova que WhatsApp foi realmente aberto (apenas popup não-null)

---

## Rollback

1. Reverter arquivos listados em "Arquivos modificados (FASE 0B)"
2. Sem migration — rollback de código é seguro
3. Leads já criados em draft (antes do deploy) permanecem no DB

---

## Próxima fase recomendada

**FASE 0C / auditoria:** Redis rate limit, CAPTCHA opcional, ou migrations versionadas — conforme `PROJECT_AUDIT.md`.

---

## Diferenciação de diffs locais

| Origem | Arquivos |
|--------|----------|
| **FASE 0B** | `lib/lead-opened-token.ts`, leads routes, `EngagementBlock.tsx`, `verify-phase-0b.ts`, `package.json` (verify:phase-0b) |
| **FASE 0A** (não commitada) | `prisma/seed.ts`, `lib/bootstrap-env.ts`, `lib/env.ts`, `.env.example`, `docker-entrypoint.js`, `verify-bootstrap` |
| **Build CSS** (commitada) | `app/globals.css` em `7705f8a` |
| **Auditoria ConectCar** | `docs/reference/`, `scripts/audit-conectcar-ui.mjs` |
