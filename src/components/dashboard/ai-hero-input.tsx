'use client'

import { useRef, useState } from 'react'

const SUGGESTIONS_DEFAULT = [
  'Como está meu CMV agora?',
  'O que precisa da minha atenção?',
  'Qual produto mais vendeu hoje?',
  'Resumo do turno',
  'As cortesias estão fora do padrão?',
]

function buildSuggestions({
  cmvAlto,
  ticketCaindo,
  produtoSugerido,
}: {
  cmvAlto?: boolean;
  ticketCaindo?: boolean;
  produtoSugerido?: string | null;
}): string[] {
  const chips: string[] = []

  if (cmvAlto) {
    chips.push('Por que meu CMV subiu hoje?')
    chips.push('Qual produto está derrubando minha margem?')
  }

  if (ticketCaindo) {
    chips.push('Por que o ticket está caindo?')
    chips.push('O que a equipe deve sugerir agora?')
  }

  if (produtoSugerido) {
    chips.push(`Por que ${produtoSugerido} é a melhor opção agora?`)
  }

  if (!cmvAlto && !ticketCaindo) {
    chips.push('O que devo acompanhar nas próximas 2 horas?')
  }

  chips.push('Resumo do turno para o WhatsApp')

  for (const s of SUGGESTIONS_DEFAULT) {
    if (chips.length >= 5) break
    if (!chips.includes(s)) chips.push(s)
  }

  return chips.slice(0, 5)
}

export function AiHeroInput({
  barId,
  alertCount,
  cmvAlto,
  ticketCaindo,
  produtoSugerido,
}: {
  barId: string
  alertCount?: number
  cmvAlto?: boolean
  ticketCaindo?: boolean
  produtoSugerido?: string | null
}) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const suggestions = buildSuggestions({ cmvAlto, ticketCaindo, produtoSugerido })

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
      setAnswer('Erro ao consultar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      ask(question)
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setQuestion(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  const chipBase: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    padding: '4px 10px',
    color: 'var(--fg-subtle)',
    fontSize: '11px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-mono)',
    transition: 'border-color 120ms, color 120ms',
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
      }}>

        {/* Chips contextuais */}
        <div style={{
          display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => { setQuestion(s); setTimeout(() => ask(s), 0) }}
              style={chipBase}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--border-strong)'
                e.currentTarget.style.color = 'var(--fg)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--fg-subtle)'
              }}
            >
              {s}
            </button>
          ))}
          {alertCount !== undefined && alertCount > 0 && (
            <button
              onClick={() => {
                const q = 'O que precisa da minha atenção agora? Me dê o impacto em reais.'
                setQuestion(q)
                setTimeout(() => ask(q), 0)
              }}
              style={{
                marginLeft: 'auto', fontSize: 10, fontFamily: 'var(--font-mono)',
                color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, fontWeight: 700,
              }}
            >
              {alertCount} {alertCount === 1 ? 'ponto requer atenção' : 'pontos requerem atenção'}
            </button>
          )}
        </div>

        {/* Textarea + send */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, padding: '12px 16px' }}>
          <textarea
            ref={textareaRef}
            value={question}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ou pergunte com suas próprias palavras…"
            rows={2}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--fg)',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              lineHeight: 1.6,
              resize: 'none',
              minHeight: 48,
              maxHeight: 160,
              overflow: 'auto',
            }}
          />
          <button
            onClick={() => ask(question)}
            disabled={loading || !question.trim()}
            style={{
              background: question.trim() && !loading ? 'var(--accent)' : 'var(--border)',
              border: 'none',
              borderRadius: 8,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: question.trim() && !loading ? 'pointer' : 'default',
              flexShrink: 0,
              transition: 'background 150ms',
            }}
          >
            {loading ? (
              <span style={{ color: 'var(--fg-subtle)', fontSize: 18, lineHeight: 1 }}>·</span>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke={question.trim() ? '#000' : 'var(--fg-subtle)'}
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </div>

      </div>

      {/* Answer */}
      {(answer || loading) && (
        <div style={{
          marginTop: 8,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '16px 18px',
          fontSize: '14px',
          color: 'var(--fg)',
          fontFamily: 'var(--font-sans)',
          lineHeight: 1.7,
        }}>
          {loading ? (
            <span style={{ color: 'var(--fg-subtle)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              Consultando dados do bar…
            </span>
          ) : answer}
        </div>
      )}
    </div>
  )
}
