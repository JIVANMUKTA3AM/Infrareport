"""
Agente Financeiro — interpreta linguagem natural, registra lançamento
e retorna saldo atualizado.
"""
import json
from datetime import date
from uuid import uuid4

import anthropic

from app.config import get_settings
from app.database import get_supabase
from app.models.financial import FinancialMessageRequest, FinancialMessageResponse

SYSTEM_PROMPT = """Você é o Agente Financeiro da InfraReport.
Analise a mensagem e retorne APENAS um JSON válido (sem markdown, sem explicações).

Se for uma TRANSAÇÃO (registrar entrada ou saída de dinheiro), retorne:
{
  "tipo_msg": "transacao",
  "type": "entrada" ou "saida",
  "value": número positivo,
  "category": uma das categorias abaixo,
  "description": string resumida em português,
  "supplier": nome do fornecedor/prestador se mencionado (null caso contrário),
  "date": "YYYY-MM-DD" (data de hoje se não mencionada)
}

Categorias para SAÍDA: "material" | "equipamento" | "mao_de_obra" | "deslocamento" | "combustivel" | "alimentacao" | "servico_terceiro" | "manutencao" | "outro"
Categorias para ENTRADA: "receita" | "contrato" | "venda" | "adiantamento" | "outro"

Se for uma CONSULTA (saldo, relatório, resumo, histórico, etc), retorne:
{
  "tipo_msg": "consulta"
}

Exemplos:
- "gastei R$386 em material elétrico"      → saida, category: material
- "comprei cabos na Elétrica Silva"        → saida, category: material, supplier: Elétrica Silva
- "paguei R$150 ao ajudante João"          → saida, category: mao_de_obra, supplier: João
- "abasteci o carro R$180"                 → saida, category: combustivel
- "recebi R$2500 do cliente Alfa"          → entrada, category: receita
- "recebi adiantamento de R$800 pela OS 12"→ entrada, category: adiantamento
- "qual meu saldo?"                        → consulta
- "gere um relatório mensal"               → consulta
"""


def _get_balance(db, user_id: str) -> float:
    result = db.rpc("get_balance", {"p_user_id": user_id}).execute()
    return float(result.data or 0)


async def run_financial_agent(req: FinancialMessageRequest) -> FinancialMessageResponse:
    cfg = get_settings()
    db  = get_supabase()

    # ── 1. Claude classifica e extrai dados ────────────────
    client = anthropic.Anthropic(api_key=cfg.anthropic_api_key)
    message = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=256,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": req.message}],
    )
    raw = message.content[0].text.strip()

    try:
        entry_data = json.loads(raw)
    except json.JSONDecodeError:
        # Claude não retornou JSON — trata como consulta de saldo
        balance = _get_balance(db, str(req.user_id))
        return FinancialMessageResponse(
            entry_id=uuid4(),
            type="consulta",
            value=0.0,
            category="",
            description=req.message,
            balance=balance,
            confirmation=f"Saldo atual: R$ {balance:,.2f}",
        )

    # ── 2. Consulta (saldo, relatório, etc.) ───────────────
    if entry_data.get("tipo_msg") == "consulta":
        balance = _get_balance(db, str(req.user_id))
        return FinancialMessageResponse(
            entry_id=uuid4(),
            type="consulta",
            value=0.0,
            category="",
            description=req.message,
            balance=balance,
            confirmation=f"Saldo atual: R$ {balance:,.2f}",
        )

    # ── 3. Transação — persiste no Supabase ────────────────
    entry_date = entry_data.get("date") or date.today().isoformat()
    entry_id   = uuid4()

    row = {
        "id":          str(entry_id),
        "user_id":     str(req.user_id),
        "project_id":  str(req.project_id) if req.project_id else None,
        "type":        entry_data["type"],
        "value":       float(entry_data["value"]),
        "category":    entry_data.get("category", "outro"),
        "description": entry_data.get("description", req.message[:200]),
        "date":        entry_date,
    }
    try:
        if entry_data.get("supplier"):
            row["supplier"] = entry_data["supplier"]
        db.table("financial_entries").insert(row).execute()
    except Exception:
        row.pop("supplier", None)
        db.table("financial_entries").insert(row).execute()

    # ── 4. Saldo atualizado ────────────────────────────────
    balance    = _get_balance(db, str(req.user_id))
    tipo_label = "Saída" if entry_data["type"] == "saida" else "Entrada"
    value      = float(entry_data["value"])
    confirmation = (
        f"✅ {tipo_label} de R$ {value:,.2f} registrada "
        f"({entry_data.get('category', 'outro')}).\n"
        f"Saldo atual: R$ {balance:,.2f}"
    )

    return FinancialMessageResponse(
        entry_id=entry_id,
        type=entry_data["type"],
        value=value,
        category=entry_data.get("category", "outro"),
        description=entry_data.get("description", ""),
        balance=balance,
        confirmation=confirmation,
    )
