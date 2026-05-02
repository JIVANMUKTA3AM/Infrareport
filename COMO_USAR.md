# Como usar este projeto no VSCode + Claude Code

## 1. Abrir no VSCode
- File → Open Folder → seleciona a pasta "infrareport"
- Todos os arquivos já estarão visíveis no painel lateral

## 2. Abrir o terminal integrado
- Atalho: Ctrl + ` (acento grave)

## 3. Instalar o Claude Code (se ainda não tiver)
```bash
npm install -g @anthropic-ai/claude-code
```

## 4. Iniciar o Claude Code dentro da pasta
```bash
claude
```

## 5. Primeiro prompt para o Claude Code
Cole isso exatamente:

```
Leia o arquivo BRIEFING.md e o frontend em frontend/infrareport_dashboard.html.

Quero que você monte a estrutura base do backend FastAPI com:
1. Estrutura de pastas do projeto Python
2. SQL para criar as tabelas no Supabase com RLS
3. Agente Comercial — POST /api/proposals/generate (gera .docx e envia e-mail)
4. Agente Financeiro — POST /api/financial/message (interpreta linguagem natural)
5. Webhook WhatsApp — POST /webhooks/whatsapp (Evolution API)

Use: python-docx, anthropic, supabase-py, fastapi, python-dotenv
```

## 6. Ordem recomendada de desenvolvimento
1. Estrutura de pastas + requirements.txt + .env.example
2. SQL das tabelas Supabase + RLS
3. Agente Financeiro (mais simples)
4. Template .docx + Agente Comercial
5. Webhook WhatsApp + roteamento
6. Docker + docker-compose.yml para deploy no VPS
