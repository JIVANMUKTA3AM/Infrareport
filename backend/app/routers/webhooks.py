"""
Webhook Evolution API — roteador de mensagens WhatsApp.

Fluxo:
  1. Recebe mensagem do usuário
  2. Identifica o engenheiro pelo telefone
  3. Detecta intenção: comercial vs financeiro vs ajuda
  4. Roteia para o agente correto
  5. Responde via Evolution API
"""
import json
from fastapi import APIRouter, Request, HTTPException

from app.database import get_supabase
from app.models.whatsapp import WhatsAppMessage, IncomingMessage
from app.agents.financial import run_financial_agent
from app.models.financial import FinancialMessageRequest
from app.services.whatsapp import send_whatsapp_message

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

# Palavras-chave simples para roteamento sem chamar Claude
FINANCIAL_KEYWORDS = ("gastei", "recebi", "paguei", "comprei", "vendi", "faturei",
                      "saída", "entrada", "despesa", "custo", "r$")
COMMERCIAL_KEYWORDS = ("proposta", "orçamento", "cliente", "serviço")


def _parse_incoming(payload: dict) -> IncomingMessage | None:
    """Extrai campos relevantes do payload da Evolution API."""
    try:
        data = payload.get("data", {})
        msg  = data.get("message", {})
        key  = data.get("key", {})
        body = msg.get("conversation") or msg.get("extendedTextMessage", {}).get("text", "")
        if not body:
            return None
        phone  = key.get("remoteJid", "").replace("@s.whatsapp.net", "")
        name   = data.get("pushName") or phone
        msg_id = key.get("id", "")
        return IncomingMessage(phone=phone, name=name, body=body, message_id=msg_id)
    except Exception:
        return None


def _detect_intent(text: str) -> str:
    lower = text.lower()
    if any(kw in lower for kw in FINANCIAL_KEYWORDS):
        return "financeiro"
    if any(kw in lower for kw in COMMERCIAL_KEYWORDS):
        return "comercial"
    return "ajuda"


@router.post("/whatsapp")
async def whatsapp_webhook(request: Request):
    payload = await request.json()

    # Ignora eventos que não sejam mensagens recebidas
    if payload.get("event") not in ("messages.upsert",):
        return {"status": "ignored"}

    msg = _parse_incoming(payload)
    if not msg:
        return {"status": "no_text"}

    db = get_supabase()

    # ── Identifica engenheiro pelo telefone ───────────────
    user_result = (
        db.table("users")
        .select("id, name, plan")
        .eq("phone", msg.phone)
        .limit(1)
        .execute()
    )
    if not user_result.data:
        await send_whatsapp_message(
            msg.phone,
            "Olá! Não encontrei sua conta no InfraReport. "
            "Cadastre-se em infrareport.app para começar. 🚀",
        )
        return {"status": "user_not_found"}

    user = user_result.data[0]
    user_id = user["id"]

    # ── Verifica plano para WhatsApp agent ────────────────
    if user["plan"] == "starter":
        await send_whatsapp_message(
            msg.phone,
            "O agente WhatsApp está disponível nos planos Pro e Agency. "
            "Acesse o dashboard para fazer upgrade.",
        )
        return {"status": "plan_upgrade_required"}

    # ── Detecta intenção e roteia ─────────────────────────
    intent = _detect_intent(msg.body)

    if intent == "financeiro":
        req = FinancialMessageRequest(user_id=user_id, message=msg.body)
        result = await run_financial_agent(req)
        await send_whatsapp_message(msg.phone, result.confirmation)

    elif intent == "comercial":
        await send_whatsapp_message(
            msg.phone,
            "Para gerar uma proposta pelo WhatsApp, me informe:\n"
            "1️⃣ Nome do cliente\n"
            "2️⃣ E-mail do cliente\n"
            "3️⃣ Serviço (AC, CFTV, TI, Elétrica, Hidráulica)\n"
            "4️⃣ Lista de equipamentos e quantidades",
        )
    else:
        await send_whatsapp_message(
            msg.phone,
            f"Olá, {user['name']}! 👋\n\n"
            "Comandos disponíveis:\n"
            "💰 Financeiro: *gastei R$X em ...*\n"
            "📄 Proposta: *proposta para cliente ...*\n"
            "📊 Saldo: *qual meu saldo?*",
        )

    return {"status": "ok"}
