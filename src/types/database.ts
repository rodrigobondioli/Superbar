export type BarRole = "dono" | "gerente" | "bar_manager" | "bartender" | "garcom" | "caixa";

export type ComandaStatus =
  | "aberta"
  | "aguardando_pagamento"
  | "paga"
  | "cancelada";

export type ComandaItemStatus = "ativo" | "cancelado";

export type PagamentoMetodo =
  | "pix"
  | "credito"
  | "debito"
  | "dinheiro"
  | "cortesia";

export type PagamentoStatus = "pendente" | "confirmado" | "estornado";

export type TurnoStatus = "aberto" | "fechado";

export type MovimentoTipo = "venda" | "compra" | "ajuste" | "perda" | "devolucao";

export type CompraStatus = "pendente" | "recebida" | "cancelada";

export type AssinaturaStatus = "trial" | "ativa" | "cancelada" | "inadimplente";

export type EstoqueUnidade = "un" | "ml" | "l" | "g" | "kg";

export interface Profile {
  id: string;
  nome: string;
  email: string;
  avatar_url: string | null;
  telefone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Plano {
  id: string;
  nome: string;
  slug: string;
  preco_mensal: number;
  max_usuarios: number;
  max_mesas: number;
  features: { relatorios?: boolean; ia?: boolean; estoque_avancado?: boolean };
  ativo: boolean;
  created_at: string;
}

export interface Bar {
  id: string;
  nome: string;
  slug: string;
  cnpj: string | null;
  telefone: string | null;
  endereco: {
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  } | null;
  logo_url: string | null;
  configuracoes: {
    fuso_horario?: string;
    alerta_turno_horas?: number;
    moeda?: string;
    meta_mensal?: number;
    meta_anual?: number;
  };
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Assinatura {
  id: string;
  bar_id: string;
  plano_id: string;
  status: AssinaturaStatus;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  periodo_inicio: string;
  periodo_fim: string | null;
  trial_fim: string | null;
  created_at: string;
  updated_at: string;
}

export interface BarMember {
  id: string;
  bar_id: string;
  user_id: string;
  role: BarRole;
  nome: string | null;
  ativo: boolean;
  convidado_por: string | null;
  created_at: string;
}

export interface Mesa {
  id: string;
  bar_id: string;
  numero: number;
  nome: string | null;
  capacidade: number | null;
  ativo: boolean;
  created_at: string;
}

export interface Categoria {
  id: string;
  bar_id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
}

export interface Produto {
  id: string;
  bar_id: string;
  categoria_id: string | null;
  nome: string;
  descricao: string | null;
  preco: number;
  custo: number | null;
  imagem_url: string | null;
  ativo: boolean;
  controla_estoque: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProdutoVariante {
  id: string;
  produto_id: string;
  nome: string;
  preco: number;
  custo: number | null;
  imagem_url: string | null;
  ativo: boolean;
  ordem: number;
  created_at: string;
}

/** Produto com variantes já carregadas (usado no admin e no bartender) */
export interface ProdutoComVariantes extends Produto {
  produto_variantes: ProdutoVariante[];
}

export interface Fornecedor {
  id: string;
  bar_id: string;
  nome: string;
  cnpj: string | null;
  contato: string | null;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
  created_at: string;
}

export interface Estoque {
  id: string;
  bar_id: string;
  produto_id: string;
  quantidade_atual: number;
  quantidade_minima: number;
  unidade: EstoqueUnidade;
  updated_at: string;
}

export interface Compra {
  id: string;
  bar_id: string;
  fornecedor_id: string | null;
  status: CompraStatus;
  total: number;
  nota_fiscal: string | null;
  observacoes: string | null;
  data_pedido: string;
  data_recebimento: string | null;
  criado_por: string;
  created_at: string;
}

export interface CompraItem {
  id: string;
  compra_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  created_at: string;
}

export interface Turno {
  id: string;
  bar_id: string;
  status: TurnoStatus;
  abertura_por: string;
  fechamento_por: string | null;
  aberto_em: string;
  fechado_em: string | null;
  total_vendas: number;
  total_comandas: number;
  observacoes: string | null;
  created_at: string;
}

export interface Comanda {
  id: string;
  bar_id: string;
  turno_id: string;
  mesa_id: string | null;
  bartender_id: string;
  identificador: string | null;
  status: ComandaStatus;
  total: number;
  total_pessoas: number | null;
  aberta_em: string;
  fechada_em: string | null;
  created_at: string;
}

export interface ComandaItem {
  id: string;
  comanda_id: string;
  bar_id: string;
  produto_id: string;
  variante_id: string | null;
  variante_nome: string | null;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  observacao: string | null;
  status: ComandaItemStatus;
  adicionado_por: string;
  cancelado_por: string | null;
  adicionado_em: string;
  cancelado_em: string | null;
  created_at: string;
}

export interface Pagamento {
  id: string;
  comanda_id: string;
  bar_id: string;
  turno_id: string;
  valor: number;               // total BASE da comanda (sem taxa de serviço)
  taxa_servico_pct: number | null;   // ex: 10 (= 10%) — null se não cobrado
  taxa_servico_valor: number | null; // valor em R$ da taxa — null se não cobrado
  metodo: PagamentoMetodo;
  status: PagamentoStatus;
  referencia: string | null;
  processado_por: string;
  processado_em: string;
  estornado_por: string | null;
  estornado_em: string | null;
  created_at: string;
}

export interface EstoqueMovimento {
  id: string;
  bar_id: string;
  produto_id: string | null;
  tipo: MovimentoTipo;
  quantidade: number;
  quantidade_anterior: number;
  quantidade_posterior: number;
  referencia_tipo: string | null;
  referencia_id: string | null;
  motivo: string | null;
  criado_por: string | null;
  criado_em: string;
}

export interface ItemPedidoCliente {
  produto_id: string;
  nome: string;
  preco: number;
  quantidade: number;
}

export interface PedidoCliente {
  id: string;
  bar_id: string;
  mesa_id: string | null;
  nome_cliente: string | null;
  itens: ItemPedidoCliente[];
  total: number;
  status: "pendente" | "em_preparo" | "pronto" | "entregue" | "cancelado";
  created_at: string;
}

type TableDef<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row & Record<string, unknown>;
  Insert: Insert & Record<string, unknown>;
  Update: Update & Record<string, unknown>;
  Relationships: never[];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<Profile>;
      planos: TableDef<Plano>;
      bars: TableDef<Bar>;
      assinaturas: TableDef<Assinatura>;
      bar_members: TableDef<BarMember>;
      mesas: TableDef<Mesa>;
      categorias: TableDef<Categoria>;
      produtos: TableDef<Produto>;
      produto_variantes: TableDef<ProdutoVariante>;
      fornecedores: TableDef<Fornecedor>;
      estoque: TableDef<Estoque>;
      compras: TableDef<Compra>;
      compra_items: TableDef<CompraItem>;
      turnos: TableDef<Turno>;
      comandas: TableDef<Comanda>;
      comanda_items: TableDef<ComandaItem>;
      pagamentos: TableDef<Pagamento>;
      estoque_movimentos: TableDef<EstoqueMovimento>;
      pedidos_cliente: {
        Row: PedidoCliente & Record<string, unknown>;
        Insert: {
          id?: string;
          bar_id: string;
          mesa_id?: string | null;
          nome_cliente?: string | null;
          itens: ItemPedidoCliente[];
          total?: number;
          status?: string;
          created_at?: string;
        } & Record<string, unknown>;
        Update: Partial<PedidoCliente> & Record<string, unknown>;
        Relationships: never[];
      };
    };
    Views: Record<string, never>;
    Functions: {
      incrementar_total_turno: {
        Args: { p_turno_id: string; p_valor: number };
        Returns: undefined;
      };
    };
  };
}
