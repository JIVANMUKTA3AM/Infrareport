from fastapi import APIRouter, HTTPException
from app.models.financial import FinancialMessageRequest, FinancialMessageResponse
from app.agents.financial import run_financial_agent

router = APIRouter(prefix="/api/financial", tags=["financial"])


@router.post("/message", response_model=FinancialMessageResponse)
async def financial_message(req: FinancialMessageRequest):
    """
    Interpreta mensagem em linguagem natural e registra lançamento financeiro.
    """
    try:
        return await run_financial_agent(req)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
