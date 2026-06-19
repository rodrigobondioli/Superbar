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
            <h2 style={{ fontSize: '15px', fontWeight: 500, color: 'var(--fg)', marginBottom: '2px', fontFamily: 'var(--font-mono)' }}>
              {type === 'suporte' ? 'Suporte' : 'Enviar sugestão'}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--fg-subtle)' }}>
              {type === 'suporte' ? 'Como podemos ajudar?' : 'Sua ideia pode virar feature'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: '4px', width: '32px', height: '32px', color: 'var(--fg-muted)', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        <div key={item.title} style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: '4px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--fg)', marginBottom: '2px' }}>{item.title}</p>
            <p style={{ fontSize: '12px', color: 'var(--fg-subtle)' }}>{item.desc}</p>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--fg-subtle)' }}>{item.action} →</span>
        </div>
      ))}
    </div>
  )
}

function SugestaoContent({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>Categoria</label>
        <select style={{ width: '100%', background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: '4px', padding: '10px 14px', color: 'var(--fg)', fontSize: '13px', outline: 'none', colorScheme: 'dark' }}>
          <option value="">Selecione...</option>
          <option>Nova funcionalidade</option>
          <option>Melhoria existente</option>
          <option>Integrações</option>
          <option>Interface / UX</option>
          <option>Outro</option>
        </select>
      </div>
      <div>
        <label style={{ fontSize: '11px', color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>Sua sugestão</label>
        <textarea rows={5} placeholder="Descreva sua ideia..." style={{ width: '100%', background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: '4px', padding: '12px 14px', color: 'var(--fg)', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', colorScheme: 'dark' } as React.CSSProperties} />
      </div>
      <button
        onClick={onClose}
        style={{ background: 'var(--accent)', border: 'none', borderRadius: '4px', padding: '12px 20px', color: 'var(--accent-fg)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
        Enviar sugestão
      </button>
    </div>
  )
}
