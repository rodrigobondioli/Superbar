"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, EyeOff, Eye, X, Check, ChevronDown, ChevronUp, ImageIcon, FileSpreadsheet, Loader2, FlaskConical } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { EmptyState, EmptyStateButton } from "@/components/ui/empty-state";
import { ImportarCardapioPanel } from "./importar-cardapio-panel";
import { FichaEditor } from "./ficha-editor";
import {
  criarCategoria,
  editarCategoria,
  desativarCategoria,
  criarProduto,
  editarProduto,
  toggleProduto,
  deletarProduto,
  criarVariante,
  editarVariante,
  deletarVariante,
} from "@/lib/cardapio/actions";
import { getImagemAutomatica } from "@/lib/cardapio/drink-images";
import { ImageUpload } from "./image-upload";
import type { CategoriaComProdutosAdmin } from "@/lib/cardapio/queries";
import type { ProdutoComVariantes, ProdutoVariante, CustoStatus } from "@/types/database";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// ─── Status da ficha (custo) ────────────────────────────────────────────────────
// verde = confirmada (margem real) · âmbar = estimativa (falta custo) · cinza = sem ficha
function statusFicha(p: ProdutoComVariantes): CustoStatus {
  const vs = (p.produto_variantes ?? []).filter(v => v.ativo);
  if (vs.length > 0) {
    if (vs.every(v => v.custo_status === "confirmada")) return "confirmada";
    if (vs.every(v => v.custo_status === "sem")) return "sem";
    return "sugerida"; // parcial/misto conta como estimativa
  }
  return p.custo_status;
}

const TITULO_FICHA: Record<CustoStatus, string> = {
  confirmada: "Custo confirmado — margem real",
  sugerida: "Custo estimado — falta preencher",
  sem: "Sem ficha — clique para preencher",
};

function fichaPill(status: CustoStatus, compact = false): React.CSSProperties {
  const cor: Record<CustoStatus, { bg: string; fg: string }> = {
    confirmada: { bg: "color-mix(in srgb, var(--ok) 15%, transparent)", fg: "var(--ok)" },
    sugerida:   { bg: "color-mix(in srgb, var(--warn) 15%, transparent)", fg: "var(--warn)" },
    sem:        { bg: "var(--bg-card-hi)", fg: "var(--fg-muted)" },
  };
  const c = cor[status];
  return {
    display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
    background: c.bg, border: "none", borderRadius: 999,
    padding: compact ? "5px 12px" : "7px 14px",
    color: c.fg, fontSize: compact ? 12 : 13, fontWeight: 500, cursor: "pointer",
  };
}

const input: React.CSSProperties = {
  background: "var(--bg-inset)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "9px 12px",
  fontSize: 13,
  color: "var(--fg)",
  outline: "none",
  colorScheme: "dark",
  width: "100%",
  boxSizing: "border-box",
};

const lbl: React.CSSProperties = {
  fontSize: 11,
  color: "var(--fg-subtle)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: 5,
  display: "block",
  fontWeight: 500,
};

const btnPrimary: React.CSSProperties = {
  background: "var(--accent)",
  color: "var(--accent-fg)",
  border: "none",
  borderRadius: 999,
  padding: "10px 24px",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  background: "transparent",
  color: "var(--fg)",
  border: "1px solid var(--border-strong)",
  borderRadius: 999,
  padding: "10px 24px",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const iconBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 6,
  borderRadius: 4,
  color: "var(--fg-subtle)",
};

