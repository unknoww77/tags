# Frontend — Top1Tags

## Stack

- **Next.js 16** App Router, **React 19**
- CSS global (`app/globals.css`), sem Tailwind
- Fontes: DM Sans + Syne (Google Fonts)
- Estado: React local + `next-auth/react` SessionProvider
- Sem Redux/Zustand/Context global de app (exceto session)

## Páginas (App Router)

| Rota | Tipo | Auth | Componentes principais | APIs |
|------|------|------|--------------------------|------|
| `/` | Server | redirect se logado | PlatformHeader | — |
| `/login` | Server + client form | público | LoginForm → signIn | NextAuth |
| `/cadastro` | Server + RegisterForm | público + invite | RegisterForm | POST /api/register |
| `/dashboard` | Server | tenant/super | PageDashboardCard | prisma server |
| `/dashboard/pages/new` | Server + CreatePageForm | tenant | EngagementConfigFields | POST /api/pages |
| `/dashboard/pages/[id]` | Server | tenant | PageConfigEditor, LeadsPanel, DomainConnect, PageAnalytics, PreviewPanel | várias |
| `/dashboard/chat` | Client ChatInbox | tenant | ChatInbox | /api/chat/inbox/* |
| `/super` | Server | SUPER_ADMIN | InviteManager, GlobalSettingsForm, AuditLogPanel, ImpersonateButton | várias |
| `/super/chat` | ChatInbox global | SUPER_ADMIN | ChatInbox | inbox + tenantId filter |
| `/super/tenants/[tenantId]` | Server | SUPER_ADMIN | TenantSettingsForm | tenant settings API |
| `/site/[slug]` | Server | público | LandingRenderer | — |
| `/site/by-host/[hostname]` | Server | público (NS active) | LandingRenderer | — |

## Landings

- `LandingRenderer` → ConectCarLanding ou VeloeLanding
- **ConectCar**: hero carousel, planos, tabela, chat widget, funil (`EngagementBlock`)
- **Veloe**: hero simples + funil
- `templateId === "compact"` reduz seções (CSS class `is-compact`)
- CTAs hardcoded `href="#funil"` — **não usam** `page.ctaUrl` do banco
- `TrackingBeacon`: POST view em mount

## Engajamento

- `EngagementBlock`: quiz → form → POST /api/leads → abre `whatsappUrl` da resposta
- `ConectCarChatWidget`: chat interno, POST /api/chat/conversations

## Dashboard componentes

| Componente | Função |
|------------|--------|
| PlatformHeader | Nav + logout |
| ImpersonationBanner | Modo conta |
| DomainConnect | POST domain + validate |
| PageAnalytics | GET analytics |
| LeadsPanel | leads + export link |
| GlobalSettingsForm / TenantSettingsForm | settings APIs |
| InviteManager | invites CRUD |
| AuditLogPanel | audit logs |

## UI sem backend correspondente

| UI / campo | Status |
|------------|--------|
| `ctaUrl`, `ctaLabel`, `affiliateCode` na Page | Salvos no DB, **não usados** nas landings |
| `allowTenantCustomWa` | UI global, **não enforced** |
| `leadRetentionDays` | UI only, **sem purge** |
| `CtaButton` component | **Não importado** em lugar nenhum |
| Chat → WhatsApp (texto em EngagementConfigFields antigo) | Chat não usa WA |

## Responsividade

- CSS custom com grids; landings ConectCar densas; sem testes E2E de layout
