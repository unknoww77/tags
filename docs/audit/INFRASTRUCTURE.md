# Infraestrutura — Top1Tags

## Docker

### Dockerfile (multi-stage)
1. `dependencies`: npm ci + prisma
2. `builder`: prisma generate + next build (standalone)
3. `runner`: standalone server + entrypoint

### docker-compose.dev.yaml
- `postgres` :5433
- `app` node:20, `npm install`, `db push`, seed, `npm run dev`
- Volume bind mount código + node_modules volume

### docker-compose.prod.yaml
- `postgres` (healthcheck)
- `app` image `top1tags:latest` (build local/CI)
- `cron` curl loop → validate-ns
- `proxy` Caddy :80/:443 → app:3000
- Networks: `web`, volumes postgres + caddy

### Caddyfile
- Catch-all `:80` reverse_proxy app:3000
- HTTPS block comentado (Cloudflare Flexible na origem)

## Sequência DEV

1. `cp .env.example .env`
2. `docker compose -f docker-compose.dev.yaml up`
3. App em localhost:3000, DB postgres:5433 externamente

## Sequência PRODUÇÃO

1. GitHub Actions: build image → save tar.gz
2. SCP: compose, Caddyfile, image → VPS `~/top1tags`
3. SSH: write `.env` from `INFRA_ENV` secret
4. `docker load` + `docker compose -f docker-compose.prod.yaml up -d`
5. Entrypoint app: `prisma db push` → seed → `next start`
6. Healthcheck: fetch `/login` com Host header platform domain

## CI/CD

| Workflow | Trigger | Função |
|----------|---------|--------|
| `deploy.yaml` | push main/master (paths) + manual | Build, SCP, deploy VPS SSH port 20203 |
| `platform-health.yaml` | cron 5min + manual | Probe URL + Telegram alert |

## Secrets GitHub (referenciados)

- `INFRA_ENV`, `INFRA_SERVER_IP`, `INFRA_SERVER_USERNAME`, `INFRA_SERVER_KEY`
- `INFRA_ALLOWED_IPS` (opcional UFW)
- `PLATFORM_TELEGRAM_BOT_TOKEN`, `PLATFORM_TELEGRAM_CHAT_ID`, `PLATFORM_HEALTH_URL`
- `GOOGLE_MAPS_API_KEY` documentado em CONFIGURACAO_DEPLOY — **não usado no código**

## Ambientes

- **dev**: docker-compose.dev, localhost
- **prod**: VPS + Docker, domínio `top1tags.dev` (configurável)
- **staging**: NÃO CONFIRMADO (não há compose/stage separado)

## Observabilidade

- Healthchecks Docker
- Platform health GitHub Action
- Sem Prometheus/Grafana/logs centralizados
