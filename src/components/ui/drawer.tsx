'use client'

import { useEffect } from 'react'

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
        position: 'fixed', top: 0, right: 0, height: '100vh', width: '400px',
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
          <button onClick={onClose} style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: '8px', width: '32px', height: '32px', color: 'var(--fg-muted)', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>
        </div>

        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {type === 'suporte' ? <SuporteContent /> : <SugestaoContent onClose={onClose} />}
        </div>
      </div>
    </>
  )
}

function SuporteContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {[
        { title: 'Chat ao vivo', desc: 'Resposta em até 5 minutos', action: 'Iniciar chat' },
        { title: 'E-mail', desc: 'suporte@superbar.com.br', action: 'Enviar e-mail' },
        { title: 'Central de ajuda', desc: 'Documentação e tutoriais', action: 'Acessar' },
        { title: 'Agendar chamada', desc: '30 min com nossa equipe', action: 'Agendar' },
      ].map(item => (
        <div key={item.title} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <div>
            <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--fg)', marginBottom: '2px' }}>{item.title}</p>
            <p style={{ fontSize: '13px', color: 'var(--fg-muted)' }}>{item.desc}</p>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--accent)' }}>{item.action} →</span>
        </div>
      ))}
    </div>
  )
}

function SugestaoContent({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ fontSize: '13px', color: 'var(--fg-muted)', display: 'block', marginBottom: '8px' }}>Categoria</label>
        <select style={{ width: '100%', background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', color: 'var(--fg)', fontSize: '14px', outline: 'none', colorScheme: 'dark' }}>
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
        <textarea rows={5} placeholder="Descreva sua ideia..." style={{ width: '100%', background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', color: 'var(--fg)', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', colorScheme: 'dark' } as React.CSSProperties} />
      </div>
      <button
        onClick={onClose}
        style={{ alignSelf: 'flex-start', background: 'var(--accent)', border: 'none', borderRadius: 999, padding: '10px 24px', color: 'var(--accent-fg)', fontWeight: 500, fontSize: '14px', cursor: 'pointer' }}>
        Enviar sugestão
      </button>
    </div>
  )
}
