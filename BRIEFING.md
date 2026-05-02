# InfraReport — Briefing para Claude Code

## O que é
SaaS para prestadores de serviço técnico (AC, CFTV, TI/Redes, Elétrica, Hidráulica).
Automatiza propostas, controle financeiro e relatórios via dashboard e WhatsApp.

## Stack decidida
- Backend: Python + FastAPI
- Database: Supabase (PostgreSQL + RLS)
- WhatsApp: Evolution API
- AI: Anthropic Claude API (claude-sonnet-4-20250514)
- Frontend: já existe em frontend/infrareport_dashboard.html
- Deploy: VPS + Docker + Nginx

## Agentes a construir

### 1. Agente Comercial (propostas)
- Recebe: cliente, serviço, equipamentos, e-mail
- Gera: proposta em .docx usando template
- Envia: e-mail com .docx para o cliente final
- Endpoint: POST /api/proposals/generate

### 2. Agente Financeiro
- Recebe: mensagem em linguagem natural ("gastei R$386 em material")
- Registra: lançamento no Supabase
- Retorna: confirmação com saldo atualizado
- Endpoint: POST /api/financial/message

### 3. Agente WhatsApp (Evolution API)
- Recebe: webhook da Evolution API
- Identifica: engenheiro pelo número
- Roteia: para agente comercial ou financeiro
- Endpoint: POST /webhooks/whatsapp

## Banco de dados (Supabase)
Tabelas necessárias:
- users: id, name, email, phone, plan, company
- proposals: id, user_id, client_name, client_email, service, value, status, docx_url
- financial_entries: id, user_id, type (entrada/saída), value, category, project, description, date
- projects: id, user_id, name, client, revenue, cost
- whatsapp_sessions: id, user_id, phone, active_flow, context_json

## Planos
- Starter R$97: 20 propostas/mês, sem WhatsApp agent
- Pro R$197: 100 propostas/mês, com WhatsApp agent
- Agency R$397: ilimitado, multi-usuário

## Segmentos atendidos
- AC (Ar-condicionado)
- CFTV + Controle de Acesso
- TI / Redes (switches, roteadores, cabeamento)
- Elétrica
- Hidráulica

## Tabela de preços base (Brasília-DF)
- AC: preventiva R$200-350/unidade | instalação R$400-800/unidade
- CFTV: câmera instalada R$350-600 | cabeamento R$8-15/metro
- TI/Redes: ponto cat6 R$120-250 | AP corporativo R$400-800 | switch R$150-400/port
- Controle de acesso: catraca R$800-2000 | leitor biométrico R$300-600
