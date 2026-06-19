"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import type { AlertaEstoque } from "@/lib/dashboard/queries";

interface AlertasBellProps {
  alertas: AlertaEstoque[];
}

export function AlertasBell({ alertas }: AlertasBellProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', zIndex: 100 }}>
      <button
        type="button"
        title="Alertas de estoque"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center transition duration-150 active:scale-[0.97]"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "4px",
          border: "1px solid var(--border)",
          background: "transparent",
          color: "var(--fg-muted)",
        }}
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} />
        {alertas.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-sm bg-danger px-1 text-[10px] font-semibold text-fg">
            {alertas.length}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '46px',
          right: '0',
          width: '360px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          overflow: 'hidden',
          zIndex: 100,
        }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:`1px solid var(--border)` }}>
            <span style={{ fontSize:'14px', fontWeight:500, color:'var(--fg)' }}>Notificações</span>
            <button style={{ background:'none', border:'none', color:'var(--fg-subtle)', fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
              ✓ Marcar todas
            </button>
          </div>

          {/* Items */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>

            {/* Stock alerts from real data */}
            {alertas.map((alerta, i) => (
              <div key={i} style={{ display:'flex', gap:'14px', padding:'14px 20px', borderBottom:`1px solid var(--border)`, alignItems:'flex-start' }}>
                <div style={{ width:'34px', height:'34px', borderRadius:'4px', background:'var(--bg-inset)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:'16px', color:'var(--fg-muted)' }}>⚠</span>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:'13px', fontWeight:500, color:'var(--fg)', marginBottom:'3px' }}>Estoque baixo</p>
                  <p style={{ fontSize:'12px', color:'var(--fg-muted)', lineHeight:1.4 }}>
                    {alerta.produtoNome} está abaixo do mínimo ({alerta.quantidadeAtual} / mín. {alerta.quantidadeMinima})
                  </p>
                  <p style={{ fontSize:'11px', color:'var(--fg-subtle)', marginTop:'4px' }}>Agora</p>
                </div>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'var(--danger)', flexShrink:0, marginTop:'4px' }} />
              </div>
            ))}

            {alertas.length === 0 && (
              <p style={{ fontSize:'13px', color:'var(--fg-muted)', padding:'20px', textAlign:'center' }}>Nenhum alerta no momento.</p>
            )}

            {/* Static example notifications */}
            {[
              { title: 'Turno fechado com sucesso', desc: 'O turno de ontem foi encerrado. Faturamento: R$ 1.240,00', time: '2h atrás' },
              { title: 'Novo produto vendido', desc: 'Caipirinha de Maracujá vendida pela 1ª vez hoje', time: '4h atrás' },
              { title: 'Insight da IA', desc: 'Gin Tônica está com margem 12% acima da média — considere destacá-lo', time: 'Ontem' },
            ].map((n, i) => (
              <div key={i} style={{ display:'flex', gap:'14px', padding:'14px 20px', borderBottom:`1px solid var(--border)`, alignItems:'flex-start' }}>
                <div style={{ width:'34px', height:'34px', borderRadius:'4px', background:'var(--bg-inset)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'16px', color: 'var(--fg-muted)' }}>
                  —
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:'13px', fontWeight:500, color:'var(--fg)', marginBottom:'3px' }}>{n.title}</p>
                  <p style={{ fontSize:'12px', color:'var(--fg-muted)', lineHeight:1.4 }}>{n.desc}</p>
                  <p style={{ fontSize:'11px', color:'var(--fg-subtle)', marginTop:'4px' }}>{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
