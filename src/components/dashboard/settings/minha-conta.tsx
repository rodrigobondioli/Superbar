"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { ImageUpload } from "@/components/cardapio/image-upload";
import { atualizarConta, atualizarAvatar, type ActionResult } from "@/lib/settings/actions";
import { lbl, inp, inpReadonly, Feedback } from "./shared";

export function MinhaConta({
  userId, userNome, userEmail, userAvatarUrl,
}: {
  userId: string;
  userNome: string;
  userEmail: string;
  userAvatarUrl: string | null;
}) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(userAvatarUrl);
  const [result, setResult] = useState<ActionResult>(null);
  const [pending, setPending] = useState(false);

  // Auto-salva a URL do avatar imediatamente após o upload.
  async function handleAvatarUpload(url: string | null) {
    setAvatarUrl(url);
    await atualizarAvatar(userId, url);
    router.refresh();
  }

  async function handleSubmit(fd: FormData) {
    setPending(true);
    setResult(null);
    fd.set("avatar_url", avatarUrl ?? "");
    const r = await atualizarConta(userId, fd);
    setResult(r);
    if (r && "ok" in r && r.ok) router.refresh();
    setPending(false);
  }

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <User style={{ width: 14, height: 14, color: "var(--fg-subtle)" }} />
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", fontFamily: "var(--font-mono)", margin: 0 }}>
          Minha Conta
        </h3>
      </div>

      <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Avatar — auto-salva ao fazer upload */}
        <div>
          <label style={lbl}>Foto de perfil</label>
          <ImageUpload
            currentUrl={avatarUrl}
            bucket="avatars"
            onUpload={handleAvatarUpload}
          />
          <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "8px 0 0" }}>
            A sua foto. Aparece no painel e na seleção de operador do iPad — só para a equipe, nunca para o cliente.
          </p>
        </div>

        {/* Nome */}
        <div>
          <label style={lbl}>Nome</label>
          <input name="nome" defaultValue={userNome} placeholder="Seu nome" style={inp} required />
        </div>

        {/* E-mail — readonly */}
        <div>
          <label style={lbl}>E-mail</label>
          <input
            type="email" value={userEmail} readOnly
            style={inpReadonly}
            tabIndex={-1}
          />
          <p style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 4 }}>
            O e-mail é gerenciado pelo Supabase Auth e não pode ser alterado aqui.
          </p>
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
