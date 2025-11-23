export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  plan: string;
  trial_end_date?: string;
}

export interface Expense {
  id: string;
  user_id: string;
  valor: number;
  categoria: string;
  cultura: string;
  tipo: string;
  data: string;
  descricao?: string;
  created_at: string;
}

export interface Revenue {
  id: string;
  user_id: string;
  valor: number;
  cultura: string;
  tipo: string;
  data: string;
  descricao?: string;
  created_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  valor: number;
  credor: string;
  vencimento: string;
  cultura: string;
  status: string;
  descricao?: string;
  created_at: string;
}

export interface Field {
  id: string;
  user_id: string;
  nome: string;
  area_ha: number;
  cultura: string;
  localizacao?: string;
  created_at: string;
}

export interface Harvest {
  id: string;
  user_id: string;
  field_id: string;
  field_name: string;
  area_ha: number;
  cultura: string;
  quantidade_sacas: number;
  produtividade: number;
  data_colheita: string;
  observacoes?: string;
  created_at: string;
}

export interface DashboardSummary {
  total_receitas: number;
  total_despesas: number;
  lucro: number;
  total_dividas_pendentes: number;
  receitas_por_cultura: Record<string, number>;
  despesas_por_cultura: Record<string, number>;
  dividas_pendentes: Debt[];
}

export interface Quotation {
  produto: string;
  preco: number;
  variacao: number;
  unidade: string;
  data: string;
}