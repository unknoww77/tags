# Funcionalidades — Matriz Top1Tags

| Funcionalidade | Frontend | Backend | Banco | Integração | Status | Arquivos principais |
|----------------|----------|---------|-------|------------|--------|---------------------|
| Login vulgo/senha | LoginForm | NextAuth credentials | User | — | ✅ | auth.ts, LoginForm |
| Cadastro invite-only | RegisterForm | /api/register | Invite, Tenant, User | — | ✅ | cadastro, register route |
| Super admin panel | /super | invites, settings, audit | vários | — | ✅ | super/page.tsx |
| Impersonação tenant | ImpersonateButton | /api/impersonate | cookie HMAC | — | ✅ | impersonation.ts |
| CRUD páginas | CreatePageForm, dashboard | /api/pages | Page | — | ✅ | pages routes |
| Preview slug.platform | middleware rewrite | site/[slug] | Page | — | ✅ | middleware.ts |
| Custom domain | DomainConnect | domain API + CF | Domain | Cloudflare | ✅ | cloudflare.ts, domains |
| NS validation cron | — | cron/validate-ns | Domain | Cloudflare | ✅ | domains.ts, compose cron |
| Analytics UTMs | PageAnalytics | analytics API | TrackEvent | — | ✅ | PageAnalytics.tsx |
| Tracking views/CTA | TrackingBeacon | /api/t | TrackEvent | — | ✅ | tracking.ts |
| Formulário + quiz | EngagementBlock | — | configJson | — | ✅ | page-config, EngagementBlock |
| WhatsApp multi-número | EngagementConfigFields | /api/leads + pick | Lead.whatsappNumberUsed | wa.me | 🟡 | **alterações locais não commitadas** |
| Chat visitante | ConectCarChatWidget | chat/conversations | Chat* | — | ✅ | ChatWidget, chat routes |
| Chat agente | ChatInbox | chat/inbox | Chat* | — | ✅ | ChatInbox.tsx |
| Leads CRM | LeadsPanel | leads APIs | Lead | — | ✅ | LeadsPanel |
| Export CSV | link | export route | Lead | — | ✅ | export/route.ts |
| Telegram lead notify | — | notifyTelegramLead | settings | Telegram API | 🟡 | settings.ts (sem retry) |
| Telegram deploy/health | GH Actions | scripts/*.mjs | — | Telegram | ✅ | workflows |
| ConectCar landing completa | ConectCarLanding | — | — | assets static | ✅ | landings/* |
| Veloe landing | VeloeLanding | — | — | — | ✅ | VeloeLanding |
| CTA afiliado custom | — | salva Page.ctaUrl | Page | — | ⚪ | não renderizado |
| Retenção leads | settings UI | — | setting only | — | ⚪ | sem job purge |
| allowTenantCustomWa | GlobalSettingsForm | PATCH settings | GlobalSettings | — | ⚪ | não enforced |
| OAuth social login | Account model | — | Account | — | ⚪ | adapter sem provider |
| Testes automatizados | — | — | — | — | ❌ | zero arquivos test |
| Lint/ESLint | — | — | — | — | ❌ | não configurado |
