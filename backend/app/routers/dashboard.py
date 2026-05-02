"""
Router do Dashboard — retorna estatísticas reais do usuário via RPC Supabase.
"""
from datetime import date
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query
from app.database import get_supabase

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_stats(
    user_id: UUID = Query(...),
    month:   int  = Query(default=None),
    year:    int  = Query(default=None),
):
    """
    Retorna KPIs, gráfico mensal, categorias de saída e resumo de propostas.
    Dados reais da conta do usuário — zero mock.
    """
    today = date.today()
    m = month or today.month
    y = year  or today.year

    try:
        db     = get_supabase()
        result = db.rpc(
            "get_dashboard_stats",
            {"p_user_id": str(user_id), "p_month": m, "p_year": y}
        ).execute()
        return result.data
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
