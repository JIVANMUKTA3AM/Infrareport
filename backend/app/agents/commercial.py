"""
Agente Comercial — usa Claude para enriquecer/validar dados da proposta
e aciona geração de .docx + envio de e-mail.
"""
import json
from uuid import uuid4, UUID

import anthropic

from app.config import get_settings
from app.database import get_supabase
from app.models.proposal import ProposalRequest, ProposalResponse, Equipment
from app.services.docx_generator import generate_proposal_docx
from app.services.email_sender import send_proposal_email
from app.services.file_storage import register_file

PRICE_REFERENCE = """
Tabela de referência de preços (Brasília-DF):
- AC: preventiva R$200-350/unidade | instalação R$400-800/unidade
- CFTV: câmera instalada R$350-600 | cabeamento R$8-15/metro
- TI/Redes: ponto cat6 R$120-250 | AP corporativo R$400-800 | switch R$150-400/port
- Controle de acesso: catraca R$800-2000 | leitor biométrico R$300-600
"""

SYSTEM_PROMPT = f"""Você é o Agente Comercial da InfraReport.
Dado o JSON de uma proposta, valide os preços unitários de acordo com a tabela abaixo
e retorne APENAS um JSON válido com os campos ajustados (sem markdown, sem explicações).

{PRICE_REFERENCE}

Formato de saída esperado:
{{
  "equipments": [
    {{"description": "...", "quantity": 1, "unit_price": 0.0}}
  ],
  "notes": "observação opcional"
}}
"""


async def run_commercial_agent(req: ProposalRequest) -> ProposalResponse:
    cfg  = get_settings()
    db   = get_supabase()

    # ── 1. Claude revisa/valida preços ────────────────────
    client = anthropic.Anthropic(api_key=cfg.anthropic_api_key)
    user_content = json.dumps(
        {
            "service": req.service,
            "segment": req.segment,
            "equipments": [e.model_dump() for e in req.equipments],
        },
        ensure_ascii=False,
    )

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )
    raw = message.content[0].text.strip()

    try:
        validated = json.loads(raw)
        req.equipments = [Equipment(**e) for e in validated["equipments"]]
        if validated.get("notes") and not req.notes:
            req.notes = validated["notes"]
    except (json.JSONDecodeError, KeyError):
        pass  # mantém dados originais se Claude retornar algo inesperado

    # ── 2. Gera .docx ─────────────────────────────────────
    proposal_id = uuid4()
    docx_path, total_value = generate_proposal_docx(req, proposal_id)

    # ── 3. Registra arquivo na tabela files ───────────────
    file_record = register_file(
        user_id=req.user_id,
        file_path=docx_path,
        file_type="proposta",
        ref_id=proposal_id,
    )

    # ── 4. Persiste proposta no Supabase ──────────────────
    db.table("proposals").insert({
        "id":           str(proposal_id),
        "user_id":      str(req.user_id),
        "project_id":   str(req.project_id) if req.project_id else None,
        "client_name":  req.client_name,
        "client_email": req.client_email,
        "service":      req.service,
        "segment":      req.segment,
        "equipments":   json.dumps([e.model_dump() for e in req.equipments]),
        "value":        total_value,
        "status":       "draft",
        "docx_url":     docx_path,
    }).execute()

    # ── 4. Envia e-mail ───────────────────────────────────
    email_sent = False
    try:
        await send_proposal_email(req.client_email, req.client_name, req.service, docx_path)
        db.table("proposals").update(
            {"status": "sent", "email_sent_at": "now()"}
        ).eq("id", str(proposal_id)).execute()
        email_sent = True
    except Exception as exc:
        print(f"[commercial_agent] Falha ao enviar e-mail: {exc}")

    return ProposalResponse(
        proposal_id=proposal_id,
        docx_url=docx_path,
        total_value=total_value,
        email_sent=email_sent,
        message=(
            f"Proposta gerada com sucesso! Total: R$ {total_value:,.2f}. "
            + ("E-mail enviado para " + req.client_email if email_sent else "Falha no envio do e-mail.")
        ),
    )
