"use client";

import { useRef, useState } from "react";
import { ImageIcon, X, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ImageUploadProps {
  currentUrl?: string | null;
  autoUrl?: string | null;    // from drink library
  bucket?: string;            // default: "product-images"
  onUpload: (url: string | null) => void;
  compact?: boolean;          // thumbnail clicável (lista de categorias)
  size?: number;              // tamanho do thumb no modo compacto (px)
}

export function ImageUpload({ currentUrl, autoUrl, bucket = "product-images", onUpload, compact = false, size = 34 }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [autoFailed, setAutoFailed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = preview ?? (!autoFailed ? autoUrl : null) ?? null;
  const isAuto = !preview && !!autoUrl && !autoFailed;

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Apenas imagens são aceitas.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Arquivo muito grande (máx 5MB).");
      return;
    }

    setError(null);
    setUploading(true);

    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: false });

    if (upErr) {
      console.error("[image-upload] storage error:", upErr);
      setError(`Erro: ${upErr.message}`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    setPreview(data.publicUrl);
    onUpload(data.publicUrl);
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    setPreview(null);
    onUpload(autoUrl ?? null);
  }

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          title={displayUrl ? "Trocar foto" : "Adicionar foto"}
          style={{
            width: size, height: size, borderRadius: 8, flexShrink: 0, padding: 0,
            border: displayUrl ? "1px solid var(--border)" : "1.5px dashed var(--border)",
            background: displayUrl ? `url(${displayUrl}) center/cover` : "color-mix(in srgb, var(--fg) 4%, transparent)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {uploading
            ? <span style={{ fontSize: 9, color: "var(--fg-subtle)" }}>…</span>
            : (!displayUrl && <ImageIcon style={{ width: Math.round(size * 0.45), height: Math.round(size * 0.45), color: "var(--fg-subtle)" }} />)}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </>
    );
  }

  return (
    <div>
      {displayUrl ? (
        /* Preview */
        <div style={{ position: "relative", width: 80, height: 80 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayUrl}
            alt="Preview"
            onError={() => {
              if (isAuto) { setAutoFailed(true); }
              else { setPreview(null); onUpload(null); }
            }}
            style={{ width: 80, height: 80, borderRadius: 8, objectFit: "cover", display: "block" }}
          />
          {isAuto && (
            <div style={{
              position: "absolute", bottom: 4, left: 4,
              background: "color-mix(in srgb, var(--accent) 85%, transparent)",
              borderRadius: 8, padding: "2px 5px",
              display: "flex", alignItems: "center", gap: 3,
            }}>
              <Sparkles style={{ width: 9, height: 9, color: "var(--accent-bright)" }} />
              <span style={{ fontSize: 9, color: "var(--accent-bright)", fontWeight: 500 }}>auto</span>
            </div>
          )}
          {!isAuto && (
            <button
              type="button"
              onClick={handleRemove}
              style={{
                position: "absolute", top: -6, right: -6,
                width: 20, height: 20, borderRadius: "50%",
                background: "var(--bg-elevated)", border: "1px solid var(--border)",
                color: "var(--fg-muted)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X style={{ width: 10, height: 10 }} />
            </button>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{
              position: "absolute", bottom: 4, right: 4,
              background: "var(--bg-inset)", border: "none", borderRadius: 8,
              color: "var(--fg-muted)", cursor: "pointer", padding: "3px 5px",
              fontSize: 10,
            }}
          >
            Trocar
          </button>
        </div>
      ) : (
        /* Upload zone */
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          style={{
            width: 80, height: 80, borderRadius: 8,
            border: "1.5px dashed var(--border)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 6, cursor: "pointer",
            background: uploading
              ? "color-mix(in srgb, var(--accent-bright) 12%, transparent)"
              : "color-mix(in srgb, var(--fg) 4%, transparent)",
            transition: "background 0.15s",
            position: "relative",
          }}
        >
          {uploading ? (
            <span style={{ fontSize: 10, color: "var(--fg-subtle)" }}>Enviando…</span>
          ) : (
            <ImageIcon style={{ width: 24, height: 24, color: "var(--fg-subtle)" }} />
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {/* danger token allowed here as file input error feedback */}
      {error && (
        <p style={{ fontSize: 11, color: "var(--danger)", marginTop: 4 }}>{error}</p>
      )}
    </div>
  );
}
