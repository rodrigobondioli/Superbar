"use client";

import { useState, useTransition } from "react";
import { updateLeadStatus } from "@/lib/admin/actions";
import type { Lead } from "@/lib/admin/queries";

const STATUS_OPTIONS = ["novo", "contatado", "demo", "convertido", "perdido"];

const STATUS_COLOR: Record<string, string> = {
  novo:       "var(--info)",
  contatado:  "var(--accent)",
  demo:       "var(--warn)",
  convertido: "var(--ok)",
  perdido:    "var(--fg-subtle)",
};

const STATUS_LABEL: Record<string, string> = {
  novo:       "Novo",
  contatado:  "Contatado",
  demo:       "Demo",
  convertido: "Convertido",
  perdido:    "Perdido",
};

const fmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit", month: "short",
  hour: "2-digit", minute: "2-digit",
});

export function LeadsTable({ leads: initial }: { leads: Lead[] }) {
  const [leads, setLeads] = useState(initial);
  const [, startTransition] = useTransition();

  function handleStatusChange(id: string, newStatus: string) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    startTransition(async () => {
      await updateLeadStatus(id, newStatus);
    });
  }

  if (leads.length === 0) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "var(--fg-subtle)", fontSize: 13 }}>
        Nenhum lead ainda.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
      {leads.map((lead, i) => (
        <div
          key={lead.id}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 16,
            padding: "14px 18px",
            borderBottom: i < leads.length - 1 ? "1px solid var(--border)" : "none",
            background: "var(--bg-elevated)",
            alignItems: "center",
          }}
        >
          {/* Info */}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{lead.nome_bar}</span>
              <span style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
                {lead.cidade} · {lead.tipo_bar}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              {lead.nome_responsavel && (
                <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>{lead.nome_responsavel}</span>
              )}
              {lead.whatsapp && (
                <a
                  href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 12, color: "var(--ok)", textDecoration: "none", fontFamily: "var(--font-mono)" }}
                >
                  {lead.whatsapp}
                </a>
              )}
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  style={{ fontSize: 12, color: "var(--fg-muted)", textDecoration: "none", fontFamily: "var(--font-mono)" }}
                >
                  {lead.email}
                </a>
              )}
              {lead.instagram && (
                <a
                  href={`https://instagram.com/${lead.instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", fontFamily: "var(--font-mono)" }}
                >
                  @{lead.instagram.replace(/^@/, "")}
                </a>
              )}
              {lead.site && (
                <a
                  href={lead.site.startsWith("http") ? lead.site : `https://${lead.site}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 12, color: "var(--fg-muted)", textDecoration: "none", fontFamily: "var(--font-mono)" }}
                >
                  {lead.site.replace(/^https?:\/\//, "")}
                </a>
              )}
              <span style={{ fontSize: 11, color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
                {fmt.format(new Date(lead.created_at))}
              </span>
            </div>
            {lead.notas && (
              <p style={{ fontSize: 12, color: "var(--fg-muted)", margin: "6px 0 0", lineHeight: 1.5 }}>
                {lead.notas}
              </p>
            )}
          </div>

          {/* Status selector */}
          <div style={{ flexShrink: 0 }}>
            <select
              value={lead.status}
              onChange={e => handleStatusChange(lead.id, e.target.value)}
              style={{
                appearance: "none",
                background: "color-mix(in srgb, " + (STATUS_COLOR[lead.status] ?? "var(--fg-subtle)") + " 12%, transparent)",
                color: STATUS_COLOR[lead.status] ?? "var(--fg-subtle)",
                border: "1px solid " + (STATUS_COLOR[lead.status] ?? "var(--border)"),
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt} style={{ background: "var(--bg-elevated)", color: "var(--fg)" }}>
                  {STATUS_LABEL[opt]}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
