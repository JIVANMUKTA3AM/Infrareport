import json
import os
from datetime import date
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


def _normalize_proposal(row: dict) -> dict:
    """Garante que campos JSON/array sejam sempre listas — nunca strings."""
    eq = row.get("equipments")
    if isinstance(eq, str):
        try:
            row["equipments"] = json.loads(eq)
        except Exception:
            row["equipments"] = []
    elif not isinstance(eq, list):
        row["equipments"] = []
    return row


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
        return [_normalize_proposal(row) for row in (result.data or [])]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("")
async def create_proposal_manual(body: dict):
    """Cria proposta manualmente (sem IA)."""
    user_id = body.get("user_id")
    if not user_id:
        raise HTTPException(status_code=422, detail="user_id obrigatório")
    if not body.get("client_name"):
        raise HTTPException(status_code=422, detail="client_name obrigatório")
    if not body.get("service"):
        raise HTTPException(status_code=422, detail="service obrigatório")

    row = {
        "user_id":      str(user_id),
        "client_name":  body["client_name"],
        "client_email": body.get("client_email", ""),
        "client_phone": body.get("client_phone", ""),
        "service":      body["service"],
        "value":        float(body.get("value") or 0),
        "notes":        body.get("notes", ""),
        "status":       body.get("status", "pendente"),
        "segment":      body.get("segment", ""),
        "equipments":   json.dumps(body.get("equipments", [])),
    }
    try:
        db = get_supabase()
        result = db.table("proposals").insert(row).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Falha ao criar proposta")
        return _normalize_proposal(result.data[0])
    except HTTPException:
        raise
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
            docx_path = proposal.get("docx_url")
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

            # Auto-cria Projeto/OS vinculado à proposta aprovada
            _auto_create_project(db, proposal, uid)

        return {**proposal, "email_sent": email_sent}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


def _auto_create_project(db, proposal: dict, user_id: str) -> None:
    """Cria automaticamente um Projeto/OS quando uma proposta é aprovada."""
    try:
        # Verifica se já existe projeto vinculado a esta proposta
        exists = (
            db.table("projects")
            .select("id")
            .eq("proposal_id", proposal["id"])
            .limit(1)
            .execute()
        )
        if exists.data:
            return  # já foi criado anteriormente

        equipments = proposal.get("equipments") or []
        if isinstance(equipments, str):
            try:
                equipments = json.loads(equipments)
            except Exception:
                equipments = []

        scope_items = [e.get("description", "") for e in equipments if e.get("description")]
        scope = f"Serviço: {proposal['service']}"
        if scope_items:
            scope += "\n\nItens:\n• " + "\n• ".join(scope_items)

        project_name = f"OS – {proposal['service']} | {proposal['client_name']}"

        db.table("projects").insert({
            "user_id":     user_id,
            "name":        project_name,
            "client":      proposal["client_name"],
            "revenue":     float(proposal.get("value") or 0),
            "scope":       scope,
            "segment":     proposal.get("segment"),
            "proposal_id": proposal["id"],
            "status":      "em_andamento",
            "start_date":  date.today().isoformat(),
            "team":        json.dumps([]),
        }).execute()
    except Exception as exc:
        # Não interrompe o fluxo principal se o projeto falhar
        print(f"[proposals] Falha ao auto-criar projeto: {exc}")


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
