"use client";

import { useState } from "react";
import { Smartphone } from "lucide-react";
import { atualizarAutoPedido, atualizarFluxoPronto, atualizarTaxaServico, type ActionResult } from "@/lib/settings/actions";
import { inp, Feedback } from "./shared";

export function OperacaoSection({ barId, autoPedido, fluxoPronto, taxaServicoPct }: { barId: string; autoPedido: boolean; fluxoPronto: boolean; taxaServicoPct: number }) {
  const [enabled, setEnabled]       = useState(autoPedido);
  const [saving, setSaving]         = useState(false);
  const [pronto, setPronto]         = useState(fluxoPronto);
  const [prontoSaving, setProntoSaving] = useState(false);
  const [taxa, setTaxa]             = useState(String(taxaServicoPct));
  const [taxaSaving, setTaxaSaving] = useState(false);
  const [taxaFeedback, setTaxaFeedback] = useState<ActionResult>(null);

  async function handleToggle() {
    const next = !enabled;
    setEnabled(next); // optimistic
    setSaving(true);
    const r = await atualizarAutoPedido(barId, next);
    setSaving(false);
    if (r && "error" in r) setEnabled(!next); // reverte se a gravação falhar
  }

  async function handleProntoToggle() {
    const next = !pronto;
    setPronto(next);
    setProntoSaving(true);
    await atualizarFluxoPronto(barId, next);
    setProntoSaving(false);
  }

  async function handleTaxaSave() {
    const pct = parseFloat(taxa.replace(",", "."));
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setTaxaFeedback({ error: "Informe um valor entre 0 e 100." });
      return;
    }
    setTaxaSaving(true);
    const result = await atualizarTaxaServico(barId, pct);
    setTaxaFeedback(result);
    setTaxaSaving(false);
    setTimeout(() => setTaxaFeedback(null), 3000);
  }

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <Smartphone style={{ width: 14, height: 14, color: "var(--fg-subtle)" }} />
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", margin: 0 }}>
          Operação
        </h3>
      </div>

      {/* Toggle auto_pedido */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px",
        background: "var(--bg-inset)",
        borderRadius: 8,
        gap: 16,
      }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", margin: "0 0 3px" }}>
            Pedido pelo celular (auto-pedido)
          </p>
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: 0, lineHeight: 1.5 }}>
            {enabled
              ? "Cliente pode pedir direto pelo QR code, sem chamar o garçom."
              : "Cliente vê o cardápio mas precisa chamar o garçom para pedir."}
          </p>
        </div>

        {/* Toggle switch */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={handleToggle}
          disabled={saving}
          style={{
            flexShrink: 0,
            width: 44, height: 24,
            borderRadius: 16,
            border: "none",
            cursor: saving ? "default" : "pointer",
            background: enabled ? "var(--accent)" : "rgba(255,255,255,0.15)",
            position: "relative",
            transition: "background 200ms",
            opacity: saving ? 0.7 : 1,
          }}
        >
          <span style={{
            position: "absolute",
            top: 3, left: enabled ? 23 : 3,
            width: 18, height: 18,
            borderRadius: "50%",
            background: "#ffffff",
            transition: "left 200ms",
            display: "block",
          }} />
        </button>
      </div>

      {/* Toggle fluxo_pronto */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", marginTop: 10, background: "var(--bg-inset)", borderRadius: 8, gap: 16 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", margin: "0 0 3px" }}>
            Garçom retira o drink pronto
          </p>
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: 0, lineHeight: 1.5 }}>
            {pronto
              ? "O bartender marca “pronto” e o garçom é avisado para retirar. Ideal quando o garçom leva o drink."
              : "O bartender entrega direto, sem o passo “pronto”. Ideal para balcão/autoatendimento."}
          </p>
        </div>
        <button type="button" role="switch" aria-checked={pronto} onClick={handleProntoToggle} disabled={prontoSaving}
          style={{ flexShrink: 0, width: 44, height: 24, borderRadius: 16, border: "none", cursor: prontoSaving ? "default" : "pointer", background: pronto ? "var(--accent)" : "rgba(255,255,255,0.15)", position: "relative", transition: "background 200ms", opacity: prontoSaving ? 0.7 : 1 }}>
          <span style={{ position: "absolute", top: 3, left: pronto ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#ffffff", transition: "left 200ms", display: "block" }} />
        </button>
      </div>

      {/* Taxa de serviço */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px", marginTop: 10,
        background: "var(--bg-inset)",
        borderRadius: 8,
        gap: 16,
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", margin: "0 0 3px" }}>
            Taxa de serviço (%)
          </p>
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: 0, lineHeight: 1.5 }}>
            Aplicada opcionalmente no fechamento da comanda. Use 0 para desativar.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={taxa}
            onChange={e => setTaxa(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleTaxaSave()}
            style={{
              ...inp,
              width: 72, textAlign: "right",
              padding: "8px 10px",
            }}
          />
          <button
            type="button"
            onClick={handleTaxaSave}
            disabled={taxaSaving}
            style={{
              padding: "10px 20px", borderRadius: 999, border: "none",
              background: "var(--accent)", color: "var(--accent-fg)",
              fontSize: 14, fontWeight: 500, cursor: taxaSaving ? "default" : "pointer",
              opacity: taxaSaving ? 0.6 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {taxaSaving ? "..." : "Salvar"}
          </button>
        </div>
      </div>
      {taxaFeedback && <Feedback result={taxaFeedback} />}
    </section>
  );
}
