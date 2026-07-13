"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Target } from "lucide-react";
import { ImageUpload } from "@/components/cardapio/image-upload";
import { atualizarPerfil, atualizarLogo, type ActionResult } from "@/lib/settings/actions";
import type { Bar } from "@/types/database";
import { lbl, inp, Feedback } from "./shared";

export function PerfilDoBar({ bar, barId }: { bar: Bar; barId: string }) {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState<string | null>(bar.logo_url ?? null);
  const [result, setResult] = useState<ActionResult>(null);
  const [pending, setPending] = useState(false);

  const endereco = bar.endereco ?? {};

  // Endereço — controlado para CEP preencher automaticamente
  const [cep, setCep]       = useState(endereco.cep    ?? "");
  const [rua, setRua]       = useState(endereco.rua    ?? "");
  const [bairro, setBairro] = useState(endereco.bairro ?? "");
  const [cidade, setCidade] = useState(endereco.cidade ?? "");
  const [estado, setEstado] = useState(endereco.estado ?? "");
  const [cepLoading, setCepLoading] = useState(false);

  function formatCep(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  }

  async function handleCepChange(raw: string) {
    const formatted = formatCep(raw);
    setCep(formatted);
    const digits = formatted.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setRua(data.logradouro ?? "");
        setBairro(data.bairro ?? "");
        setCidade(data.localidade ?? "");
        setEstado(data.uf ?? "");
      }
    } catch { /* ignora falha de rede */ }
    finally { setCepLoading(false); }
  }

  // Auto-salva a URL da logo imediatamente após o upload — o usuário
  // não precisa clicar "Salvar" para persistir a foto.
  async function handleLogoUpload(url: string | null) {
    setLogoUrl(url);
    await atualizarLogo(barId, url);
    router.refresh();
  }

  async function handleSubmit(fd: FormData) {
    setPending(true);
    setResult(null);
    fd.set("logo_url", logoUrl ?? "");
    const r = await atualizarPerfil(barId, fd);
    setResult(r);
    if (r && "ok" in r && r.ok) router.refresh();
    setPending(false);
  }

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <Building2 style={{ width: 14, height: 14, color: "var(--fg-subtle)" }} />
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", margin: 0 }}>
          Perfil do Bar
        </h3>
      </div>

      <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Logo — auto-salva ao fazer upload */}
        <div>
          <label style={lbl}>Logo</label>
          <ImageUpload
            currentUrl={logoUrl}
            bucket="bar-logos"
            onUpload={handleLogoUpload}
          />
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "8px 0 0" }}>
            A marca do bar. Aparece no cardápio que o cliente vê e no topo do seu painel.
          </p>
        </div>

        {/* Nome */}
        <div>
          <label style={lbl}>Nome do bar</label>
          <input name="nome" defaultValue={bar.nome} placeholder="Ex: Bar do João" style={inp} required />
        </div>

        {/* Telefone */}
        <div>
          <label style={lbl}>Telefone</label>
          <input name="telefone" defaultValue={bar.telefone ?? ""} placeholder="(11) 9 9999-9999" style={inp} />
        </div>

        {/* Endereço */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={lbl}>Endereço</label>

          {/* CEP primeiro — preenche os demais campos automaticamente */}
          <div style={{ position: "relative" }}>
            <input
              name="cep"
              value={cep}
              onChange={e => handleCepChange(e.target.value)}
              placeholder="CEP"
              style={inp}
            />
            {cepLoading && (
              <span style={{
                position: "absolute", right: 12, top: "50%",
                transform: "translateY(-50%)",
                fontSize: 11, color: "var(--fg-subtle)", pointerEvents: "none",
              }}>
                buscando…
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_90px] gap-2">
            <input name="rua" value={rua} onChange={e => setRua(e.target.value)} placeholder="Rua" style={inp} />
            <input name="numero" defaultValue={endereco.numero ?? ""} placeholder="Nº" style={inp} />
          </div>
          <input name="bairro" value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Bairro" style={inp} />
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_60px] gap-2">
            <input name="cidade" value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Cidade" style={inp} />
            <input name="estado" value={estado} onChange={e => setEstado(e.target.value)} placeholder="UF" maxLength={2} style={inp} />
          </div>
        </div>

        {/* Metas */}
        <div style={{ paddingTop: 8, borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Target style={{ width: 12, height: 12, color: "var(--fg-subtle)" }} />
            <span style={{ ...lbl, margin: 0 }}>Metas de faturamento</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label style={lbl}>Meta mensal (R$)</label>
              <input
                name="meta_mensal"
                defaultValue={bar.configuracoes?.meta_mensal ?? ""}
                placeholder="Ex: 30000"
                style={inp}
              />
            </div>
            <div>
              <label style={lbl}>Meta anual (R$)</label>
              <input
                name="meta_anual"
                defaultValue={bar.configuracoes?.meta_anual ?? ""}
                placeholder="Ex: 360000"
                style={inp}
              />
            </div>
          </div>
        </div>

        {result && <Feedback result={result} />}

        <button
          type="submit"
          disabled={pending}
          style={{
            alignSelf: "flex-start",
            background: "var(--accent)", color: "var(--accent-fg)",
            border: "none", borderRadius: 999,
            padding: "10px 24px", fontSize: 14, fontWeight: 500,
            cursor: pending ? "default" : "pointer",
            opacity: pending ? 0.7 : 1,
            transition: "filter 150ms, opacity 150ms",
          }}
          className="hover:brightness-110"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </form>
    </section>
  );
}
