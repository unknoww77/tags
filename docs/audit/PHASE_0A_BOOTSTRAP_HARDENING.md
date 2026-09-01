# FASE 0A — Bootstrap Hardening

## Problema original

O `prisma/seed.ts` era executado em **todo deploy** via `scripts/docker-entrypoint.js` e:

- fazia **update** do super admin existente (incluindo `passwordHash`) em cada execução;
- usava fallback `ChangeMeNow123!` quando `SUPER_ADMIN_PASSWORD` não estava definida;
- atualizava o nome do tenant super-admin em cada seed;
- falhas de seed em produção eram ignoradas (`console.warn` + continuação).

Isso criava risco de reset involuntário de senha, dependência de credenciais default inseguras e comportamento diferente entre primeiro bootstrap e deploys seguintes.

## Comportamento anterior

| Aspecto | Antes |
|--------|--------|
| **DEV** | `docker-compose.dev.yaml` roda `npx tsx prisma/seed.ts` em cada `npm run dev`; seed com defaults hardcoded |
| **PROD** | Entrypoint: `db push` → seed → `server.js`; falha de seed não impedia start |
| **Super admin** | `findFirst` por email/username → **update** ou create; sempre recalcula `passwordHash` |
| **passwordHash** | Sempre atualizado no update path |
| **Fallbacks** | `SUPER_ADMIN_USERNAME` → `admin`; email → `admin@top1tags.dev`; password → `ChangeMeNow123!` |
| **Sem password** | Usava `ChangeMeNow123!` silenciosamente |
| **2º deploy** | Senha resetada ao valor da env (ou default) |
| **Env password alterada** | `passwordHash` sobrescrito no próximo deploy |
| **GlobalSettings** | `upsert` com `update: {}` — já não sobrescrevia (OK) |
| **Tenant** | `upsert` com `update: { name: ... }` — renomeava em cada seed |
| **Seed em todo deploy** | Sem razão funcional para alterar credenciais; apenas garantir objetos mínimos |

## Risco

- **Crítico:** senha do SUPER_ADMIN resetada em cada deploy/restart se `SUPER_ADMIN_PASSWORD` estava na env (ex.: INFRA_ENV).
- **Alto:** primeiro deploy em produção sem senha forte poderia criar conta com `ChangeMeNow123!`.
- **Médio:** falha de bootstrap mascarada em produção — app sobe sem super admin válido.
- **Baixo:** tenant super-admin renomeado em cada seed.

## Alterações realizadas

1. **`lib/bootstrap-env.ts`** (novo): leitura de env com distinção DEV/PROD, validação de senha (mín. 12 chars, rejeição de placeholders/inseguras), normalização de username.
2. **`prisma/seed.ts`**: seed idempotente — se existe `role: SUPER_ADMIN`, preserva credenciais; cria apenas na primeira bootstrap; `GlobalSettings` e tenant com `update: {}`; logs sem senha.
3. **`lib/env.ts`**: getters `superAdmin*` sem fallback inseguro em `NODE_ENV=production`.
4. **`.env.example`**: documenta `SUPER_ADMIN_USERNAME`, email, name, password com placeholder inválido `CHANGE_ME_BEFORE_FIRST_BOOT`.
5. **`scripts/docker-entrypoint.js`**: em produção, falha de seed **impede** start do app.
6. **`scripts/verify-bootstrap-idempotent.mjs`** + `npm run verify:bootstrap`: teste isolado em database temporária.

## Comportamento novo

### Primeiro bootstrap (super admin não existe)

