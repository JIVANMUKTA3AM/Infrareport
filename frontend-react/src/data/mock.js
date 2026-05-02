// Dados mock — substituir por chamadas reais à API em produção
export const MONTHLY_DATA = [
  { mes: 'Jan', entradas: 6200,  saidas: 2100, saldo: 4100 },
  { mes: 'Fev', entradas: 8090,  saidas: 1753, saldo: 6337 },
  { mes: 'Mar', entradas: 9570,  saidas: 1966, saldo: 7604 },
  { mes: 'Abr', entradas: 7800,  saidas: 2400, saldo: 5400 },
  { mes: 'Mai', entradas: 11200, saidas: 3100, saldo: 8100 },
  { mes: 'Jun', entradas: 9900,  saidas: 2600, saldo: 7300 },
];

// Acumulado calculado
export const MONTHLY_DATA_WITH_ACC = MONTHLY_DATA.reduce((acc, row, i) => {
  const prev = acc[i - 1]?.acumulado ?? 0
  acc.push({ ...row, acumulado: prev + row.saldo })
  return acc
}, [])

export const RECEITA_TIPOS = [
  { name: 'Serviço Técnico',       value: 7690, color: '#3B82F6' },
  { name: 'Contrato Recorrente',   value: 1200, color: '#10B981' },
  { name: 'Venda de Material',     value: 680,  color: '#F59E0B' },
]

export const SAIDAS_CATEGORIAS = [
  { name: 'Material',       value: 1196, color: '#EF4444' },
  { name: 'Equipamento',    value: 340,  color: '#8B5CF6' },
  { name: 'Deslocamento',   value: 180,  color: '#F97316' },
  { name: 'Mão de Obra',    value: 250,  color: '#EC4899' },
]

export const PROJETOS = [
  { name: 'Supermercado Beta', receita: 4500, custo: 770  },
  { name: 'Construtora Alfa',  receita: 2840, custo: 386  },
  { name: 'Escritório Delta',  receita: 1200, custo: 0    },
  { name: 'TechPark BSB',      receita: 6800, custo: 1950 },
  { name: 'Clínica Saúde+',   receita: 3200, custo: 890  },
].map(p => ({ ...p, margem: +((1 - p.custo / p.receita) * 100).toFixed(1) }))

export const KPI_CURRENT = {
  entradas:   9570,
  saidas:     1966,
  saldo:      7604,
  acumulado:  23840,
  entradas_pct: +18.4,
  saidas_pct:   +12.1,
  saldo_pct:    +20.2,
  acumulado_pct: +8.7,
}

export const PROPOSTAS_MOCK = [
  { id: 'p1', client_name: 'Supermercado Beta', client_email: 'contato@beta.com', service: 'Instalação CFTV — 8 câmeras', value: 4500, status: 'aprovada', segment: 'CFTV', created_at: '2025-03-20T10:00:00Z', equipments: [{description:'Câmera IP 2MP', quantity:8, unit_price:350}] },
  { id: 'p2', client_name: 'Construtora Alfa', client_email: 'obras@alfa.com', service: 'Manutenção preventiva Split', value: 2840, status: 'pendente', segment: 'AC', created_at: '2025-03-22T14:30:00Z', equipments: [{description:'Higienização', quantity:8, unit_price:355}] },
  { id: 'p3', client_name: 'Escritório Delta', client_email: 'adm@delta.com', service: 'Contrato manutenção mensal', value: 1200, status: 'enviada', segment: 'TI', created_at: '2025-03-18T09:15:00Z', equipments: [] },
  { id: 'p4', client_name: 'Residencial Gama', client_email: 'sindico@gama.com', service: 'Recarga de Gás R410A', value: 350, status: 'rejeitada', segment: 'AC', created_at: '2025-03-25T16:45:00Z', equipments: [{description:'Recarga', quantity:1, unit_price:350}] },
  { id: 'p5', client_name: 'Cliente Avulso', client_email: 'cliente@avulso.com', service: 'Venda de tubulação', value: 680, status: 'aprovada', segment: 'HIDRAULICA', created_at: '2025-03-26T11:20:00Z', equipments: [{description:'Tubo Cobre 1/2', quantity:10, unit_price:68}] },
]
