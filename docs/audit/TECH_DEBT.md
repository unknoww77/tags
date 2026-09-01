# Dívida técnica — Top1Tags

## Prioridade CRÍTICA / ALTA

1. **Schema drift**: `whatsappNumberUsed` e multi-WA em working tree não commitados; prod pode não ter coluna até deploy + db push
2. **Seed em cada deploy** pode resetar super admin password hash
3. **Rate limiting** in-memory — inadequado para escala/HA
4. **Sem testes** automatizados
5. **Sem migrations versionadas** — só `db push` (risco em evolução schema)

## Arquitetura

- Monólito Next.js adequado ao tamanho atual
- Lógica de negócio misturada em route handlers (sem service layer formal)
- Duplicação: validação página em API vs `validateWhatsAppConfig` só no client editor

## Segurança

- Endpoints públicos leads/chat sem CAPTCHA
- `/api/leads/[id]/opened` abusable
- Default credentials em example env

## Performance

- Analytics: busca todos eventos 30d em memória (`analytics/route.ts`)
- Leads list cap 200; chat messages cap 200-300
- N+1 não crítico em listagens atuais

## Observabilidade

- Apenas console.error + Telegram pontual
- Sem APM, sem structured logging

## Documentação

- README alinhado com stack
- CONFIGURACAO_DEPLOY detalhado
- GOOGLE_MAPS referenciado sem uso
- `.env.example` falta `SUPER_ADMIN_USERNAME` (usado em seed/env.ts)

## Código morto / legado

- `components/CtaButton.tsx` — não importado
- `scripts/conectcar-dump/` — HTML/CSS dump referência, não runtime
- `.agents/skills/` — skills Prisma, não app runtime
- `lib/conectcar-plans.ts` — dados planos; uso parcial (PlansGrid)

## Frontend

- ConectCar landing muito grande (400+ linhas)
- Campos Page (ctaUrl) órfãos

## Infra

- Single VPS, single app instance assumido
- Caddy só HTTP :80 em prod típico (CF Flexible)