- Exige `SUPER_ADMIN_USERNAME`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_NAME` e senha válida.
- Em **produção**: sem env ou com placeholder → seed falha com mensagem clara; entrypoint encerra.
- Em **desenvolvimento**: defaults locais (`admin`, `admin@top1tags.dev`, `LocalDevOnly123!`) se env omitida.
- Cria tenant fixo, super admin e `GlobalSettings` com defaults apenas no `create`.

### Deploys seguintes (super admin já existe)

- Seed roda mas **não altera** `passwordHash`, email, username ou name.
- `SUPER_ADMIN_PASSWORD` na env **não** altera hash existente.
- `GlobalSettings` existentes preservados (`update: {}`).
- Tenant super-admin não renomeado.

### Alteração de senha

- Deve ocorrer por fluxo explícito futuro (não pelo seed automático).

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `lib/bootstrap-env.ts` | Novo — validação e leitura de env bootstrap |
| `prisma/seed.ts` | Refatoração idempotente |
| `lib/env.ts` | Getters super admin sem fallback inseguro em prod |
| `.env.example` | Documentação completa SUPER_ADMIN_* |
| `scripts/docker-entrypoint.js` | Falha de seed bloqueia start em produção |
| `scripts/verify-bootstrap-idempotent.mjs` | Novo — teste de idempotência |
| `package.json` | Script `verify:bootstrap` |

## Testes executados

| Teste | Resultado |
|-------|-----------|
| `npx prisma validate` | OK |
| `npx prisma generate` | OK |
| `npx tsc --noEmit` | OK |
| `npm run build` | **FALHOU** — erro pré-existente em `app/globals.css:1325` (selector vazio `}`); não introduzido por FASE 0A |
| `npm run verify:bootstrap` | OK — Postgres temporário isolado (`top1tags_bootstrap_test`) |

### Propriedades verificadas pelo script

1. Execução 1: cria SUPER_ADMIN.
2. Execução 2: `passwordHash` idêntico.
3. Execução 3 com `SUPER_ADMIN_PASSWORD` diferente: `passwordHash` idêntico.
4. `globalSettings` alterados manualmente (maxPages=42, notifyTelegram=true) preservados após seed.

## Resultados

FASE 0A atinge o objetivo: bootstrap inicial seguro, deploys subsequentes não resetam senha nem settings operacionais. Produção não sobe se bootstrap obrigatório falha.

## O que NÃO foi alterado

- WhatsApp multi-número, `app/api/leads/*`, `EngagementBlock`, `EngagementConfigFields`
- `prisma/schema.prisma`, migrations
- Rate limiting, páginas draft, frontend, Cloudflare, Telegram, Caddy, GitHub Actions
- `db push` → migrate (fase futura)
- Commit, push, deploy, banco de produção real

## Pontos pendentes

- Fluxo explícito de troca de senha do super admin (UI/API).
- Corrigir `app/globals.css` para `npm run build` passar (fora do escopo 0A).
- Avaliar se seed deve rodar em **todo** deploy ou só na primeira bootstrap (hoje: idempotente em todo deploy — seguro mas redundante).
- `scripts/create-admin.ts` ainda faz upsert com update de `passwordHash` (script manual dev — não usado no entrypoint).
- `docker-compose.dev.yaml` ainda roda seed em cada `npm run dev` (agora idempotente).

## Risco de regressão

| Risco | Mitigação |
|-------|-----------|
| Primeiro deploy prod sem senha forte | Container não sobe — esperado; configurar senha antes |
| Ambiente prod com placeholder na env | Seed falha — trocar senha na env antes do deploy |
| Email/username já usado por outro user | Seed falha com erro explícito — intervenção manual |
| Dev sem `.env` | Defaults dev `LocalDevOnly123!` — não usar em prod |

## Procedimento de rollback

1. Reverter arquivos desta fase (`git checkout --` dos paths listados).
2. Não é necessário alterar banco — dados existentes não foram modificados por esta mudança até o próximo deploy.
3. Se deploy com nova seed já ocorreu: super admin existente não foi alterado; rollback de código é seguro.

## Próxima fase recomendada

**FASE 0B** (sugestão alinhada à auditoria): substituir `prisma db push` por migrations versionadas em produção, ou endurecer validação de env obrigatórias no startup da app (AUTH_SECRET, etc.) sem depender do seed.

---

## DIAGNÓSTICO FASE 0A (pré-implementação)

### Baseline git

```
Branch: main
HEAD: 642238b383895df1476d2dc4d09b41b4a5efa62a
Status: working tree clean (antes das alterações 0A)
```

Arquivos baseline sem diff local antes da FASE 0A: `prisma/seed.ts`, `scripts/docker-entrypoint.js`, `.env.example`, `lib/env.ts`, `docker-compose.prod.yaml`, `Dockerfile`.

### Respostas analíticas (estado anterior)

1. **Seed em DEV:** `docker-compose.dev.yaml` — após `db push`, `npx tsx prisma/seed.ts` em cada start do container dev.
2. **Seed em PROD:** `docker-entrypoint.js` após cada `db push` em cada start/restart do container app.
3. **Super admin:** `findFirst` + **update** ou **create** (não upsert direto no user).
4. **passwordHash:** sempre recalculado e enviado no **update**.
5. **Fallbacks SUPER_ADMIN_*:** username `admin`, email `admin@top1tags.dev`, password `ChangeMeNow123!`, name `Super Admin`.
6. **Sem SUPER_ADMIN_PASSWORD:** usava `ChangeMeNow123!`.
7. **Segundo deploy:** update com novo hash → senha efetivamente resetada.
8. **Senha alterada na env:** próximo seed aplicava novo hash.
9. **GlobalSettings:** `update: {}` — não sobrescrevia (já OK).
10. **Seed em todo deploy:** sem necessidade funcional para credenciais; só para garantir objetos mínimos — comportamento perigoso no update path.
