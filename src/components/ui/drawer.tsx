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
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 90,
          }}
        />
      )}

      {/* Drawer panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100vh', width: '400px',
        background: 'rgba(10,10,16,0.98)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(40px)',
        zIndex: 100,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding:'24px 24px 20px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h2 style={{ fontSize:'16px', fontWeight:500, color:'#ffffff', marginBottom:'2px' }}>
              {type === 'suporte' ? 'Suporte' : 'Enviar sugestão'}
            </h2>
            <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.38)' }}>
              {type === 'suporte' ? 'Como podemos ajudar?' : 'Sua ideia pode virar feature'}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'4px', width:'32px', height:'32px', color:'rgba(255,255,255,0.50)', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex:1, padding:'24px', overflowY:'auto' }}>
          {type === 'suporte' ? <SuporteContent /> : <SugestaoContent onClose={onClose} />}
        </div>
      </div>
    </>
  )
}

function SuporteContent() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
      {[
        { icon:'💬', title:'Chat ao vivo', desc:'Resposta em até 5 minutos', action:'Iniciar chat' },
        { icon:'📧', title:'E-mail', desc:'suporte@superbar.com.br', action:'Enviar e-mail' },
        { icon:'📖', title:'Central de ajuda', desc:'Documentação e tutoriais', action:'Acessar' },
        { icon:'🎥', title:'Agendar chamada', desc:'30 min com nossa equipe', action:'Agendar' },
      ].map(item => (
        <div key={item.title} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', padding:'16px', display:'flex', alignItems:'center', gap:'14px', cursor:'pointer' }}>
          <div style={{ width:'40px', height:'40px', borderRadius:'8px', background:'rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>
            {item.icon}
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:'14px', fontWeight:500, color:'rgba(255,255,255,0.90)', marginBottom:'2px' }}>{item.title}</p>
            <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)' }}>{item.desc}</p>
          </div>
          <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.38)', transition:'color 150ms' }}>{item.action} →</span>
        </div>
      ))}
    </div>
  )
}

function SugestaoContent({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
      <div>
        <label style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)', display:'block', marginBottom:'8px' }}>Categoria</label>
        <select style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'6px', padding:'10px 14px', color:'white', fontSize:'14px', outline:'none' }}>
          <option value="">Selecione...</option>
          <option>Nova funcionalidade</option>
          <option>Melhoria existente</option>
          <option>Integrações</option>
          <option>Interface / UX</option>
          <option>Outro</option>
        </select>
      </div>
      <div>
        <label style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)', display:'block', marginBottom:'8px' }}>Sua sugestão</label>
        <textarea rows={5} placeholder="Descreva sua ideia..." style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'6px', padding:'12px 14px', color:'white', fontSize:'14px', outline:'none', resize:'vertical', fontFamily:'inherit' }} />
      </div>
      <button
        onClick={onClose}
        style={{ background:'#260078', border:'none', borderRadius:'6px', padding:'12px 20px', color:'white', fontWeight:700, fontSize:'14px', cursor:'pointer', marginTop:'4px' }}>
        Enviar sugestão
      </button>
    </div>
  )
}
