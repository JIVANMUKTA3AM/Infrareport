from fastapi import APIRouter, HTTPException
from app.models.technical import TechnicalChatRequest, TechnicalChatResponse
from app.agents.technical import run_technical_agent

router = APIRouter(prefix="/api/technical", tags=["technical"])


@router.post("/chat", response_model=TechnicalChatResponse)
async def technical_chat(req: TechnicalChatRequest):
    """
    Agente Técnico — responde dúvidas, gera laudos e relatórios técnicos
    para todos os nichos de infraestrutura do InfraReport.
    """
    try:
        return await run_technical_agent(req)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
