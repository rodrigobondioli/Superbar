'use client'

import { useState } from 'react'

const SUGGESTIONS = [
  'Como está meu CMV?',
  'Top drinks hoje',
  'Resumo do turno',
]

export function AiHeroInput({ barId }: { barId: string }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto' }}>
      {/* Single card — input + chips */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px' }}>
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask(question)}
            placeholder="Pergunte ao Superbar..."
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--fg)',
              fontSize: '15px',
            }}
          />
          <button
            onClick={() => ask(question)}
            disabled={loading}
            style={{
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '4px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <span style={{ color: 'var(--accent-fg)', fontSize: '16px' }}>·</span>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-fg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            )}
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border)', margin: '0 20px' }} />

        {/* Chips row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '12px 20px',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--fg-subtle)', flexShrink: 0, marginRight: '4px' }}>
            Populares:
          </span>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => ask(s)}
              style={{
                background: 'var(--bg-inset)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '3px 12px',
                color: 'var(--fg-muted)',
                fontSize: '12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Answer */}
      {(answer || loading) && (
        <div style={{
          marginTop: '12px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '14px 20px',
          fontSize: '14px',
          color: 'var(--fg)',
          lineHeight: 1.6,
          textAlign: 'left',
        }}>
          {loading ? (
            <span style={{ color: 'var(--fg-subtle)' }}>Consultando dados do bar...</span>
          ) : answer}
        </div>
      )}

      <p style={{ marginTop: '12px', fontSize: '11px', color: 'var(--fg-subtle)', textAlign: 'center' }}>
        Powered by Superbar AI
      </p>
    </div>
  )
}
