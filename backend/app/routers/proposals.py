from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from uuid import UUID
from app.models.proposal import ProposalRequest, ProposalResponse
from app.agents.commercial import run_commercial_agent
from app.database import get_supabase

router = APIRouter(prefix="/api/proposals", tags=["proposals"])


@router.get("")
async def list_proposals(
    user_id: UUID = Query(..., description="ID do usuário"),
    status: Optional[str] = Query(None, description="Filtrar por status"),
):
    """Lista propostas do usuário, opcionalmente filtradas por status."""
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
    """Atualiza status de uma proposta (aprovada / rejeitada)."""
    allowed = {"aprovada", "rejeitada", "enviada", "pendente"}
    status = body.get("status")
    if status and status not in allowed:
        raise HTTPException(status_code=422, detail=f"Status inválido: {status}")
    try:
        db = get_supabase()
        result = db.table("proposals").update(body).eq("id", str(proposal_id)).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Proposta não encontrada")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/generate", response_model=ProposalResponse)
async def generate_proposal(req: ProposalRequest):
    """Gera proposta .docx via Agente Comercial e envia por e-mail."""
    try:
        return await run_commercial_agent(req)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