// ─── Variante Form ────────────────────────────────────────────────────────────
function VarianteForm({
  produtoId,
  variante,
  onDone,
}: {
  produtoId: string;
  variante?: ProdutoVariante;
  onDone: () => void;
}) {
  const isEdit = !!variante;
  const [imagemUrl, setImagemUrl] = useState<string | null>(variante?.imagem_url ?? null);

  async function handleSubmit(fd: FormData) {
    fd.set("imagem_url", imagemUrl ?? "");
    if (isEdit) {
      await editarVariante(variante!.id, fd);
    } else {
      await criarVariante(produtoId, fd);
    }
    onDone();
  }

  return (
    <form action={handleSubmit} className="flex flex-wrap gap-2 mt-2 items-end">
      <div className="shrink-0">
        <ImageUpload currentUrl={variante?.imagem_url} onUpload={setImagemUrl} />
      </div>
      <div className="flex-1 min-w-[130px]">
        <label style={lbl}>Sabor / Variante</label>
        <input
          autoFocus
          name="nome"
          defaultValue={variante?.nome ?? ""}
          placeholder="Ex: Morango"
          style={input}
          required
        />
      </div>
      <div style={{ width: 90 }}>
        <label style={lbl}>Preço</label>
        <input
          name="preco"
          defaultValue={variante ? String(variante.preco) : ""}
          placeholder="0,00"
          style={input}
          required
        />
      </div>
      <div style={{ width: 90 }}>
        <label style={lbl}>Custo</label>
        <input
          name="custo"
          defaultValue={variante?.custo != null ? String(variante.custo) : ""}
          placeholder="0,00"
          style={input}
        />
      </div>
      <div className="flex gap-2 shrink-0">
        <button type="submit" style={{ ...btnPrimary, padding: "9px 14px" }}>
          {isEdit ? <Check style={{ width: 14, height: 14 }} /> : <Plus style={{ width: 14, height: 14 }} />}
        </button>
        <button type="button" onClick={onDone} style={{ ...btnSecondary, padding: "9px 14px" }}>
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </form>
  );
}

// ─── Variante Row ─────────────────────────────────────────────────────────────
function VarianteRow({ variante, produtoId, produtoNome }: { variante: ProdutoVariante; produtoId: string; produtoNome: string }) {
  const [editing, setEditing] = useState(false);
  const [deletando, setDeletando] = useState(false);
  const [fichaOpen, setFichaOpen] = useState(false);

  async function handleDeletar() {
    if (!window.confirm(`Deletar variante "${variante.nome}"?`)) return;
    setDeletando(true);
    try {
      await deletarVariante(variante.id);
      toast(`Variante "${variante.nome}" removida.`, "ok");
    } catch {
      toast("Erro ao deletar variante.", "error");
      setDeletando(false);
    }
  }

  if (editing) {
    return (
      <VarianteForm
        produtoId={produtoId}
        variante={variante}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="group flex items-center gap-2.5 rounded" style={{ padding: "6px 10px" }}>
      <div
        onClick={!variante.imagem_url ? () => setEditing(true) : undefined}
        title={!variante.imagem_url ? "Adicionar imagem" : undefined}
        style={{
          width: 48, height: 48, borderRadius: 4, flexShrink: 0,
          background: variante.imagem_url
            ? `url(${variante.imagem_url}) center/cover`
            : "var(--bg-inset)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: variante.imagem_url ? "default" : "pointer",
        }}>
        {!variante.imagem_url && <ImageIcon style={{ width: 16, height: 16, color: "var(--fg-subtle)" }} />}
      </div>
      <span style={{ flex: 1, fontSize: 13, color: "var(--fg)" }}>{variante.nome}</span>
      <span style={{ fontSize: 12, color: "var(--fg-muted)", fontVariantNumeric: "tabular-nums" }}>
        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(variante.preco)}
      </span>
      <button
        type="button"
        onClick={() => setFichaOpen(true)}
        style={fichaPill(variante.custo_status, true)}
        title={TITULO_FICHA[variante.custo_status]}
      >
        <FlaskConical style={{ width: 12, height: 12 }} />
        <span className="hidden sm:inline">Ficha</span>
      </button>
      <div className="flex gap-0.5 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-100">
        <button type="button" onClick={() => setEditing(true)} style={iconBtn} title="Editar">
          <Pencil style={{ width: 12, height: 12 }} />
        </button>
        <button
          type="button"
          disabled={deletando}
          onClick={handleDeletar}
          style={{ ...iconBtn, color: "var(--danger)", opacity: deletando ? 0.5 : 1 }}
          title="Deletar variante"
        >
          {deletando
            ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
            : <Trash2 style={{ width: 12, height: 12 }} />}
        </button>
      </div>

      <FichaEditor
        open={fichaOpen}
        onClose={() => setFichaOpen(false)}
        produtoId={produtoId}
        produtoNome={produtoNome}
        preco={variante.preco}
        varianteId={variante.id}
        varianteNome={variante.nome}
        sabor={variante.nome}
      />
    </div>
  );
}

