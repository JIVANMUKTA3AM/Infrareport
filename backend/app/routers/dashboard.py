"""
Router do Dashboard — retorna estatísticas reais via RPC Supabase
e injeta dados de projetos com margem calculada (defensivo: suporta
banco sem a migração 006 aplicada).
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
    today = date.today()
    m = month or today.month
    y = year  or today.year

    try:
        db = get_supabase()

        rpc_result = db.rpc(
            "get_dashboard_stats",
            {"p_user_id": str(user_id), "p_month": m, "p_year": y}
        ).execute()
        stats = rpc_result.data or {}

        # Tenta enriquecer com dados reais de projetos (requer migração 006)
        try:
            proj_result = (
                db.table("projects")
                .select("id, name, client, revenue, material_cost, labor_cost, status, segment")
                .eq("user_id", str(user_id))
                .in_("status", ["em_andamento", "concluido"])
                .order("created_at", desc=True)
                .limit(10)
                .execute()
            )

            projects_data = []
            active_count    = 0
            completed_count = 0

            for p in (proj_result.data or []):
                rev  = float(p.get("revenue") or 0)
                mat  = float(p.get("material_cost") or 0)
                lab  = float(p.get("labor_cost") or 0)
                cost = mat + lab
                margin = round((rev - cost) / rev * 100, 1) if rev > 0 else 0.0

                projects_data.append({
                    "id":      p["id"],
                    "name":    p["name"],
                    "client":  p.get("client", ""),
                    "revenue": rev,
                    "cost":    cost,
                    "margin":  margin,
                    "status":  p["status"],
                    "segment": p.get("segment", ""),
                })

                if p["status"] == "em_andamento":
                    active_count += 1
                else:
                    completed_count += 1

            if isinstance(stats, dict):
                stats["projects"] = {
                    "active":    active_count,
                    "completed": completed_count,
                    "list":      projects_data,
                }

        except Exception:
            pass  # migração 006 ainda não foi aplicada — retorna dados do RPC sem projetos

        return stats
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
