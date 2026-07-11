export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assinaturas: {
        Row: {
          bar_id: string
          created_at: string
          id: string
          periodo_fim: string | null
          periodo_inicio: string
          plano_id: string
          status: Database["public"]["Enums"]["assinatura_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_fim: string | null
          updated_at: string
        }
        Insert: {
          bar_id: string
          created_at?: string
          id?: string
          periodo_fim?: string | null
          periodo_inicio?: string
          plano_id: string
          status?: Database["public"]["Enums"]["assinatura_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_fim?: string | null
          updated_at?: string
        }
        Update: {
          bar_id?: string
          created_at?: string
          id?: string
          periodo_fim?: string | null
          periodo_inicio?: string
          plano_id?: string
          status?: Database["public"]["Enums"]["assinatura_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_fim?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_members: {
        Row: {
          ativo: boolean
          bar_id: string
          convidado_por: string | null
          created_at: string
          id: string
          nome: string | null
          pin: string | null
          role: Database["public"]["Enums"]["bar_role"]
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          bar_id: string
          convidado_por?: string | null
          created_at?: string
          id?: string
          nome?: string | null
          pin?: string | null
          role: Database["public"]["Enums"]["bar_role"]
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          bar_id?: string
          convidado_por?: string | null
          created_at?: string
          id?: string
          nome?: string | null
          pin?: string | null
          role?: Database["public"]["Enums"]["bar_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bar_members_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_members_convidado_por_fkey"
            columns: ["convidado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bars: {
        Row: {
          ativo: boolean
          cnpj: string | null
          configuracoes: Json
          created_at: string
          endereco: Json | null
          id: string
          logo_url: string | null
          nome: string
          slug: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          configuracoes?: Json
          created_at?: string
          endereco?: Json | null
          id?: string
          logo_url?: string | null
          nome: string
          slug: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          configuracoes?: Json
          created_at?: string
          endereco?: Json | null
          id?: string
          logo_url?: string | null
          nome?: string
          slug?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      categorias: {
        Row: {
          ativo: boolean
          bar_id: string
          created_at: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          bar_id: string
          created_at?: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          bar_id?: string
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "categorias_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      chamadas: {
        Row: {
          atendida_em: string | null
          bar_id: string
          criada_em: string
          id: string
          mesa_id: string
          status: string
          turno_id: string
        }
        Insert: {
          atendida_em?: string | null
          bar_id: string
          criada_em?: string
          id?: string
          mesa_id: string
          status?: string
          turno_id: string
        }
        Update: {
          atendida_em?: string | null
          bar_id?: string
          criada_em?: string
          id?: string
          mesa_id?: string
          status?: string
          turno_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamadas_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamadas_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamadas_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
        ]
      }
      comanda_items: {
        Row: {
          adicionado_em: string
          adicionado_por: string
          adicionado_por_member_id: string | null
          bar_id: string
          cancelado_em: string | null
          cancelado_por: string | null
          cancelado_por_member_id: string | null
          comanda_id: string
          created_at: string
          id: string
          observacao: string | null
          pedido_id: string | null
          preco_total: number
          preco_unitario: number
          produto_id: string
          quantidade: number
          status: Database["public"]["Enums"]["comanda_item_status"]
          variante_id: string | null
          variante_nome: string | null
        }
        Insert: {
          adicionado_em?: string
          adicionado_por: string
          adicionado_por_member_id?: string | null
          bar_id: string
          cancelado_em?: string | null
          cancelado_por?: string | null
          cancelado_por_member_id?: string | null
          comanda_id: string
          created_at?: string
          id?: string
          observacao?: string | null
          pedido_id?: string | null
          preco_total: number
          preco_unitario: number
          produto_id: string
          quantidade?: number
          status?: Database["public"]["Enums"]["comanda_item_status"]
          variante_id?: string | null
          variante_nome?: string | null
        }
        Update: {
          adicionado_em?: string
          adicionado_por?: string
          adicionado_por_member_id?: string | null
          bar_id?: string
          cancelado_em?: string | null
          cancelado_por?: string | null
          cancelado_por_member_id?: string | null
          comanda_id?: string
          created_at?: string
          id?: string
          observacao?: string | null
          pedido_id?: string | null
          preco_total?: number
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
          status?: Database["public"]["Enums"]["comanda_item_status"]
          variante_id?: string | null
          variante_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comanda_items_adicionado_por_fkey"
            columns: ["adicionado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_items_adicionado_por_member_id_fkey"
            columns: ["adicionado_por_member_id"]
            isOneToOne: false
            referencedRelation: "bar_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_items_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_items_cancelado_por_fkey"
            columns: ["cancelado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_items_cancelado_por_member_id_fkey"
            columns: ["cancelado_por_member_id"]
            isOneToOne: false
            referencedRelation: "bar_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_items_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_items_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_items_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comanda_items_variante_id_fkey"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "produto_variantes"
            referencedColumns: ["id"]
          },
        ]
      }
      comandas: {
        Row: {
          aberta_em: string
          aberta_por_member_id: string | null
          bar_id: string
          bartender_id: string
          created_at: string
          fechada_em: string | null
          id: string
          identificador: string | null
          mesa_id: string | null
          nome_cliente: string | null
          status: Database["public"]["Enums"]["comanda_status"]
          telefone_cliente: string | null
          total: number
          total_pessoas: number | null
          turno_id: string
        }
        Insert: {
          aberta_em?: string
          aberta_por_member_id?: string | null
          bar_id: string
          bartender_id: string
          created_at?: string
          fechada_em?: string | null
          id?: string
          identificador?: string | null
          mesa_id?: string | null
          nome_cliente?: string | null
          status?: Database["public"]["Enums"]["comanda_status"]
          telefone_cliente?: string | null
          total?: number
          total_pessoas?: number | null
          turno_id: string
        }
        Update: {
          aberta_em?: string
          aberta_por_member_id?: string | null
          bar_id?: string
          bartender_id?: string
          created_at?: string
          fechada_em?: string | null
          id?: string
          identificador?: string | null
          mesa_id?: string | null
          nome_cliente?: string | null
          status?: Database["public"]["Enums"]["comanda_status"]
          telefone_cliente?: string | null
          total?: number
          total_pessoas?: number | null
          turno_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comandas_aberta_por_member_id_fkey"
            columns: ["aberta_por_member_id"]
            isOneToOne: false
            referencedRelation: "bar_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_bartender_id_fkey"
            columns: ["bartender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comandas_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
        ]
      }
      compra_items: {
        Row: {
          compra_id: string
          created_at: string
          id: string
          preco_total: number
          preco_unitario: number
          produto_id: string
          quantidade: number
        }
        Insert: {
          compra_id: string
          created_at?: string
          id?: string
          preco_total: number
          preco_unitario: number
          produto_id: string
          quantidade: number
        }
        Update: {
          compra_id?: string
          created_at?: string
          id?: string
          preco_total?: number
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "compra_items_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compra_items_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      compras: {
        Row: {
          bar_id: string
          created_at: string
          criado_por: string
          data_pedido: string
          data_recebimento: string | null
          fornecedor_id: string | null
          id: string
          nota_fiscal: string | null
          observacoes: string | null
          status: Database["public"]["Enums"]["compra_status"]
          total: number
        }
        Insert: {
          bar_id: string
          created_at?: string
          criado_por: string
          data_pedido?: string
          data_recebimento?: string | null
          fornecedor_id?: string | null
          id?: string
          nota_fiscal?: string | null
          observacoes?: string | null
          status?: Database["public"]["Enums"]["compra_status"]
          total?: number
        }
        Update: {
          bar_id?: string
          created_at?: string
          criado_por?: string
          data_pedido?: string
          data_recebimento?: string | null
          fornecedor_id?: string | null
          id?: string
          nota_fiscal?: string | null
          observacoes?: string | null
          status?: Database["public"]["Enums"]["compra_status"]
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "compras_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque: {
        Row: {
          abaixo_minimo: boolean | null
          bar_id: string
          id: string
          produto_id: string
          quantidade_atual: number
          quantidade_minima: number
          unidade: Database["public"]["Enums"]["estoque_unidade"]
          updated_at: string
        }
        Insert: {
          abaixo_minimo?: boolean | null
          bar_id: string
          id?: string
          produto_id: string
          quantidade_atual?: number
          quantidade_minima?: number
          unidade?: Database["public"]["Enums"]["estoque_unidade"]
          updated_at?: string
        }
        Update: {
          abaixo_minimo?: boolean | null
          bar_id?: string
          id?: string
          produto_id?: string
          quantidade_atual?: number
          quantidade_minima?: number
          unidade?: Database["public"]["Enums"]["estoque_unidade"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_movimentos: {
        Row: {
          bar_id: string
          criado_em: string
          criado_por: string | null
          id: string
          motivo: string | null
          produto_id: string
          quantidade: number
          quantidade_anterior: number
          quantidade_posterior: number
          referencia_id: string | null
          referencia_tipo: string | null
          tipo: Database["public"]["Enums"]["movimento_tipo"]
        }
        Insert: {
          bar_id: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          motivo?: string | null
          produto_id: string
          quantidade: number
          quantidade_anterior: number
          quantidade_posterior: number
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo: Database["public"]["Enums"]["movimento_tipo"]
        }
        Update: {
          bar_id?: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          motivo?: string | null
          produto_id?: string
          quantidade?: number
          quantidade_anterior?: number
          quantidade_posterior?: number
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: Database["public"]["Enums"]["movimento_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "estoque_movimentos_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean
          bar_id: string
          cnpj: string | null
          contato: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          bar_id: string
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          bar_id?: string
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      ingrediente_movimentos: {
        Row: {
          bar_id: string
          comanda_item_id: string | null
          criado_em: string
          criado_por: string | null
          criado_por_member_id: string | null
          custo_unitario: number | null
          id: string
          ingrediente_id: string
          motivo: string | null
          pedido_id: string | null
          quantidade: number
          tipo: string
        }
        Insert: {
          bar_id: string
          comanda_item_id?: string | null
          criado_em?: string
          criado_por?: string | null
          criado_por_member_id?: string | null
          custo_unitario?: number | null
          id?: string
          ingrediente_id: string
          motivo?: string | null
          pedido_id?: string | null
          quantidade: number
          tipo: string
        }
        Update: {
          bar_id?: string
          comanda_item_id?: string | null
          criado_em?: string
          criado_por?: string | null
          criado_por_member_id?: string | null
          custo_unitario?: number | null
          id?: string
          ingrediente_id?: string
          motivo?: string | null
          pedido_id?: string | null
          quantidade?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingrediente_movimentos_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingrediente_movimentos_comanda_item_id_fkey"
            columns: ["comanda_item_id"]
            isOneToOne: false
            referencedRelation: "comanda_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingrediente_movimentos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingrediente_movimentos_criado_por_member_id_fkey"
            columns: ["criado_por_member_id"]
            isOneToOne: false
            referencedRelation: "bar_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingrediente_movimentos_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingrediente_movimentos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredientes: {
        Row: {
          ativo: boolean
          atualizado_em: string
          bar_id: string
          criado_em: string
          custo_atual: number
          estoque_atual: number
          estoque_minimo: number
          id: string
          nome: string
          unidade: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          bar_id: string
          criado_em?: string
          custo_atual?: number
          estoque_atual?: number
          estoque_minimo?: number
          id?: string
          nome: string
          unidade: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          bar_id?: string
          criado_em?: string
          custo_atual?: number
          estoque_atual?: number
          estoque_minimo?: number
          id?: string
          nome?: string
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredientes_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      insights: {
        Row: {
          bar_id: string
          criado_em: string
          dado_referencia: Json
          dedupe_key: string
          descricao: string
          id: string
          impacto_valor: number | null
          lido: boolean
          tipo: string
          titulo: string
        }
        Insert: {
          bar_id: string
          criado_em?: string
          dado_referencia?: Json
          dedupe_key: string
          descricao: string
          id?: string
          impacto_valor?: number | null
          lido?: boolean
          tipo: string
          titulo: string
        }
        Update: {
          bar_id?: string
          criado_em?: string
          dado_referencia?: Json
          dedupe_key?: string
          descricao?: string
          id?: string
          impacto_valor?: number | null
          lido?: boolean
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "insights_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      mesas: {
        Row: {
          ativo: boolean
          bar_id: string
          capacidade: number | null
          created_at: string
          id: string
          nome: string | null
          numero: number
          ordem: number | null
        }
        Insert: {
          ativo?: boolean
          bar_id: string
          capacidade?: number | null
          created_at?: string
          id?: string
          nome?: string | null
          numero: number
          ordem?: number | null
        }
        Update: {
          ativo?: boolean
          bar_id?: string
          capacidade?: number | null
          created_at?: string
          id?: string
          nome?: string | null
          numero?: number
          ordem?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mesas_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          bar_id: string
          comanda_id: string
          created_at: string
          estornado_em: string | null
          estornado_por: string | null
          id: string
          metodo: Database["public"]["Enums"]["pagamento_metodo"]
          processado_em: string
          processado_por: string
          processado_por_member_id: string | null
          referencia: string | null
          status: Database["public"]["Enums"]["pagamento_status"]
          turno_id: string
          valor: number
        }
        Insert: {
          bar_id: string
          comanda_id: string
          created_at?: string
          estornado_em?: string | null
          estornado_por?: string | null
          id?: string
          metodo: Database["public"]["Enums"]["pagamento_metodo"]
          processado_em?: string
          processado_por: string
          processado_por_member_id?: string | null
          referencia?: string | null
          status?: Database["public"]["Enums"]["pagamento_status"]
          turno_id: string
          valor: number
        }
        Update: {
          bar_id?: string
          comanda_id?: string
          created_at?: string
          estornado_em?: string | null
          estornado_por?: string | null
          id?: string
          metodo?: Database["public"]["Enums"]["pagamento_metodo"]
          processado_em?: string
          processado_por?: string
          processado_por_member_id?: string | null
          referencia?: string | null
          status?: Database["public"]["Enums"]["pagamento_status"]
          turno_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_estornado_por_fkey"
            columns: ["estornado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_processado_por_fkey"
            columns: ["processado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_processado_por_member_id_fkey"
            columns: ["processado_por_member_id"]
            isOneToOne: false
            referencedRelation: "bar_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          bar_id: string
          comanda_id: string
          criado_em: string
          criado_por_member_id: string | null
          entregue_em: string | null
          entregue_por_member_id: string | null
          id: string
          iniciado_em: string | null
          iniciado_por_member_id: string | null
          pronto_em: string | null
          status: string
          turno_id: string
        }
        Insert: {
          bar_id: string
          comanda_id: string
          criado_em?: string
          criado_por_member_id?: string | null
          entregue_em?: string | null
          entregue_por_member_id?: string | null
          id?: string
          iniciado_em?: string | null
          iniciado_por_member_id?: string | null
          pronto_em?: string | null
          status?: string
          turno_id: string
        }
        Update: {
          bar_id?: string
          comanda_id?: string
          criado_em?: string
          criado_por_member_id?: string | null
          entregue_em?: string | null
          entregue_por_member_id?: string | null
          id?: string
          iniciado_em?: string | null
          iniciado_por_member_id?: string | null
          pronto_em?: string | null
          status?: string
          turno_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_criado_por_member_id_fkey"
            columns: ["criado_por_member_id"]
            isOneToOne: false
            referencedRelation: "bar_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_entregue_por_member_id_fkey"
            columns: ["entregue_por_member_id"]
            isOneToOne: false
            referencedRelation: "bar_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_iniciado_por_member_id_fkey"
            columns: ["iniciado_por_member_id"]
            isOneToOne: false
            referencedRelation: "bar_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_cliente: {
        Row: {
          bar_id: string
          created_at: string
          id: string
          itens: Json
          mesa_id: string | null
          nome_cliente: string | null
          status: string
          total: number
        }
        Insert: {
          bar_id: string
          created_at?: string
          id?: string
          itens: Json
          mesa_id?: string | null
          nome_cliente?: string | null
          status?: string
          total?: number
        }
        Update: {
          bar_id?: string
          created_at?: string
          id?: string
          itens?: Json
          mesa_id?: string | null
          nome_cliente?: string | null
          status?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_cliente_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          ativo: boolean
          created_at: string
          features: Json
          id: string
          max_mesas: number
          max_usuarios: number
          nome: string
          preco_mensal: number
          slug: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          features?: Json
          id?: string
          max_mesas?: number
          max_usuarios?: number
          nome: string
          preco_mensal: number
          slug: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          features?: Json
          id?: string
          max_mesas?: number
          max_usuarios?: number
          nome?: string
          preco_mensal?: number
          slug?: string
        }
        Relationships: []
      }
      produto_variantes: {
        Row: {
          ativo: boolean
          created_at: string
          custo: number | null
          custo_status: string
          id: string
          imagem_url: string | null
          nome: string
          ordem: number
          preco: number
          produto_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          custo?: number | null
          custo_status?: string
          id?: string
          imagem_url?: string | null
          nome: string
          ordem?: number
          preco: number
          produto_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          custo?: number | null
          custo_status?: string
          id?: string
          imagem_url?: string | null
          nome?: string
          ordem?: number
          preco?: number
          produto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "produto_variantes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          bar_id: string
          categoria_id: string | null
          controla_estoque: boolean
          created_at: string
          custo: number | null
          custo_status: string
          descricao: string | null
          id: string
          imagem_url: string | null
          nome: string
          preco: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bar_id: string
          categoria_id?: string | null
          controla_estoque?: boolean
          created_at?: string
          custo?: number | null
          custo_status?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome: string
          preco: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bar_id?: string
          categoria_id?: string | null
          controla_estoque?: boolean
          created_at?: string
          custo?: number | null
          custo_status?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome?: string
          preco?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      receitas: {
        Row: {
          bar_id: string
          criado_em: string
          id: string
          ingrediente_id: string
          produto_id: string
          quantidade: number
          variante_id: string | null
        }
        Insert: {
          bar_id: string
          criado_em?: string
          id?: string
          ingrediente_id: string
          produto_id: string
          quantidade: number
          variante_id?: string | null
        }
        Update: {
          bar_id?: string
          criado_em?: string
          id?: string
          ingrediente_id?: string
          produto_id?: string
          quantidade?: number
          variante_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receitas_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receitas_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receitas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos: {
        Row: {
          aberto_em: string
          abertura_por: string
          bar_id: string
          created_at: string
          fechado_em: string | null
          fechamento_por: string | null
          id: string
          observacoes: string | null
          status: Database["public"]["Enums"]["turno_status"]
          total_comandas: number
          total_vendas: number
        }
        Insert: {
          aberto_em?: string
          abertura_por: string
          bar_id: string
          created_at?: string
          fechado_em?: string | null
          fechamento_por?: string | null
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["turno_status"]
          total_comandas?: number
          total_vendas?: number
        }
        Update: {
          aberto_em?: string
          abertura_por?: string
          bar_id?: string
          created_at?: string
          fechado_em?: string | null
          fechamento_por?: string | null
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["turno_status"]
          total_comandas?: number
          total_vendas?: number
        }
        Relationships: [
          {
            foreignKeyName: "turnos_abertura_por_fkey"
            columns: ["abertura_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_fechamento_por_fkey"
            columns: ["fechamento_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fn_entregar_pedido: {
        Args: { p_member_id?: string; p_pedido_id: string; p_user_id: string }
        Returns: Json
      }
      incrementar_total_turno: {
        Args: { p_turno_id: string; p_valor: number }
        Returns: undefined
      }
      is_bar_member: {
        Args: {
          p_bar_id: string
          p_roles?: Database["public"]["Enums"]["bar_role"][]
        }
        Returns: boolean
      }
      marcar_comanda_paga: {
        Args: { p_bar_id: string; p_comanda_id: string }
        Returns: Json
      }
      registrar_pagamento: {
        Args: {
          p_comanda_id: string
          p_bar_id: string
          p_turno_id: string
          p_metodo: string
          p_incluir_servico: boolean
          p_taxa_pct: number
          p_user_id: string
          p_member_id: string | null
          p_referencia?: string | null
        }
        Returns: Json
      }
      criar_pedido_com_itens: {
        Args: {
          p_bar_id: string
          p_comanda_id: string
          p_turno_id: string
          p_itens: Json
          p_criado_por_member_id?: string | null
        }
        Returns: Json
      }
      merge_bar_config: {
        Args: { p_bar_id: string; p_patch: Json }
        Returns: undefined
      }
      my_bar_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      assinatura_status: "trial" | "ativa" | "cancelada" | "inadimplente"
      bar_role:
        | "dono"
        | "gerente"
        | "bartender"
        | "caixa"
        | "garcom"
        | "bar_manager"
      comanda_item_status: "ativo" | "cancelado"
      comanda_status: "aberta" | "aguardando_pagamento" | "paga" | "cancelada"
      compra_status: "pendente" | "recebida" | "cancelada"
      estoque_unidade: "un" | "ml" | "l" | "g" | "kg"
      movimento_tipo: "venda" | "compra" | "ajuste" | "perda" | "devolucao"
      pagamento_metodo: "pix" | "credito" | "debito" | "dinheiro" | "cortesia"
      pagamento_status: "pendente" | "confirmado" | "estornado"
      turno_status: "aberto" | "fechado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      assinatura_status: ["trial", "ativa", "cancelada", "inadimplente"],
      bar_role: [
        "dono",
        "gerente",
        "bartender",
        "caixa",
        "garcom",
        "bar_manager",
      ],
      comanda_item_status: ["ativo", "cancelado"],
      comanda_status: ["aberta", "aguardando_pagamento", "paga", "cancelada"],
      compra_status: ["pendente", "recebida", "cancelada"],
      estoque_unidade: ["un", "ml", "l", "g", "kg"],
      movimento_tipo: ["venda", "compra", "ajuste", "perda", "devolucao"],
      pagamento_metodo: ["pix", "credito", "debito", "dinheiro", "cortesia"],
      pagamento_status: ["pendente", "confirmado", "estornado"],
      turno_status: ["aberto", "fechado"],
    },
  },
} as const
