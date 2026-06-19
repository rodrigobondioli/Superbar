import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const pct      = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

export async function POST(req: NextRequest) {
  try {
    const { question, barId } = await req.json() as { question?: string; barId?: string }

    if (!question?.trim() || !barId) {
      return NextResponse.json({ response: 'Pergunta inválida.' }, { status: 400 })
    }

    const supabase = await createClient()

    // ── 1. Nome do bar ────────────────────────────────────────────
    const { data: bar } = await supabase
      .from('bars')
      .select('nome')
      .eq('id', barId)
      .maybeSingle<{ nome: string }>()

    // ── 2. Turno ativo ────────────────────────────────────────────
    const { data: turno } = await supabase
      .from('turnos')
      .select('id, aberto_em, total_vendas, total_comandas')
      .eq('bar_id', barId)
      .eq('status', 'aberto')
      .maybeSingle<{ id: string; aberto_em: string; total_vendas: number; total_comandas: number }>()

    // ── 3. Detalhes do turno aberto ───────────────────────────────
    let comandasAbertas = 0
    let linhasTopProdutos: string[] = []
    let cmvInfo = 'custo não cadastrado'

    if (turno) {
      const [{ count }, { data: itens }] = await Promise.all([
        // Comandas ainda em aberto
        supabase
          .from('comandas')
          .select('id', { count: 'exact', head: true })
          .eq('turno_id', turno.id)
          .eq('status', 'aberta'),

        // Itens vendidos no turno com custo do produto
        supabase
          .from('comanda_items')
          .select('quantidade, preco_total, produto_id, produtos(nome, preco, custo), comandas!inner(turno_id)')
          .eq('bar_id', barId)
          .eq('status', 'ativo')
          .eq('comandas.turno_id', turno.id)
          .returns<Array<{
            quantidade: number
            preco_total: number
            produto_id: string
            produtos: { nome: string; preco: number; custo: number | null } | null
          }>>(),
      ])

      comandasAbertas = count ?? 0

      // Agrega por produto
      const porProduto = new Map<string, { nome: string; qtd: number; fat: number; preco: number; custo: number | null }>()
      for (const item of itens ?? []) {
        if (!item.produtos) continue
        const atual = porProduto.get(item.produto_id) ?? {
          nome: item.produtos.nome,
          qtd: 0,
          fat: 0,
          preco: item.produtos.preco,
          custo: item.produtos.custo,
        }
        atual.qtd += Number(item.quantidade)
        atual.fat += Number(item.preco_total)
        porProduto.set(item.produto_id, atual)
      }

      const produtos = [...porProduto.values()]

      // CMV — só produtos com custo cadastrado
      const comCusto = produtos.filter(p => p.custo != null)
      if (comCusto.length > 0) {
        const custoTotal = comCusto.reduce((acc, p) => acc + (p.custo as number) * p.qtd, 0)
        const fatTotal   = comCusto.reduce((acc, p) => acc + p.fat, 0)
        const cmv        = fatTotal > 0 ? (custoTotal / fatTotal) * 100 : null
        if (cmv !== null) {
          const parcial = comCusto.length < produtos.length ? ' (estimado — custo parcialmente cadastrado)' : ''
          cmvInfo = `${pct.format(cmv)}%${parcial}`
        }
      }

      // Top 5 — ordenados por margem quando disponível, senão por quantidade
      linhasTopProdutos = produtos
        .map(p => ({
          ...p,
          margem: p.custo != null ? ((p.preco - p.custo) / p.preco) * 100 : null,
        }))
        .sort((a, b) => {
          if (a.margem != null && b.margem != null) return b.margem - a.margem
          return b.qtd - a.qtd
        })
        .slice(0, 5)
        .map(p => {
          const margemStr = p.margem != null ? `, margem ${pct.format(p.margem)}%` : ''
          return `${p.nome}: ${p.qtd}x · ${currency.format(p.fat)}${margemStr}`
        })
    }

    // ── 4. Alertas de estoque ─────────────────────────────────────
    const { data: estoqueData } = await supabase
      .from('estoque')
      .select('quantidade_atual, quantidade_minima, produtos(nome)')
      .eq('bar_id', barId)
      .returns<Array<{ quantidade_atual: number; quantidade_minima: number; produtos: { nome: string } | null }>>()

    const alertas = (estoqueData ?? [])
      .filter(r => r.quantidade_atual < r.quantidade_minima)
      .map(r => r.produtos?.nome ?? 'produto')

    // ── 5. System prompt ──────────────────────────────────────────
    const nomeBar    = bar?.nome ?? 'o bar'
    const ticketMedio = turno && turno.total_comandas > 0
      ? turno.total_vendas / turno.total_comandas
      : 0

    const dadosTurno = turno
      ? [
          `• Faturamento do turno: ${currency.format(turno.total_vendas)}`,
          `• Ticket médio: ${currency.format(ticketMedio)}`,
          `• Comandas abertas agora: ${comandasAbertas}`,
          `• Total de comandas no turno: ${turno.total_comandas}`,
          `• CMV: ${cmvInfo}`,
          linhasTopProdutos.length > 0
            ? `• Top produtos (por margem):\n  ${linhasTopProdutos.join('\n  ')}`
            : '',
          alertas.length > 0
            ? `• Alertas de estoque: ${alertas.join(', ')}`
            : '• Estoque: sem alertas',
        ]
          .filter(Boolean)
          .join('\n')
      : 'Nenhum turno aberto no momento.'

    const systemPrompt = `Você é o assistente de inteligência do ${nomeBar}. Responda de forma direta e objetiva, como um sócio que conhece a operação. Use português do Brasil. Seja conciso (máximo 3 frases). Interprete os dados — não os repita crus.

Dados do turno atual:
${dadosTurno}`

    // ── 6. Anthropic SDK ──────────────────────────────────────────
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }],
    })

    const response =
      message.content[0].type === 'text'
        ? message.content[0].text
        : 'Não consegui processar.'

    return NextResponse.json({ response })
  } catch (error) {
    console.error('[AI chat] error:', error)
    return NextResponse.json(
      { response: 'Erro ao consultar a IA. Tente novamente.' },
      { status: 500 }
    )
  }
}
