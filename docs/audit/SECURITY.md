# Segurança defensiva — Top1Tags

Análise estática local. Sem exploração de serviços reais.

## Classificação de achados

### CRÍTICO

| Achado | Evidência | Nota |
|--------|-----------|------|
| Credenciais default em `.env.example` | `SUPER_ADMIN_PASSWORD=ChangeMeNow123!` | Risco se deploy sem troca |
| Seed recria hash do super admin com env | `prisma/seed.ts`, entrypoint sempre roda seed | Pode resetar senha em cada deploy se env fixo |
| Endpoint público marca WA aberto | `app/api/leads/[id]/opened/route.ts` | Sem prova de abertura; ID cuid difícil mas não autenticado |

### ALTO

| Achado | Evidência |
|--------|-----------|
| Leads em páginas `draft` | `app/api/leads/route.ts` bloqueia só `archived`; preview público em `site/[slug]` |
| Rate limit em memória | `lib/tracking.ts` — ineficaz multi-instância |
| Telegram expõe número WA completo | `lib/settings.ts` notifyTelegramLead |
| `allowTenantCustomWa` não enforced | Schema + UI global; sem checagem ao configurar WA |
| Sem CSRF explícito em APIs JSON | Padrão Next.js; cookies SameSite=lax em impersonate |

### MÉDIO

| Achado | Evidência |
|--------|-----------|
| Chat visitante: token em query string | GET `/api/chat/conversations/[id]?token=` |
| Impersonation cookie HMAC | OK com AUTH_SECRET; sem rotação |
| bcrypt cost 12 | Adequado |
| Prisma parametrizado | Sem SQL injection direto |
| CORS não customizado | Same-origin para dashboard |
| CRON vazio = 401 | `!secret \|\| token !== secret` |

### BAIXO

| Achado | Evidência |
|--------|-----------|
| Headers segurança só no Caddy | `Caddyfile` X-Content-Type-Options, Referrer-Policy |
| Sem 2FA, sem API keys tenant | — |
| `trustHost: true` em Auth.js | Necessário behind proxy |

## Autenticação

- Credentials (vulgo + senha), JWT session strategy
- Sem refresh token separado; sessão Auth.js
- Sem recuperação de senha
- Roles: SUPER_ADMIN, TENANT_ADMIN

## Permissões

- `canAccessTenant`: super vê tudo; impersonating restringe ao tenant
- Tenant admin: só próprio tenantId
- Páginas dashboard: `requireTenantAdmin` + checks em page detail

## Dados sensíveis em logs

- `console.error` em falhas; sem evidência de log de PII sistemático
- IP: hash SHA-256 + salt (tracking)

## Dependências

- Sem `npm audit` executado nesta auditoria (NÃO CONFIRMADO vulnerabilidades CVE)
