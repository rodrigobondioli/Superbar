'use client'

import { useRef, useState } from 'react'

const SUGGESTIONS = [
  'Como está meu CMV agora?',
  'O que precisa da minha atenção?',
  'Qual produto mais vendeu hoje?',
  'Qual produto derrubou minha margem?',
  'Resumo do turno',
  'As cortesias estão fora do padrão?',
]

export function AiHeroInput({
  barId,
  alertCount,
}: {
  barId: string
  alertCount?: number
}) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function ask(q: string) {
    if (!q.trim()) return
    setQuestion(q)
    setLoading(true)
    setAnswer('')
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, barId }),
      })
      const data = await res.json()
      setAnswer(data.response)
    } catch {
      setAnswer('Erro ao consultar.')
    } finally {
      setLoading(false)
    }
  }

  const chipBase: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    padding: '3px 8px',
    color: "var(--fg-subtle)",
    fontSize: '11px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-mono)',
    transition: 'border-color 150ms, color 150ms',
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        background: "var(--bg-elevated)",
        borderRadius: 0,
        border: "1px solid var(--border-strong)",
        overflow: 'hidden',
      }}>

        {/* Chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
          <a
            href="/dashboard/inteligencia"
            style={{ ...chipBase, textDecoration: 'none', display: 'inline-flex' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--fg)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--fg-subtle)' }}
          >
            Ver análise →
          </a>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => ask(s)}
              style={chipBase}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--fg)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--fg-subtle)' }}
            >
              {s}
            </button>
          ))}
          {alertCount !== undefined && alertCount > 0 && (
            <button
              onClick={() => ask('O que precisa da minha atenção agora? Me dê o impacto em reais.')}
              style={{
                marginLeft: 'auto', fontSize: 10, fontFamily: 'var(--font-mono)',
                color: '#FF6600', background: 'none', border: 'none', cursor: 'pointer',
                padding: 0,
              }}
            >
              {alertCount} {alertCount === 1 ? 'ponto requer atenção' : 'pontos requerem atenção'}
            </button>
          )}
        </div>

        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', minHeight: '44px' }}>
          <input
            ref={inputRef}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask(question)}
            placeholder="Pergunte sobre margem, produtos, pagamentos ou gargalos…"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--fg)',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
            }}
          />
          <button
            onClick={() => ask(question)}
            disabled={loading}
            style={{
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '4px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <span style={{ color: '#FFFFFF', fontSize: '16px' }}>·</span>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Answer */}
      {(answer || loading) && (
        <div style={{
          marginTop: '8px',
          background: "transparent",
          borderRadius: 0,
          outline: "1px solid rgba(255,255,255,0.15)",
          padding: '14px 16px',
          fontSize: '13px',
          color: 'var(--fg)',
          fontFamily: 'var(--font-mono)',
          lineHeight: 1.7,
        }}>
          {loading ? (
            <span style={{ color: "var(--fg-subtle)" }}>Consultando dados do bar...</span>
          ) : answer}
        </div>
      )}
    </div>
  )
}
