# Top1Tags — plataforma multi-tenant de landings e tracking

Rede invite-only em **top1tags.dev** para parceiros criarem landings (ConectCar / Veloe),
conectarem domínio via Cloudflare (SSL Flexible) e acompanharem visitas/conversões.

## Stack

- Next.js 16 + Auth.js + Prisma + PostgreSQL
- Cloudflare API (zones + SSL flexible)
- Docker Compose (app, postgres, cron NS 10min, Caddy)

## Setup local

1. Copie o env:

```bash
cp .env.example .env
```

2. Suba Postgres + app:

```bash
docker compose -f docker-compose.dev.yaml up
```

Ou só o banco e rode local:

```bash
docker compose -f docker-compose.dev.yaml up postgres -d
# ajuste DATABASE_URL no .env para localhost:5432
npm install
npx prisma db push
npm run db:seed
npm run dev
```

3. Acesse `http://localhost:3000` e entre com o super admin do `.env`.

## Fluxo

1. Super admin gera convite em `/super`
2. Tenant cria conta em `/cadastro?invite=TOKEN`
3. Cria página (marca + CTA afiliado)
4. Preview em `{slug}.top1tags.dev`
5. Conecta domínio → nameservers Cloudflare → validação a cada 10 min ou botão manual
6. Analytics por página (UTMs, dispositivos, CTA)

## Produção

Ver [CONFIGURACAO_DEPLOY.md](./CONFIGURACAO_DEPLOY.md).

Secrets importantes no `.env` / `INFRA_ENV`:

- `DATABASE_URL`, `AUTH_SECRET`
- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- `CRON_SECRET`, `SUPER_ADMIN_*`
- `PLATFORM_DOMAIN=top1tags.dev`, `APP_URL=https://top1tags.dev`

## DNS da plataforma

Na zona Cloudflare de `top1tags.dev`:

- `A` / `AAAA` para a VPS (`@` e `www`)
- `A` / `AAAA` wildcard `*` → mesma VPS (previews `{slug}.top1tags.dev`)

## Privacidade do tracking

IPs são armazenados apenas como hash SHA-256 com salt (`TRACKING_IP_SALT`). Não guardamos IP cru.
