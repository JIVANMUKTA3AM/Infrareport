"""
Dashboard stats — calcula tudo diretamente (sem depender de RPC get_dashboard_stats).
Retorna dados reais de financial_entries + projects.
"""
import calendar as cal_mod
from datetime import date
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.database import get_supabase

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]

CAT_LABELS_IN  = {
    "receita":      "Serviço / OS",
    "contrato":     "Contrato Recorrente",
    "venda":        "Venda de Material",
    "adiantamento": "Adiantamento",
    "outro":        "Outro",
}

CAT_LABELS_EXP = {
    "material":         "Material / Insumos",
    "equipamento":      "Equipamentos",
    "mao_de_obra":      "Mão de Obra",
    "deslocamento":     "Deslocamento",
    "combustivel":      "Combustível",
    "alimentacao":      "Alimentação",
    "servico_terceiro": "Serviços Terceiros",
    "manutencao":       "Manutenção",
    "outro":            "Outro",
}


def _pct(curr: float, prev: float) -> float | None:
    if prev == 0:
        return None
    return round((curr - prev) / prev * 100, 1)


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

        # ── Todas as entradas do ano atual ────────────────────────────────
        year_res = (
            db.table("financial_entries")
            .select("type, value, category, date")
            .eq("user_id", str(user_id))
            .gte("date", f"{y}-01-01")
            .lte("date", f"{y}-12-31")
            .execute()
        )
        year_entries = year_res.data or []

        # ── Acumulado all-time via RPC (eficiente) ────────────────────────
        try:
            bal = db.rpc("get_balance", {"p_user_id": str(user_id)}).execute()
            acumulado = round(float(bal.data or 0), 2)
        except Exception:
            acumulado = round(
                sum(
                    float(e["value"]) if e["type"] == "entrada" else -float(e["value"])
                    for e in year_entries
                ), 2
            )

        # ── Monthly breakdown (12 meses do ano) ──────────────────────────
        monthly = []
        for mi in range(1, 13):
            tag    = f"{mi:02d}"
            mrows  = [e for e in year_entries if e["date"][5:7] == tag]
            ent    = round(sum(float(e["value"]) for e in mrows if e["type"] == "entrada"), 2)
            sai    = round(sum(float(e["value"]) for e in mrows if e["type"] == "saida"),   2)
            monthly.append({"mes": MONTHS_PT[mi - 1], "entradas": ent, "saidas": sai, "saldo": round(ent - sai, 2)})

        # ── KPIs do mês atual ─────────────────────────────────────────────
        curr_tag = f"{m:02d}"
        curr     = [e for e in year_entries if e["date"][5:7] == curr_tag]
        entradas = round(sum(float(e["value"]) for e in curr if e["type"] == "entrada"), 2)
        saidas   = round(sum(float(e["value"]) for e in curr if e["type"] == "saida"),   2)
        saldo    = round(entradas - saidas, 2)

        # ── KPIs do mês anterior (para %) ────────────────────────────────
        pm  = 12 if m == 1 else m - 1
        py  = y - 1 if m == 1 else y
        ptag = f"{pm:02d}"

        if py == y:
            prev = [e for e in year_entries if e["date"][5:7] == ptag]
        else:
            try:
                last_pm  = cal_mod.monthrange(py, pm)[1]
                prev_res = (
                    db.table("financial_entries")
                    .select("type, value")
                    .eq("user_id", str(user_id))
                    .gte("date", f"{py}-{ptag}-01")
                    .lte("date", f"{py}-{ptag}-{last_pm:02d}")
                    .execute()
                )
                prev = prev_res.data or []
            except Exception:
                prev = []

        prev_ent   = sum(float(e["value"]) for e in prev if e["type"] == "entrada")
        prev_sai   = sum(float(e["value"]) for e in prev if e["type"] == "saida")
        prev_saldo = prev_ent - prev_sai

        # ── Labels dinâmicos de categorias (usa DB se migration 010 aplicada) ──
        cat_map: dict[str, str] = {}
        try:
            cats_res = (
                db.table("financial_categories")
                .select("slug, name")
                .eq("user_id", str(user_id))
                .execute()
            )
            cat_map = {c["slug"]: c["name"] for c in (cats_res.data or [])}
        except Exception:
            pass

        def _label_exp(k: str) -> str:
            return cat_map.get(k) or CAT_LABELS_EXP.get(k, k)

        def _label_inc(k: str) -> str:
            return cat_map.get(k) or CAT_LABELS_IN.get(k, k)

        # ── Categorias de saída do mês (para PieChart Saídas) ────────────
        exp_cats: dict[str, float] = {}
        for e in curr:
            if e["type"] == "saida":
                cat = e.get("category") or "outro"
                exp_cats[cat] = round(exp_cats.get(cat, 0) + float(e["value"]), 2)
        categories = [
            {"category": _label_exp(k), "total": v}
            for k, v in exp_cats.items()
        ]

        # ── Categorias de entrada do mês (para PieChart Receitas) ────────
        inc_cats: dict[str, float] = {}
        for e in curr:
            if e["type"] == "entrada":
                cat = e.get("category") or "outro"
                inc_cats[cat] = round(inc_cats.get(cat, 0) + float(e["value"]), 2)
        receita_tipos = [
            {"category": _label_inc(k), "total": v}
            for k, v in inc_cats.items()
        ]

        has_data = len(year_entries) > 0 or acumulado != 0

        stats: dict = {
            "has_data":       has_data,
            "entradas":       entradas,
            "saidas":         saidas,
            "saldo":          saldo,
            "acumulado":      acumulado,
            "entradas_pct":   _pct(entradas, prev_ent),
            "saidas_pct":     _pct(saidas, prev_sai),
            "saldo_pct":      _pct(saldo, prev_saldo),
            "acumulado_pct":  None,
            "monthly":        monthly,
            "categories":     categories,
            "receita_tipos":  receita_tipos,
        }

        # ── Projetos (requer migração 006) ───────────────────────────────
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
            raw_projects = proj_result.data or []

            # Custo real: soma de saídas vinculadas ao projeto
            proj_costs: dict[str, float] = {}
            if raw_projects:
                pids = [p["id"] for p in raw_projects]
                try:
                    costs_res = (
                        db.table("financial_entries")
                        .select("project_id, value")
                        .eq("user_id", str(user_id))
                        .eq("type", "saida")
                        .in_("project_id", pids)
                        .execute()
                    )
                    for e in (costs_res.data or []):
                        pid = e["project_id"]
                        proj_costs[pid] = round(proj_costs.get(pid, 0) + float(e["value"]), 2)
                except Exception:
                    pass

            projects_data   = []
            active_count    = 0
            completed_count = 0

            for p in raw_projects:
                rev        = float(p.get("revenue") or 0)
                mat        = float(p.get("material_cost") or 0)
                lab        = float(p.get("labor_cost") or 0)
                manual_cost = mat + lab
                real_cost   = proj_costs.get(p["id"], 0)
                # Use real entries cost if any entries exist; fall back to manual fields
                cost   = real_cost if real_cost > 0 else manual_cost
                margin = round((rev - cost) / rev * 100, 1) if rev > 0 else 0.0

                projects_data.append({
                    "id":        p["id"],
                    "name":      p["name"],
                    "client":    p.get("client", ""),
                    "revenue":   rev,
                    "cost":      cost,
                    "margin":    margin,
                    "status":    p["status"],
                    "segment":   p.get("segment", ""),
                    "has_entries": real_cost > 0,
                })
                if p["status"] == "em_andamento":
                    active_count += 1
                else:
                    completed_count += 1

            stats["projects"] = {
                "active":    active_count,
                "completed": completed_count,
                "list":      projects_data,
            }
        except Exception:
            pass

        return stats

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
