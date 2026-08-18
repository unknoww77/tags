"use client";

import Link from "next/link";
import { HelpTip } from "@/components/HelpTip";

export type PageCardData = {
  id: string;
  title: string;
  brandLabel: string;
  status: string;
  previewHost: string;
  domainHostname: string | null;
  domainNsStatus: string | null;
  leadsTotal: number;
  whatsappConfigured: boolean;
  whatsappNumberMasked: string | null;
  whatsappOpened: number;
  whatsappNotOpened: number;
  formFieldsCount: number;
  formSubmissions: number;
  liveLabel: string;
  eventsCount: number;
};

function Stat({
  label,
  value,
  help,
}: {
  label: string;
  value: string | number;
  help: string;
}) {
  return (
    <div className="page-stat">
      <span className="page-stat-label">
        {label}
        <HelpTip text={help} />
      </span>
      <strong className="page-stat-value">{value}</strong>
    </div>
  );
}

export function PageDashboardCard({ page }: { page: PageCardData }) {
  return (
    <Link href={`/dashboard/pages/${page.id}`} className="page-card page-card-rich">
      <div className="page-card-top">
        <div>
          <h3>{page.title}</h3>
          <p className="muted">
            {page.brandLabel} · {page.status} · {page.eventsCount} eventos
          </p>
          <p className="muted">Preview: {page.previewHost}</p>
        </div>
      </div>

      <div className="page-stat-grid">
        <Stat
          label="Leads"
          value={page.leadsTotal}
          help="Total de pessoas que enviaram o funil (formulário e/ou quiz) nesta página."
        />
        <Stat
          label="WhatsApp"
          value={
            page.whatsappConfigured
              ? `Sim${page.whatsappNumberMasked ? ` · ${page.whatsappNumberMasked}` : ""}`
              : "Não"
          }
          help="Se o funil está configurado para abrir WhatsApp ao enviar. Mostra o número mascarado quando houver."
        />
        <Stat
          label="WA abriu"
          value={page.whatsappOpened}
          help="Leads em que o WhatsApp foi aberto com sucesso (pop-up não bloqueado)."
        />
        <Stat
          label="WA não abriu"
          value={page.whatsappNotOpened}
          help="Leads com WhatsApp ligado, mas o chat não abriu (bloqueio de pop-up ou falha)."
        />
        <Stat
          label="Campos form"
          value={page.formFieldsCount}
          help="Quantos campos estão ativos no formulário (nome, telefone, e-mail, cidade)."
        />
        <Stat
          label="Envios form"
          value={page.formSubmissions}
          help="Quantos leads passaram pelo formulário (envios salvos com dados de contato)."
        />
        <Stat
          label="Domínio"
          value={
            page.domainHostname
              ? `${page.domainHostname}${page.domainNsStatus ? ` (${page.domainNsStatus})` : ""}`
              : "Sem domínio"
          }
          help="Domínio custom conectado a esta landing e status dos nameservers na Cloudflare."
        />
        <Stat
          label="No ar"
          value={page.liveLabel}
          help="Tempo desde que a página ficou publicada / domínio ativo. Se ainda for rascunho, mostra há quanto tempo foi criada."
        />
      </div>
    </Link>
  );
}
