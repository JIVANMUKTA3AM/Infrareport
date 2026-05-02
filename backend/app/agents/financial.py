"""
Agente Financeiro — interpreta linguagem natural, registra lançamento
e retorna saldo atualizado.
"""
import json
from datetime import date
from uuid import uuid4, UUID

import anthropic

from app.config import get_settings
from app.database import get_supabase
from app.models.financial import FinancialMessageRequest, FinancialMessageResponse

SYSTEM_PROMPT = """Você é o Agente Financeiro da InfraReport.
Interprete a mensagem do usuário e extraia as informações financeiras.
Retorne APENAS um JSON válido (sem markdown, sem explicações) com:
{
  "type": "entrada" ou "saida",
  "value": número positivo,
  "category": string (ex: "material", "mão de obra", "equipamento", "receita", "outro"),
  "description": string resumida,
  "date": "YYYY-MM-DD" (hoje se não mencionado)
}

Exemplos:
- "gastei R$386 em material elétrico" → type: saida, category: material
- "recebi R$2500 do cliente Alfa" → type: entrada, category: receita
- "paguei R$150 ao ajudante" → type: saida, category: mão de obra
"""


async def run_financial_agent(req: FinancialMessageRequest) -> FinancialMessageResponse:
    cfg = get_settings()
    db  = get_supabase()

    # ── 1. Claude extrai dados da mensagem ─────────────────
    client = anthropic.Anthropic(api_key=cfg.anthropic_api_key)
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=256,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": req.message}],
    )
    raw = message.content[0].text.strip()
    entry_data = json.loads(raw)

    entry_date = entry_data.get("date") or date.today().isoformat()

    # ── 2. Persiste no Supabase ───────────────────────────
    entry_id = uuid4()
    db.table("financial_entries").insert({
        "id":          str(entry_id),
        "user_id":     str(req.user_id),
        "project_id":  str(req.project_id) if req.project_id else None,
        "type":        entry_data["type"],
        "value":       float(entry_data["value"]),
        "category":    entry_data.get("category", "outro"),
        "description": entry_data.get("description", req.message[:200]),
        "date":        entry_date,
    }).execute()

    # ── 3. Calcula saldo atualizado ───────────────────────
    result = db.rpc("get_balance", {"p_user_id": str(req.user_id)}).execute()
    balance = float(result.data or 0)

    tipo_label = "Saída" if entry_data["type"] == "saida" else "Entrada"
    value      = float(entry_data["value"])
    confirmation = (
        f"✅ {tipo_label} de R$ {value:,.2f} registrada "
        f"({entry_data.get('category','outro')}).\n"
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
