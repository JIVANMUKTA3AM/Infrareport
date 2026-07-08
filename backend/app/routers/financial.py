"""
Router Financeiro — CRUD de lançamentos + Agente IA.
"""
import calendar as cal_mod
from datetime import date as date_cls
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.agents.financial import run_financial_agent
from app.database import get_supabase
from app.models.financial import EntryCreate, FinancialMessageRequest, FinancialMessageResponse

router = APIRouter(prefix="/api/financial", tags=["financial"])

MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]


# ── LIST ──────────────────────────────────────────────────────────────────────

@router.get("/entries")
async def list_entries(
    user_id:    UUID            = Query(...),
    type:       Optional[str]   = Query(None),
    month:      Optional[int]   = Query(None),
    year:       Optional[int]   = Query(None),
    category:   Optional[str]   = Query(None),
    project_id: Optional[UUID]  = Query(None),
    search:     Optional[str]   = Query(None),
    limit:      int             = Query(default=200),
    offset:     int             = Query(default=0),
):
    try:
        db = get_supabase()
        q  = db.table("financial_entries").select("*").eq("user_id", str(user_id))

        if type:       q = q.eq("type", type)
        if category:   q = q.eq("category", category)
        if project_id: q = q.eq("project_id", str(project_id))
        if month and year:
            last = cal_mod.monthrange(year, month)[1]
            q = q.gte("date", f"{year:04d}-{month:02d}-01")
            q = q.lte("date", f"{year:04d}-{month:02d}-{last:02d}")
        elif year:
            q = q.gte("date", f"{year:04d}-01-01").lte("date", f"{year:04d}-12-31")
        if search:
            q = q.ilike("description", f"%{search}%")

        result = (
            q.order("date", desc=True)
             .order("created_at", desc=True)
             .range(offset, offset + limit - 1)
             .execute()
        )
        return result.data or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── CREATE ────────────────────────────────────────────────────────────────────

@router.post("/entries")
async def create_entry(body: EntryCreate):
    try:
        db  = get_supabase()
        row = {
            "user_id":     str(body.user_id),
            "type":        body.type,
            "value":       body.value,
            "category":    body.category,
            "description": body.description,
            "date":        (body.date or date_cls.today()).isoformat(),
            "project_id":  str(body.project_id) if body.project_id else None,
        }
        # Colunas adicionadas pela migração 008 — graceful fallback se ainda não aplicada
        try:
            row["payment_method"] = body.payment_method
            if body.attachment_url:
                row["attachment_url"] = body.attachment_url
            result = db.table("financial_entries").insert(row).execute()
        except Exception:
            row.pop("payment_method", None)
            row.pop("attachment_url", None)
            result = db.table("financial_entries").insert(row).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Falha ao criar lançamento")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── UPDATE ────────────────────────────────────────────────────────────────────

@router.patch("/entries/{entry_id}")
async def update_entry(entry_id: UUID, body: dict):
    blocked = {"id", "user_id", "created_at"}
    data = {k: v for k, v in body.items() if k not in blocked}
    if "date" in data and hasattr(data["date"], "isoformat"):
        data["date"] = data["date"].isoformat()
    try:
        db     = get_supabase()
        result = db.table("financial_entries").update(data).eq("id", str(entry_id)).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Lançamento não encontrado")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── DELETE ────────────────────────────────────────────────────────────────────

@router.delete("/entries/{entry_id}")
async def delete_entry(entry_id: UUID, user_id: UUID = Query(...)):
    try:
        db = get_supabase()
        db.table("financial_entries").delete().eq("id", str(entry_id)).eq("user_id", str(user_id)).execute()
        return {"ok": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── SUMMARY (sidebar AgenteFinanceiro) ───────────────────────────────────────

@router.get("/summary")
async def get_summary(
    user_id: UUID          = Query(...),
    month:   Optional[int] = Query(None),
    year:    Optional[int] = Query(None),
):
    try:
        db    = get_supabase()
        today = date_cls.today()
        m     = month or today.month
        y     = year  or today.year
        last  = cal_mod.monthrange(y, m)[1]

        month_res = (
            db.table("financial_entries")
            .select("type, value")
            .eq("user_id", str(user_id))
            .gte("date", f"{y:04d}-{m:02d}-01")
            .lte("date", f"{y:04d}-{m:02d}-{last:02d}")
            .execute()
        )
        rows     = month_res.data or []
        entradas = round(sum(float(r["value"]) for r in rows if r["type"] == "entrada"), 2)
        saidas   = round(sum(float(r["value"]) for r in rows if r["type"] == "saida"),   2)
        saldo    = round(entradas - saidas, 2)

        bal_res   = db.rpc("get_balance", {"p_user_id": str(user_id)}).execute()
        acumulado = round(float(bal_res.data or 0), 2)

        return {
            "month":      m,
            "year":       y,
            "month_name": MONTHS_PT[m - 1],
            "entradas":   entradas,
            "saidas":     saidas,
            "saldo":      saldo,
            "acumulado":  acumulado,
            "has_data":   len(rows) > 0 or acumulado != 0,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── AGENT ─────────────────────────────────────────────────────────────────────

@router.post("/message", response_model=FinancialMessageResponse)
async def financial_message(req: FinancialMessageRequest):
    try:
        return await run_financial_agent(req)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