// ─── Produto Form ─────────────────────────────────────────────────────────────
function ProdutoForm({
  categoriaId,
  produto,
  onDone,
}: {
  categoriaId: string;
  produto?: ProdutoComVariantes;
  onDone: () => void;
}) {
  const isEdit = !!produto;
  const [nome, setNome] = useState(produto?.nome ?? "");
  const [imagemUrl, setImagemUrl] = useState<string | null>(produto?.imagem_url ?? null);
  const autoImg = getImagemAutomatica(nome);

  async function handleSubmit(fd: FormData) {
    fd.set("imagem_url", imagemUrl ?? autoImg ?? "");
    if (isEdit) {
      await editarProduto(produto!.id, fd);
    } else {
      await criarProduto(fd);
    }
    onDone();
  }

  return (
    <div style={{
      background: "var(--bg-elevated)",
      border: "1px solid var(--border)",
      borderRadius: 4,
      padding: 16,
      marginBottom: 10,
    }}>
      <form action={handleSubmit}>
        <input type="hidden" name="categoria_id" value={categoriaId} />

        <div className="flex flex-wrap gap-3 mb-3">
          <div className="shrink-0">
            <label style={lbl}>Foto</label>
            <ImageUpload
              currentUrl={produto?.imagem_url}
              autoUrl={autoImg}
              onUpload={setImagemUrl}
            />
          </div>

          <div className="flex-1 min-w-[160px] flex flex-col gap-2">
            <div>
              <label style={lbl}>Nome</label>
              <input
                autoFocus={!isEdit}
                name="nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Caipirinha"
                style={input}
                required
              />
            </div>
            <div>
              <label style={lbl}>Preço (R$)</label>
              <input
                name="preco"
                defaultValue={produto ? String(produto.preco) : ""}
                placeholder="0,00"
                style={input}
                required
              />
            </div>
            <div>
              <label style={lbl}>Custo de produção (R$)</label>
              <input
                name="custo"
                defaultValue={produto?.custo != null ? String(produto.custo) : ""}
                placeholder="0,00"
                style={input}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Descrição (opcional)</label>
          <input
            name="descricao"
            defaultValue={produto?.descricao ?? ""}
            placeholder="Ex: Com limão taiti e cachaça artesanal"
            style={input}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" style={btnPrimary}>
            {isEdit ? "Salvar" : "Adicionar"}
          </button>
          <button type="button" onClick={onDone} style={btnSecondary}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}

// ─── Produto Row ──────────────────────────────────────────────────────────────
function ProdutoRow({
  produto,
  categoriaId,
}: {
  produto: ProdutoComVariantes;
  categoriaId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [variantesOpen, setVariantesOpen] = useState(false);
  const [addingVariante, setAddingVariante] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deletando, setDeletando] = useState(false);
  const [fichaOpen, setFichaOpen] = useState(false);

  const variantes = produto.produto_variantes ?? [];

  async function handleToggle() {
    if (toggling) return;
    setToggling(true);
    try {
      await toggleProduto(produto.id, produto.ativo);
      toast(produto.ativo ? `"${produto.nome}" desativado.` : `"${produto.nome}" ativado.`, "ok");
    } catch {
      toast("Erro ao alterar produto.", "error");
    } finally {
      setToggling(false);
    }
  }

  async function handleDeletar() {
    if (!window.confirm(`Deletar "${produto.nome}"?`)) return;
    setDeletando(true);
    try {
      await deletarProduto(produto.id);
      toast(`"${produto.nome}" deletado.`, "ok");
    } catch {
      toast("Erro ao deletar produto.", "error");
      setDeletando(false);
    }
  }

  if (editing) {
    return (
      <ProdutoForm
        categoriaId={categoriaId}
        produto={produto}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div style={{ marginBottom: 2 }}>
      <div
        className="group flex items-center gap-2.5"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: "14px 12px",
          borderRadius: variantesOpen ? "4px 4px 0 0" : 4,
          background: hovered || variantesOpen
            ? "color-mix(in srgb, var(--fg) 4%, transparent)"
            : "transparent",
          opacity: produto.ativo ? 1 : 0.45,
          transition: "background 0.1s",
        }}
      >
        {/* Thumb */}
        <div
          onClick={!produto.imagem_url ? () => setEditing(true) : undefined}
          title={!produto.imagem_url ? "Adicionar imagem" : undefined}
          style={{
            width: 80, height: 80, borderRadius: 8, flexShrink: 0,
            background: produto.imagem_url
              ? `url(${produto.imagem_url}) center/cover`
              : "var(--bg-card)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: produto.imagem_url ? "default" : "pointer",
          }}>
          {!produto.imagem_url && <ImageIcon style={{ width: 24, height: 24, color: "var(--fg-subtle)" }} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {produto.nome}
          </p>
          {produto.descricao && (
            <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {produto.descricao}
            </p>
          )}
        </div>

        {/* Chip de variantes */}
        <button
          type="button"
          onClick={() => { setVariantesOpen(v => !v); setAddingVariante(false); }}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            background: variantesOpen
              ? "color-mix(in srgb, var(--accent-bright) 16%, transparent)"
              : "color-mix(in srgb, var(--fg) 6%, transparent)",
            border: "none", borderRadius: 999, padding: "8px 16px",
            color: variantesOpen ? "var(--accent-bright)" : "var(--fg)",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <span className="hidden sm:inline">
            {variantes.length > 0
              ? `${variantes.length} variante${variantes.length > 1 ? "s" : ""}`
              : "Variantes"}
          </span>
          <span className="sm:hidden">
            {variantes.length > 0 ? variantes.length : "+"}
          </span>
          {variantesOpen
            ? <ChevronUp style={{ width: 11, height: 11 }} />
            : <ChevronDown style={{ width: 11, height: 11 }} />}
        </button>

        <span style={{ fontSize: 15, color: "var(--fg)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
          {currency.format(produto.preco)}
        </span>

        {/* Ficha — sempre visível (feature-chave). Com variantes, abre o painel
            (a ficha é por variante); sem variantes, abre o editor do produto. */}
        <button
          type="button"
          onClick={() => (variantes.length > 0 ? setVariantesOpen(true) : setFichaOpen(true))}
          style={fichaPill(statusFicha(produto))}
          title={TITULO_FICHA[statusFicha(produto)]}
        >
          <FlaskConical style={{ width: 13, height: 13 }} />
          <span className="hidden sm:inline">Ficha</span>
        </button>

        {/* Actions — always visible on mobile, hover-only on desktop */}
        <div className="flex gap-0.5 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-100">
          <button onClick={() => setEditing(true)} style={iconBtn} title="Editar">
            <Pencil style={{ width: 13, height: 13 }} />
          </button>
          <button
            type="button"
            disabled={toggling}
            onClick={handleToggle}
            style={{ ...iconBtn, color: produto.ativo ? "var(--fg-subtle)" : "var(--ok)", opacity: toggling ? 0.5 : 1 }}
            title={produto.ativo ? "Desativar" : "Ativar"}
          >
            {toggling
              ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />
              : produto.ativo
                ? <EyeOff style={{ width: 13, height: 13 }} />
                : <Eye style={{ width: 13, height: 13 }} />}
          </button>
          <button
            type="button"
            disabled={deletando}
            onClick={handleDeletar}
            style={{ ...iconBtn, color: "var(--danger)", opacity: deletando ? 0.5 : 1 }}
            title="Deletar produto"
          >
            {deletando
              ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />
              : <Trash2 style={{ width: 13, height: 13 }} />}
          </button>
        </div>
      </div>

      {/* Painel de variantes */}
      {variantesOpen && (
        <div style={{
          background: "color-mix(in srgb, var(--fg) 2%, transparent)",
          borderRadius: "0 0 4px 4px",
          padding: "8px 12px 12px",
          borderTop: "1px solid var(--border)",
        }}>
          {variantes.length === 0 && !addingVariante && (
            <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "4px 0 8px" }}>
              Nenhuma variante ainda. Adicione sabores, tamanhos ou tipos.
            </p>
          )}

          {variantes.map(v => (
            <VarianteRow key={v.id} variante={v} produtoId={produto.id} produtoNome={produto.nome} />
          ))}

          {addingVariante ? (
            <VarianteForm
              produtoId={produto.id}
              onDone={() => setAddingVariante(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setAddingVariante(true)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "none", border: "none", cursor: "pointer",
                color: "var(--accent-bright)", fontSize: 12,
                padding: "6px 0", marginTop: 2,
              }}
            >
              <Plus style={{ width: 12, height: 12 }} />
              Adicionar variante
            </button>
          )}
        </div>
      )}

      {variantes.length === 0 && (
        <FichaEditor
          open={fichaOpen}
          onClose={() => setFichaOpen(false)}
          produtoId={produto.id}
          produtoNome={produto.nome}
          preco={produto.preco}
        />
      )}
    </div>
  );
}

// ─── Categoria item ───────────────────────────────────────────────────────────
function CategoriaItem({
  grupo,
  selected,
  onSelect,
}: {
  grupo: CategoriaComProdutosAdmin;
  selected: boolean;
  onSelect: () => void;
}) {
  const [editingNome, setEditingNome] = useState(false);

  if (editingNome) {
    return (
      <form
        action={async (fd) => { await editarCategoria(grupo.categoria.id, fd); setEditingNome(false); }}
        className="shrink-0 lg:shrink px-2 py-1"
      >
        <input
          name="nome"
          defaultValue={grupo.categoria.nome}
          autoFocus
          style={{ ...input, fontSize: 13, padding: "6px 10px" }}
          onKeyDown={e => { if (e.key === "Escape") setEditingNome(false); }}
        />
        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
          <button type="submit" style={{ ...iconBtn, color: "var(--ok)" }}>
            <Check style={{ width: 13, height: 13 }} />
          </button>
          <button type="button" onClick={() => setEditingNome(false)} style={iconBtn}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>
      </form>
    );
  }

  return (
    <div
      onClick={onSelect}
      className="group shrink-0 lg:shrink flex items-center gap-2 cursor-pointer rounded transition-colors"
      style={{
        padding: "8px 12px",
        background: selected ? "color-mix(in srgb, var(--fg) 6%, transparent)" : "transparent",
      }}
    >
      <span style={{
        fontSize: 13,
        fontWeight: selected ? 500 : 400,
        color: selected ? "var(--fg)" : "var(--fg-muted)",
        whiteSpace: "nowrap",
      }}>
        {grupo.categoria.nome}
      </span>
      <span style={{ fontSize: 11, color: "var(--fg-subtle)", flexShrink: 0 }}>
        {grupo.produtos.length}
      </span>

      {/* Edit / delete — desktop only */}
      <div className="hidden lg:flex gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setEditingNome(true)}
          style={{ ...iconBtn, width: 22, height: 22, padding: 0, opacity: selected ? 0.7 : 0 }}
          title="Renomear"
        >
          <Pencil style={{ width: 11, height: 11 }} />
        </button>
        <form action={desativarCategoria.bind(null, grupo.categoria.id)}>
          <button
            type="submit"
            style={{ ...iconBtn, width: 22, height: 22, padding: 0, opacity: selected ? 0.7 : 0, color: "var(--danger)" }}
            title="Excluir categoria"
          >
            <Trash2 style={{ width: 11, height: 11 }} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export function CardapioClient({
  cardapio,
  barId,
}: {
  cardapio: CategoriaComProdutosAdmin[];
  barId: string;
}) {
  const [selectedId, setSelectedId] = useState(cardapio[0]?.categoria.id ?? "");
  const [addingProduto, setAddingProduto] = useState(false);
  const [addingCategoria, setAddingCategoria] = useState(false);
  const [importPanelOpen, setImportPanelOpen] = useState(false);

  const nomesExistentes = cardapio.flatMap((g) => g.produtos.map((p) => p.nome));

  const selectedGrupo = cardapio.find(g => g.categoria.id === selectedId);

  return (
    <div className="flex flex-col lg:h-full lg:overflow-hidden">

      {/* Page header — padrão Figma */}
      <div className="shrink-0" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", paddingBottom: 24, marginBottom: 24, borderBottom: "1px solid var(--border-strong)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 24, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.01em", margin: 0 }}>Cardápio</h1>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", margin: 0 }}>Gerencie categorias e produtos do seu bar.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {selectedGrupo && (
            <button
              onClick={() => setAddingProduto(p => !p)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--accent)", color: "var(--accent-fg)", border: "none", borderRadius: 999, padding: "10px 24px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
              className="hover:brightness-110"
            >
              <Plus style={{ width: 15, height: 15 }} />
              Novo produto
            </button>
          )}
          <button
            onClick={() => setImportPanelOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid var(--border-strong)", borderRadius: 999, padding: "10px 24px", color: "var(--fg)", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
          >
            <FileSpreadsheet style={{ width: 15, height: 15 }} />
            Importar cardápio
          </button>
        </div>
      </div>

      {/* Main content */}

      {/* ── Zero categorias: full-width empty state ── */}
      {cardapio.length === 0 && !addingCategoria && (
        <EmptyState
          icon="🍹"
          title="Seu cardápio está vazio"
          description="Crie categorias (ex: Drinks, Cervejas, Petiscos) e depois adicione os produtos com preços e custos."
          action={
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <EmptyStateButton onClick={() => setAddingCategoria(true)}>
                <Plus style={{ width: 13, height: 13 }} />
                Criar primeira categoria
              </EmptyStateButton>
              <button
                onClick={() => setImportPanelOpen(true)}
                style={{
                  background: "none", border: "none",
                  fontSize: 12, color: "var(--fg-subtle)", cursor: "pointer",
                  textDecoration: "underline", textUnderlineOffset: 3,
                }}
              >
                ou importe de um PDF/planilha
              </button>
            </div>
          }
        />
      )}

      {/* ── Form para criar primeira categoria (quando clicado no empty state) ── */}
      {cardapio.length === 0 && addingCategoria && (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 48 }}>
          <form
            action={async (fd) => { await criarCategoria(fd); setAddingCategoria(false); }}
            style={{ width: 280 }}
          >
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 12 }}>Nova categoria</p>
            <input
              autoFocus
              name="nome"
              placeholder="Ex: Drinks, Cervejas, Petiscos…"
              style={{ ...input, marginBottom: 10 }}
              onKeyDown={e => { if (e.key === "Escape") setAddingCategoria(false); }}
              required
            />
            <div style={{ display: "flex", gap: 6 }}>
              <button type="submit" style={{ ...btnPrimary, flex: 1, padding: "9px 0", fontSize: 13 }}>Criar</button>
              <button type="button" onClick={() => setAddingCategoria(false)} style={{ ...btnSecondary, padding: "9px 16px", fontSize: 13 }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className={`flex flex-col lg:flex-row flex-1 lg:min-h-0 lg:overflow-hidden${cardapio.length === 0 ? " hidden" : ""}`}>

        {/* ── Categories: horizontal scroll strip on mobile, vertical sidebar on desktop ── */}
        <div
          className="flex flex-row overflow-x-auto gap-1 pb-3 border-b lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:w-[240px] lg:border-b-0 lg:border-r lg:pr-4 lg:pb-4 shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="hidden lg:block shrink-0" style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-muted)", marginBottom: 16 }}>Categorias</p>

          {cardapio.map(grupo => (
            <CategoriaItem
              key={grupo.categoria.id}
              grupo={grupo}
              selected={selectedId === grupo.categoria.id}
              onSelect={() => { setSelectedId(grupo.categoria.id); setAddingProduto(false); }}
            />
          ))}

          {/* Nova categoria */}
          {addingCategoria ? (
            <form
              action={async (fd) => { await criarCategoria(fd); setAddingCategoria(false); }}
              className="shrink-0 lg:shrink px-2 py-1 mt-1"
            >
              <input
                autoFocus
                name="nome"
                placeholder="Nome da categoria"
                style={{ ...input, fontSize: 13, padding: "6px 10px", marginBottom: 6 }}
                onKeyDown={e => { if (e.key === "Escape") setAddingCategoria(false); }}
                required
              />
              <div style={{ display: "flex", gap: 4 }}>
                <button type="submit" style={{ ...btnPrimary, padding: "5px 12px", fontSize: 12 }}>Criar</button>
                <button type="button" onClick={() => setAddingCategoria(false)} style={{ ...btnSecondary, padding: "5px 12px", fontSize: 12 }}>×</button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAddingCategoria(true)}
              className="shrink-0 lg:w-full flex items-center gap-1.5 rounded"
              style={{
                padding: "8px 12px",
                background: "none", border: "none",
                color: "var(--fg-subtle)", fontSize: 13, cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <Plus style={{ width: 13, height: 13 }} />
              <span className="hidden lg:inline">Nova categoria</span>
              <span className="lg:hidden">+Cat</span>
            </button>
          )}
        </div>

        {/* ── Product list ── */}
        <div className="flex-1 pt-4 lg:pt-0 lg:pl-7 overflow-y-auto">
          {!selectedGrupo ? null : (
            <>
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 500, color: "var(--fg-muted)", margin: 0 }}>
                  {selectedGrupo.categoria.nome}
                </h2>
              </div>

              {addingProduto && (
                <ProdutoForm
                  categoriaId={selectedGrupo.categoria.id}
                  onDone={() => setAddingProduto(false)}
                />
              )}

              {selectedGrupo.produtos.length === 0 && !addingProduto ? (
                <EmptyState
                  icon="📋"
                  title="Nenhum produto nesta categoria"
                  description="Adicione produtos com preço e custo para calcular margem automaticamente."
                  fill={false}
                  action={
                    <EmptyStateButton variant="secondary" onClick={() => setAddingProduto(true)}>
                      <Plus style={{ width: 12, height: 12 }} />
                      Adicionar produto
                    </EmptyStateButton>
                  }
                />
              ) : (
                selectedGrupo.produtos.map(p => (
                  <ProdutoRow key={p.id} produto={p} categoriaId={selectedGrupo.categoria.id} />
                ))
              )}
            </>
          )}
        </div>
      </div> {/* fim grid duas colunas */}

      <ImportarCardapioPanel
        barId={barId}
        nomesExistentes={nomesExistentes}
        open={importPanelOpen}
        onClose={() => setImportPanelOpen(false)}
      />
    </div>
  );
}
