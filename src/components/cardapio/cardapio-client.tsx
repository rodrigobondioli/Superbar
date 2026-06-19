"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, EyeOff, Eye, X, Check, ChevronDown, ChevronUp, ImageIcon } from "lucide-react";
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
import type { ProdutoComVariantes, ProdutoVariante } from "@/types/database";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  borderRadius: 4,
  padding: "9px 18px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const btnSecondary: React.CSSProperties = {
  background: "transparent",
  color: "var(--fg-muted)",
  border: "1px solid var(--border-strong)",
  borderRadius: 4,
  padding: "9px 18px",
  fontSize: 13,
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
    <form action={handleSubmit} style={{ display: "flex", gap: 10, alignItems: "flex-end", marginTop: 8 }}>
      {/* Foto */}
      <div style={{ flexShrink: 0 }}>
        <ImageUpload currentUrl={variante?.imagem_url} onUpload={setImagemUrl} />
      </div>
      {/* Nome */}
      <div style={{ flex: 1 }}>
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
      {/* Preço */}
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
      <button type="submit" style={{ ...btnPrimary, padding: "9px 14px" }}>
        {isEdit ? <Check style={{ width: 14, height: 14 }} /> : <Plus style={{ width: 14, height: 14 }} />}
      </button>
      <button type="button" onClick={onDone} style={{ ...btnSecondary, padding: "9px 14px" }}>
        <X style={{ width: 14, height: 14 }} />
      </button>
    </form>
  );
}

