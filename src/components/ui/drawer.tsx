'use client'

import { useEffect, useState, useTransition } from 'react'
import { abrirChamado, enviarSugestao } from '@/lib/anotacoes/actions'

type DrawerType = 'suporte' | 'sugestao'

interface DrawerProps {
  open: boolean
  type: DrawerType
  onClose: () => void
}

export function Drawer({ open, type, onClose }: DrawerProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 }}
        />
      )}

      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100vh', width: '400px', maxWidth: '92vw',
        background: 'var(--bg-elevated)',
        borderLeft: '1px solid var(--border)',
        zIndex: 100,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--fg)', marginBottom: '4px' }}>
              {type === 'suporte' ? 'Suporte' : 'Enviar sugestão'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--fg-muted)' }}>
              {type === 'suporte' ? 'Como podemos ajudar?' : 'Sua ideia pode virar feature'}
            </p>
          </div>
          <button aria-label="Fechar" onClick={onClose} style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '8px', width: '32px', height: '32px', color: 'var(--fg-muted)', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>
        </div>

        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {type === 'suporte' ? <SuporteContent onClose={onClose} /> : <SugestaoContent onClose={onClose} />}
        </div>
      </div>
    </>
  )
}

// ─── Sucesso genérico ─────────────────────────────────────────────────────────
function Sucesso({ titulo, texto, onClose }: { titulo: string; texto: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center', padding: '24px 0' }}>
      <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ok)', margin: 0 }}>{titulo}</p>
      <p style={{ fontSize: '13px', color: 'var(--fg-muted)', margin: 0 }}>{texto}</p>
      <button onClick={onClose} style={{ alignSelf: 'center', marginTop: 8, background: 'var(--bg-hover)', border: '1px solid var(--border-strong)', borderRadius: 999, padding: '9px 22px', color: 'var(--fg)', fontSize: '14px', cursor: 'pointer' }}>
        Fechar
      </button>
    </div>
  )
}

const inp: React.CSSProperties = {
  width: '100%', background: 'var(--bg-hover)', border: '1px solid var(--border)',
  borderRadius: '8px', padding: '12px 14px', color: 'var(--fg)', fontSize: '14px',
  outline: 'none', colorScheme: 'dark', boxSizing: 'border-box',
}

// ─── Suporte ──────────────────────────────────────────────────────────────────
function SuporteContent({ onClose }: { onClose: () => void }) {
  const [modo, setModo] = useState<'menu' | 'chamado'>('menu')
  const [titulo, setTitulo] = useState('')
  const [corpo, setCorpo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)
  const [pending, start] = useTransition()

  function enviar() {
    setErro(null)
    start(async () => {
      const r = await abrirChamado({ titulo, corpo })
      if ('error' in r) setErro(r.error)
      else setEnviado(true)
    })
  }

  if (enviado) return <Sucesso titulo="Chamado aberto!" texto="Nossa equipe vai responder em breve." onClose={onClose} />

  if (modo === 'chamado') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button onClick={() => setModo('menu')} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--fg-muted)', fontSize: '13px', cursor: 'pointer', padding: 0 }}>← Voltar</button>
        <div>
          <label style={{ fontSize: '13px', color: 'var(--fg-muted)', display: 'block', marginBottom: '8px' }}>Assunto (opcional)</label>
          <input style={inp} placeholder="Ex: Erro ao fechar comanda" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: '13px', color: 'var(--fg-muted)', display: 'block', marginBottom: '8px' }}>O que está acontecendo?</label>
          <textarea rows={5} placeholder="Descreva o problema..." value={corpo} onChange={(e) => setCorpo(e.target.value)} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' } as React.CSSProperties} />
        </div>
        {erro && <span style={{ fontSize: '13px', color: 'var(--danger)' }}>{erro}</span>}
        <button
          onClick={enviar}
          disabled={pending || !corpo.trim()}
          style={{ alignSelf: 'flex-start', background: 'var(--accent)', border: 'none', borderRadius: 999, padding: '10px 24px', color: 'var(--accent-fg)', fontWeight: 500, fontSize: '14px', cursor: pending || !corpo.trim() ? 'default' : 'pointer', opacity: !corpo.trim() ? 0.5 : 1 }}>
          {pending ? 'Enviando...' : 'Abrir chamado'}
        </button>
      </div>
    )
  }

  const cards = [
    { title: 'Abrir chamado', desc: 'Fale com o suporte sobre um problema', action: 'Abrir →', onClick: () => setModo('chamado'), disabled: false },
    { title: 'Central de ajuda', desc: 'Documentação e tutoriais', action: 'Em breve', onClick: undefined, disabled: true },
    { title: 'Agendar chamada', desc: '30 min com nossa equipe', action: 'Em breve', onClick: undefined, disabled: true },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {cards.map(item => (
        <div
          key={item.title}
          onClick={item.onClick}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px',
            padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: item.disabled ? 'default' : 'pointer', opacity: item.disabled ? 0.55 : 1,
          }}
        >
          <div>
            <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--fg)', marginBottom: '2px' }}>{item.title}</p>
            <p style={{ fontSize: '13px', color: 'var(--fg-muted)' }}>{item.desc}</p>
          </div>
          <span style={{ fontSize: '13px', color: item.disabled ? 'var(--fg-subtle)' : 'var(--accent)' }}>{item.action}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Sugestão ─────────────────────────────────────────────────────────────────
function SugestaoContent({ onClose }: { onClose: () => void }) {
  const [categoria, setCategoria] = useState('')
  const [corpo, setCorpo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)
  const [pending, start] = useTransition()

  function enviar() {
    setErro(null)
    start(async () => {
      const r = await enviarSugestao({ categoria, corpo })
      if ('error' in r) setErro(r.error)
      else setEnviado(true)
    })
  }

  if (enviado) return <Sucesso titulo="Sugestão enviada!" texto="Obrigado — sua ideia foi registrada." onClose={onClose} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ fontSize: '13px', color: 'var(--fg-muted)', display: 'block', marginBottom: '8px' }}>Categoria</label>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={{ ...inp } as React.CSSProperties}>
          <option value="">Selecione...</option>
          <option>Nova funcionalidade</option>
          <option>Melhoria existente</option>
          <option>Integrações</option>
          <option>Interface / UX</option>
          <option>Outro</option>
        </select>
      </div>
      <div>
        <label style={{ fontSize: '13px', color: 'var(--fg-muted)', display: 'block', marginBottom: '8px' }}>Sua sugestão</label>
        <textarea rows={5} placeholder="Descreva a sua ideia..." value={corpo} onChange={(e) => setCorpo(e.target.value)} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' } as React.CSSProperties} />
      </div>
      {erro && <span style={{ fontSize: '13px', color: 'var(--danger)' }}>{erro}</span>}
      <button
        onClick={enviar}
        disabled={pending || !corpo.trim()}
        style={{ alignSelf: 'flex-start', background: 'var(--accent)', border: 'none', borderRadius: 999, padding: '10px 24px', color: 'var(--accent-fg)', fontWeight: 500, fontSize: '14px', cursor: pending || !corpo.trim() ? 'default' : 'pointer', opacity: !corpo.trim() ? 0.5 : 1 }}>
        {pending ? 'Enviando...' : 'Enviar sugestão'}
      </button>
    </div>
  )
}
