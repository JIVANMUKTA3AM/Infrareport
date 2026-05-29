"""
Agente Comercial — usa Claude para gerar conteúdo completo da proposta:
apresentação personalizada, escopo, metodologia, condições comerciais e garantia.
"""
import json
from uuid import uuid4, UUID

import anthropic

from app.config import get_settings
from app.database import get_supabase
from app.models.proposal import ProposalRequest, ProposalResponse, Equipment, ProposalContent
from app.services.docx_generator import generate_proposal_docx
from app.services.email_sender import send_proposal_email
from app.services.file_storage import register_file

PRICE_REFERENCE = """
Tabela de referência de preços (Brasília-DF):
- AC (Ar-Condicionado): preventiva R$200-350/unidade | instalação R$400-800/unidade | higienização R$150-280/unidade
- CFTV: câmera dome/bullet instalada R$350-600 | câmera IP/PTZ R$600-1.200 | DVR/NVR R$800-2.500 | cabeamento R$8-15/metro
- TI/Redes: ponto cat6 R$120-250 | AP corporativo R$400-800 | switch gerenciável R$150-400/port | rack 12U R$600-1.200
- Controle de acesso: catraca R$800-2.000 | leitor biométrico R$300-600 | fechadura eletromagnética R$250-500
- Elétrica: quadro de distribuição R$400-1.200 | tomada/ponto R$80-180 | SPDA R$1.500-4.000
- Hidráulica: ponto hidráulico R$200-450 | bomba de recalque R$800-2.500 | reservatório R$1.200-3.500
"""

SEGMENT_CONTEXT = {
    "ac": "climatização e manutenção de sistemas de ar-condicionado",
    "cftv": "segurança eletrônica com câmeras e monitoramento",
    "ti": "infraestrutura de TI, redes e telecomunicações",
    "eletrica": "instalações e manutenção elétrica predial",
    "hidraulica": "instalações e manutenção hidráulica predial",
}

SYSTEM_PROMPT = f"""Você é o Agente Comercial Sênior da InfraReport, especializado em elaborar propostas técnico-comerciais de alta qualidade para serviços de infraestrutura predial.

Sua missão é gerar uma proposta que demonstre profissionalismo, conhecimento técnico e que transmita confiança ao cliente — uma proposta acima da média do mercado.

{PRICE_REFERENCE}

Receba o JSON do cliente e retorne APENAS um JSON válido (sem markdown, sem explicações fora do JSON) com a seguinte estrutura:

{{
  "equipments": [
    {{"description": "...", "quantity": 1, "unit_price": 0.0}}
  ],
  "introduction": "Carta de apresentação personalizada (2-3 parágrafos). Mencione o nome do cliente, o tipo de serviço solicitado e demonstre entendimento das necessidades dele. Seja consultivo, não genérico.",
  "scope": "Descrição detalhada do escopo do serviço (bullet points em texto corrido). Descreva o que será feito, quais ambientes/sistemas serão atendidos e o que está incluído no contrato.",
  "methodology": "Como o serviço será executado: etapas, cronograma, equipe técnica envolvida, certificações/normas seguidas (ex: NR10, NR35, ABNT). Máximo 3-4 parágrafos.",
  "warranty": "Condições de garantia do serviço e dos equipamentos fornecidos. Inclua prazo, cobertura e como acionar o suporte.",
  "payment_terms": "Condições de pagamento sugeridas (ex: 50% na assinatura, 50% na entrega; ou parcelamento). Forme baseado no valor total dos equipamentos.",
  "execution_deadline": "Prazo estimado para execução do serviço, desde a assinatura até a entrega final.",
  "differentials": "3-4 diferenciais da InfraReport que agregam valor para este cliente específico (ex: equipe certificada, atendimento 24h, relatórios digitais, suporte pós-serviço).",
  "notes": "Observações técnicas relevantes ou condições especiais desta proposta (pode ser vazio se não houver)"
}}

Regras obrigatórias:
1. Ajuste os preços unitários conforme a tabela de referência se estiverem fora da faixa.
2. A introduction deve mencionar o nome real do cliente e o serviço específico solicitado.
3. O scope deve ser específico para o segmento e serviços listados, não genérico.
4. Toda linguagem deve ser profissional, direta e transmitir expertise técnica.
5. O JSON de saída deve ser válido e completo.
"""


async def run_commercial_agent(req: ProposalRequest) -> ProposalResponse:
    cfg = get_settings()
    db  = get_supabase()

    segment_label = SEGMENT_CONTEXT.get(req.segment, req.segment)

    user_content = json.dumps(
        {
            "cliente": req.client_name,
            "email_cliente": req.client_email,
            "servico_solicitado": req.service,
            "segmento": segment_label,
            "empresa_prestadora": req.company_name or "InfraReport",
            "itens": [e.model_dump() for e in req.equipments],
            "observacoes_iniciais": req.notes or "",
            "validade_proposta_dias": req.validity_days or 30,
        },
        ensure_ascii=False,
    )

    client = anthropic.Anthropic(api_key=cfg.anthropic_api_key)
    message = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )
    raw = message.content[0].text.strip()

    content: ProposalContent | None = None
    try:
        validated = json.loads(raw)
        req.equipments = [Equipment(**e) for e in validated["equipments"]]
        content = ProposalContent(
            introduction=validated.get("introduction", ""),
            scope=validated.get("scope", ""),
            methodology=validated.get("methodology", ""),
            warranty=validated.get("warranty", ""),
            payment_terms=validated.get("payment_terms", ""),
            execution_deadline=validated.get("execution_deadline", ""),
            differentials=validated.get("differentials"),
            notes=validated.get("notes") or req.notes,
        )
        if content.notes and not req.notes:
            req.notes = content.notes
    except (json.JSONDecodeError, KeyError):
        pass

    proposal_id = uuid4()
    docx_path, total_value = generate_proposal_docx(req, proposal_id, content)

    file_record = register_file(
        user_id=req.user_id,
        file_path=docx_path,
        file_type="proposta",
        ref_id=proposal_id,
    )

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
        docx_url=f"/api/proposals/{proposal_id}/download",
        total_value=total_value,
        email_sent=email_sent,
        message=(
            f"Proposta gerada com sucesso! Total: R$ {total_value:,.2f}. "
            + ("E-mail enviado para " + req.client_email if email_sent else "Falha no envio do e-mail.")
        ),
    )
