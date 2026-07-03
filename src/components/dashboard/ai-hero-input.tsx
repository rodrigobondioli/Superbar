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
  cmvAlto?: boolean
  ticketCaindo?: boolean
  produtoSugerido?: string | null
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
  if (produtoSugerido) chips.push(`Por que ${produtoSugerido} é a melhor opção agora?`)
  if (!cmvAlto && !ticketCaindo) chips.push('O que devo acompanhar nas próximas 2 horas?')
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
  fill = false,
}: {
  barId: string
  alertCount?: number
  cmvAlto?: boolean
  ticketCaindo?: boolean
  produtoSugerido?: string | null
  fill?: boolean
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

  return (
    <div style={{ width: '100%', ...(fill ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } : {}) }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...(fill ? { flex: 1, justifyContent: 'space-between' } : {}),
      }}>

        {/* Input (topo) */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, padding: '18px 20px 12px' }}>
          <textarea
            ref={textareaRef}
            value={question}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ex: Qual foi a bebida mais vendida ontem?"
            rows={1}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--fg)',
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              lineHeight: 1.6,
              resize: 'none',
              minHeight: 32,
              maxHeight: 120,
              overflow: 'auto',
            }}
          />
          <button
            onClick={() => ask(question)}
            disabled={loading || !question.trim()}
            style={{
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 9999,
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: question.trim() && !loading ? 'pointer' : 'default',
              flexShrink: 0,
              transition: 'background 150ms',
            }}
          >
            {loading ? (
              <span style={{ color: 'var(--accent-fg)', fontSize: 14, lineHeight: 1, fontWeight: 700 }}>·</span>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="var(--accent-fg)"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </div>

        {/* Populares (rodapé) */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: '0 20px 18px' }}>
          <span style={{ fontSize: 13, color: 'var(--fg-subtle)', flexShrink: 0 }}>Populares:</span>
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => { setQuestion(s); setTimeout(() => ask(s), 0) }}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 9999,
                padding: '6px 14px',
                color: 'var(--fg-subtle)',
                fontSize: 12,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'border-color 120ms, color 120ms',
                lineHeight: 1.5,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
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
        </div>
      </div>

      {/* Answer */}
      {(answer || loading) && (
        <div style={{
          marginTop: 8,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
          fontSize: 14,
          color: 'var(--fg)',
          fontFamily: 'var(--font-sans)',
          lineHeight: 1.7,
        }}>
          {loading ? (
            <span style={{ color: 'var(--fg-subtle)', fontSize: 13 }}>
              Consultando dados do bar…
            </span>
          ) : answer}
        </div>
      )}
    </div>
  )
}