// ─── Variante Row ─────────────────────────────────────────────────────────────
function VarianteRow({ variante, produtoId }: { variante: ProdutoVariante; produtoId: string }) {
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);

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
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "6px 10px", borderRadius: 4,
        background: hovered ? "color-mix(in srgb, var(--fg) 4%, transparent)" : "transparent",
        transition: "background 0.1s",
      }}
    >
      {/* Foto */}
      <div style={{
        width: 32, height: 32, borderRadius: 4, flexShrink: 0,
        background: variante.imagem_url
          ? `url(${variante.imagem_url}) center/cover`
          : "var(--bg-inset)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {!variante.imagem_url && <ImageIcon style={{ width: 14, height: 14, color: "var(--fg-subtle)" }} />}
      </div>
      <span style={{ flex: 1, fontSize: 13, color: "var(--fg)" }}>{variante.nome}</span>
      <span style={{ fontSize: 12, color: "var(--fg-muted)", fontVariantNumeric: "tabular-nums" }}>
        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(variante.preco)}
      </span>
      <div style={{ display: "flex", gap: 2, opacity: hovered ? 1 : 0, transition: "opacity 0.1s" }}>
        <button type="button" onClick={() => setEditing(true)} style={iconBtn} title="Editar">
          <Pencil style={{ width: 12, height: 12 }} />
        </button>
        <form action={deletarVariante.bind(null, variante.id)}>
          <button
            type="submit"
            onClick={e => { if (!window.confirm(`Deletar variante "${variante.nome}"?`)) e.preventDefault(); }}
            style={{ ...iconBtn, color: "var(--danger)" }}
            title="Deletar variante"
          >
            <Trash2 style={{ width: 12, height: 12 }} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Produto Form (create or edit) ────────────────────────────────────────────
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

        <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
          {/* Image upload */}
          <div style={{ flexShrink: 0 }}>
            <label style={lbl}>Foto</label>
            <ImageUpload
              currentUrl={produto?.imagem_url}
              autoUrl={autoImg}
              onUpload={setImagemUrl}
            />
          </div>

          {/* Fields */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
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

// ─── Produto row ──────────────────────────────────────────────────────────────
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

  const variantes = produto.produto_variantes ?? [];

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
      {/* Linha principal */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 12px",
          borderRadius: variantesOpen ? "4px 4px 0 0" : 4,
          background: hovered || variantesOpen ? "color-mix(in srgb, var(--fg) 4%, transparent)" : "transparent",
          opacity: produto.ativo ? 1 : 0.45,
          transition: "background 0.1s",
        }}
      >
        {/* Thumb */}
        <div style={{
          width: 40, height: 40, borderRadius: 4, flexShrink: 0,
          background: produto.imagem_url
            ? `url(${produto.imagem_url}) center/cover`
            : "var(--bg-inset)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {!produto.imagem_url && <ImageIcon style={{ width: 16, height: 16, color: "var(--fg-subtle)" }} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {produto.nome}
          </p>
          {produto.descricao && (
            <p style={{ fontSize: 11, color: "var(--fg-subtle)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
            background: variantesOpen ? "color-mix(in srgb, var(--accent-bright) 16%, transparent)" : "color-mix(in srgb, var(--fg) 6%, transparent)",
            border: "none", borderRadius: 4, padding: "3px 9px",
            color: variantesOpen ? "var(--accent-bright)" : "var(--fg-muted)",
            fontSize: 11, fontWeight: 500, cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {variantes.length > 0 ? `${variantes.length} variante${variantes.length > 1 ? "s" : ""}` : "Variantes"}
          {variantesOpen
            ? <ChevronUp style={{ width: 11, height: 11 }} />
            : <ChevronDown style={{ width: 11, height: 11 }} />}
        </button>

        <span style={{ fontSize: 13, color: "var(--fg-muted)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
          {currency.format(produto.preco)}
        </span>

        {/* Actions — shown on hover */}
        <div style={{ display: "flex", gap: 2, flexShrink: 0, opacity: hovered ? 1 : 0, transition: "opacity 0.1s" }}>
          <button onClick={() => setEditing(true)} style={{ ...iconBtn }} title="Editar">
            <Pencil style={{ width: 13, height: 13 }} />
          </button>
          <form action={toggleProduto.bind(null, produto.id, produto.ativo)}>
            <button
              type="submit"
              style={{ ...iconBtn, color: produto.ativo ? "var(--fg-subtle)" : "var(--ok)" }}
              title={produto.ativo ? "Desativar" : "Ativar"}
            >
              {produto.ativo ? <EyeOff style={{ width: 13, height: 13 }} /> : <Eye style={{ width: 13, height: 13 }} />}
            </button>
          </form>
          <form action={deletarProduto.bind(null, produto.id)}>
            <button
              type="submit"
              onClick={e => { if (!window.confirm(`Deletar "${produto.nome}"?`)) e.preventDefault(); }}
              style={{ ...iconBtn, color: "var(--danger)" }}
              title="Deletar produto"
            >
              <Trash2 style={{ width: 13, height: 13 }} />
            </button>
          </form>
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
            <VarianteRow key={v.id} variante={v} produtoId={produto.id} />
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
    </div>
  );
}

// ─── Categoria sidebar item ───────────────────────────────────────────────────
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
        style={{ padding: "4px 8px" }}
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
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 4,
        cursor: "pointer",
        background: selected ? "color-mix(in srgb, var(--fg) 6%, transparent)" : "transparent",
        transition: "background 0.1s",
      }}
      className="group"
    >
      <span style={{
        flex: 1,
        fontSize: 13,
        fontWeight: selected ? 500 : 400,
        color: selected ? "var(--fg)" : "var(--fg-muted)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {grupo.categoria.nome}
      </span>
      <span style={{ fontSize: 11, color: "var(--fg-subtle)", flexShrink: 0 }}>
        {grupo.produtos.length}
      </span>

      {/* Hover actions */}
      <div style={{ display: "flex", gap: 1, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
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
export function CardapioClient({ cardapio }: { cardapio: CategoriaComProdutosAdmin[] }) {
  const [selectedId, setSelectedId] = useState(cardapio[0]?.categoria.id ?? "");
  const [addingProduto, setAddingProduto] = useState(false);
  const [addingCategoria, setAddingCategoria] = useState(false);

  const selectedGrupo = cardapio.find(g => g.categoria.id === selectedId);

  return (
    <div style={{ display: "flex", gap: 0, height: "100%", overflow: "hidden" }}>

      {/* ── Left: category list ── */}
      <div style={{
        width: 240,
        flexShrink: 0,
        borderRight: "1px solid var(--border)",
        paddingRight: 16,
        overflowY: "auto",
        paddingBottom: 16,
      }}>
        <p style={{ ...lbl, marginBottom: 12 }}>Categorias</p>

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
            style={{ padding: "4px 8px", marginTop: 4 }}
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
            style={{
              display: "flex", alignItems: "center", gap: 6,
              width: "100%", padding: "8px 12px", marginTop: 4,
              background: "none", border: "none",
              color: "var(--fg-subtle)", fontSize: 13, cursor: "pointer",
              borderRadius: 4,
            }}
          >
            <Plus style={{ width: 13, height: 13 }} />
            Nova categoria
          </button>
        )}
      </div>

      {/* ── Right: product list ── */}
      <div style={{ flex: 1, paddingLeft: 28, overflowY: "auto" }}>
        {!selectedGrupo ? (
          <p style={{ fontSize: 14, color: "var(--fg-subtle)", paddingTop: 20 }}>
            Selecione uma categoria.
          </p>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)", margin: 0, fontFamily: "var(--font-mono)" }}>
                {selectedGrupo.categoria.nome}
              </h2>
              <button
                onClick={() => setAddingProduto(p => !p)}
                style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6, padding: "7px 14px" }}
              >
                <Plus style={{ width: 14, height: 14 }} />
                Novo produto
              </button>
            </div>

            {/* New product form */}
            {addingProduto && (
              <ProdutoForm
                categoriaId={selectedGrupo.categoria.id}
                onDone={() => setAddingProduto(false)}
              />
            )}

            {/* Product list */}
            {selectedGrupo.produtos.length === 0 && !addingProduto ? (
              <p style={{ fontSize: 13, color: "var(--fg-subtle)", paddingTop: 8 }}>
                Nenhum produto nesta categoria ainda.
              </p>
            ) : (
              selectedGrupo.produtos.map(p => (
                <ProdutoRow key={p.id} produto={p} categoriaId={selectedGrupo.categoria.id} />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
