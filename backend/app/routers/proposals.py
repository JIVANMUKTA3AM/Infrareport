import os
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from typing import Optional
from uuid import UUID
from app.models.proposal import ProposalRequest, ProposalResponse, ProposalChatRequest, ProposalChatResponse
from app.agents.commercial import run_commercial_agent, run_commercial_chat
from app.database import get_supabase
from app.config import get_settings
from app.services.email_sender import send_proposal_email

router = APIRouter(prefix="/api/proposals", tags=["proposals"])


@router.get("")
async def list_proposals(
    user_id: UUID = Query(..., description="ID do usuário"),
    status: Optional[str] = Query(None, description="Filtrar por status"),
):
    try:
        db = get_supabase()
        q = db.table("proposals").select("*").eq("user_id", str(user_id)).order("created_at", desc=True)
        if status:
            q = q.eq("status", status)
        result = q.execute()
        return result.data
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.patch("/{proposal_id}")
async def update_proposal_status(proposal_id: UUID, body: dict):
    allowed = {"pendente", "enviada", "aprovada", "rejeitada"}
    status  = body.get("status")
    # user_id vem do frontend só para lookup do Gmail — NÃO vai ao banco
    caller_user_id = body.get("user_id")

    if status and status not in allowed:
        raise HTTPException(status_code=422, detail=f"Status inválido: {status}")

    # Campos seguros para atualizar no banco (exclui user_id, id, created_at)
    _blocked = {"user_id", "id", "created_at"}
    update_data = {k: v for k, v in body.items() if k not in _blocked}

    try:
        db = get_supabase()
        result = db.table("proposals").update(update_data).eq("id", str(proposal_id)).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Proposta não encontrada")

        proposal   = result.data[0]
        email_sent = False

        if status == "aprovada":
            docx_path = proposal.get("docx_url")  # campo armazena o caminho no disco
            uid       = caller_user_id or str(proposal.get("user_id", ""))
            if docx_path and os.path.exists(docx_path):
                try:
                    await send_proposal_email(
                        to_email=proposal["client_email"],
                        client_name=proposal["client_name"],
                        service=proposal["service"],
                        docx_path=docx_path,
                        user_id=uid,
                        is_approval=True,
                    )
                    email_sent = True
                except Exception as exc:
                    print(f"[proposals] Falha ao enviar e-mail de aprovação: {exc}")

        return {**proposal, "email_sent": email_sent}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{proposal_id}/download")
async def download_proposal(proposal_id: UUID):
    cfg = get_settings()
    file_path = os.path.join(cfg.storage_path, f"proposta_{proposal_id}.docx")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    return FileResponse(
        file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=f"proposta_{proposal_id}.docx",
    )


@router.get("/{proposal_id}/download-pdf")
async def download_proposal_pdf(proposal_id: UUID):
    cfg = get_settings()
    file_path = os.path.join(cfg.storage_path, f"proposta_{proposal_id}.pdf")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="PDF não encontrado")
    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=f"proposta_{proposal_id}.pdf",
    )


@router.post("/generate", response_model=ProposalResponse)
async def generate_proposal(req: ProposalRequest):
    """Gera proposta DOCX+PDF via Agente Comercial e envia por e-mail."""
    try:
        return await run_commercial_agent(req)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/chat", response_model=ProposalChatResponse)
async def commercial_chat(req: ProposalChatRequest):
    """Agente Comercial conversacional com análise de imagens (visão de IA)."""
    try:
        result = await run_commercial_chat(
            user_id=req.user_id,
            messages=req.messages,
            current_message=req.current_message,
            images=req.images,
            company_name=req.company_name or "InfraReport",
        )
        return ProposalChatResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
