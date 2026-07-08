"""
Router Categorias — CRUD de categorias financeiras por usuário.
Auto-seed com padrões na primeira requisição.
"""
import re
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.database import get_supabase
from app.models.category import CategoryCreate, CategoryUpdate, CategoryMerge

router = APIRouter(prefix="/api/categories", tags=["categories"])

DEFAULT_CATEGORIES = [
    # ── Entradas ────────────────────────────────────────────────────────────
    {"type": "entrada", "slug": "receita",       "name": "Serviço / OS",        "color": "#3B82F6", "icon": "🔧", "sort_order": 1,  "is_default": True},
    {"type": "entrada", "slug": "contrato",      "name": "Contrato Recorrente", "color": "#10B981", "icon": "📋", "sort_order": 2,  "is_default": True},
    {"type": "entrada", "slug": "venda",         "name": "Venda de Material",   "color": "#F59E0B", "icon": "📦", "sort_order": 3,  "is_default": True},
    {"type": "entrada", "slug": "adiantamento",  "name": "Adiantamento",        "color": "#8B5CF6", "icon": "💰", "sort_order": 4,  "is_default": True},
    {"type": "entrada", "slug": "outro",         "name": "Outro",               "color": "#64748B", "icon": "➕", "sort_order": 99, "is_default": True},
    # ── Saídas ─────────────────────────────────────────────────────────────
    {"type": "saida",   "slug": "material",         "name": "Material / Insumos", "color": "#EF4444", "icon": "🪛", "sort_order": 1,  "is_default": True},
    {"type": "saida",   "slug": "equipamento",      "name": "Equipamentos",       "color": "#F97316", "icon": "🔌", "sort_order": 2,  "is_default": True},
    {"type": "saida",   "slug": "mao_de_obra",      "name": "Mão de Obra",        "color": "#3B82F6", "icon": "👷", "sort_order": 3,  "is_default": True},
    {"type": "saida",   "slug": "deslocamento",     "name": "Deslocamento",       "color": "#10B981", "icon": "🚗", "sort_order": 4,  "is_default": True},
    {"type": "saida",   "slug": "combustivel",      "name": "Combustível",        "color": "#F59E0B", "icon": "⛽", "sort_order": 5,  "is_default": True},
    {"type": "saida",   "slug": "alimentacao",      "name": "Alimentação",        "color": "#8B5CF6", "icon": "🍽️", "sort_order": 6,  "is_default": True},
    {"type": "saida",   "slug": "servico_terceiro", "name": "Serviços Terceiros", "color": "#06B6D4", "icon": "🤝", "sort_order": 7,  "is_default": True},
    {"type": "saida",   "slug": "manutencao",       "name": "Manutenção",         "color": "#EC4899", "icon": "🔧", "sort_order": 8,  "is_default": True},
    {"type": "saida",   "slug": "outro",            "name": "Outro",              "color": "#64748B", "icon": "➕", "sort_order": 99, "is_default": True},
]


def _slug(name: str) -> str:
    s = name.lower().strip()
    for src, dst in [
        ('á','a'),('à','a'),('â','a'),('ã','a'),('ä','a'),
        ('é','e'),('è','e'),('ê','e'),('ë','e'),
        ('í','i'),('ì','i'),('î','i'),('ï','i'),
        ('ó','o'),('ò','o'),('ô','o'),('õ','o'),('ö','o'),
        ('ú','u'),('ù','u'),('û','u'),('ü','u'),
        ('ç','c'),('ñ','n'),
    ]:
        s = s.replace(src, dst)
    s = re.sub(r'\s+', '_', s)
    s = re.sub(r'[^a-z0-9_]', '', s)
    return (s[:40] or 'outro')


def _seed(db, user_id: str) -> list:
    rows = [{"user_id": user_id, **d} for d in DEFAULT_CATEGORIES]
    return db.table("financial_categories").insert(rows).execute().data or []


def _usage_counts(db, user_id: str) -> dict[str, int]:
    res = db.table("financial_entries").select("category").eq("user_id", user_id).execute()
    counts: dict[str, int] = {}
    for e in (res.data or []):
        k = e.get("category") or "outro"
        counts[k] = counts.get(k, 0) + 1
    return counts


# ── LIST ──────────────────────────────────────────────────────────────────────

@router.get("")
async def list_categories(
    user_id: UUID = Query(...),
    type:    Optional[str] = Query(None),
):
    try:
        db = get_supabase()
        q  = db.table("financial_categories").select("*").eq("user_id", str(user_id))
        if type:
            q = q.eq("type", type)
        result = q.order("sort_order").order("name").execute()
        cats   = result.data or []

        # Auto-seed defaults on first access
        if not cats:
            cats = _seed(db, str(user_id))
            if type:
                cats = [c for c in cats if c["type"] == type]

        counts = _usage_counts(db, str(user_id))
        for cat in cats:
            cat["usage_count"] = counts.get(cat["slug"], 0)

        return cats
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── CREATE ────────────────────────────────────────────────────────────────────

@router.post("")
async def create_category(body: CategoryCreate):
    try:
        db   = get_supabase()
        base = _slug(body.name)
        slug = base
        i    = 2
        while True:
            ck = (
                db.table("financial_categories")
                .select("id")
                .eq("user_id", str(body.user_id))
                .eq("type", body.type)
                .eq("slug", slug)
                .execute()
            )
            if not ck.data:
                break
            slug = f"{base}_{i}"
            i   += 1

        row = {
            "user_id":    str(body.user_id),
            "type":       body.type,
            "name":       body.name,
            "slug":       slug,
            "color":      body.color,
            "icon":       body.icon,
            "sort_order": body.sort_order,
            "is_default": False,
        }
        result = db.table("financial_categories").insert(row).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Falha ao criar categoria")
        cat = result.data[0]
        cat["usage_count"] = 0
        return cat
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── UPDATE ────────────────────────────────────────────────────────────────────

@router.patch("/{cat_id}")
async def update_category(cat_id: UUID, body: CategoryUpdate):
    _blocked = {"id", "user_id", "slug", "type", "is_default", "created_at"}
    data = {k: v for k, v in body.model_dump(exclude_none=True).items() if k not in _blocked}
    if not data:
        raise HTTPException(status_code=400, detail="Nada para atualizar")
    try:
        db     = get_supabase()
        result = db.table("financial_categories").update(data).eq("id", str(cat_id)).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Categoria não encontrada")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── DELETE (guard: 409 se em uso) ─────────────────────────────────────────────

@router.delete("/{cat_id}")
async def delete_category(cat_id: UUID, user_id: UUID = Query(...)):
    try:
        db = get_supabase()
        cat_res = (
            db.table("financial_categories").select("*")
            .eq("id", str(cat_id)).single().execute()
        )
        if not cat_res.data:
            raise HTTPException(status_code=404, detail="Categoria não encontrada")
        cat = cat_res.data

        entry_res = (
            db.table("financial_entries").select("id")
            .eq("user_id", str(user_id))
            .eq("category", cat["slug"])
            .execute()
        )
        count = len(entry_res.data or [])
        if count > 0:
            raise HTTPException(
                status_code=409,
                detail={"message": f"Categoria em uso em {count} lançamentos", "usage_count": count},
            )

        db.table("financial_categories").delete().eq("id", str(cat_id)).execute()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── MERGE + DELETE ────────────────────────────────────────────────────────────

@router.post("/{cat_id}/merge")
async def merge_category(cat_id: UUID, body: CategoryMerge):
    try:
        db = get_supabase()

        src_res = (
            db.table("financial_categories").select("*")
            .eq("id", str(cat_id)).single().execute()
        )
        if not src_res.data:
            raise HTTPException(status_code=404, detail="Categoria origem não encontrada")
        src = src_res.data

        tgt_res = (
            db.table("financial_categories").select("*")
            .eq("id", str(body.target_id)).single().execute()
        )
        if not tgt_res.data:
            raise HTTPException(status_code=404, detail="Categoria destino não encontrada")
        tgt = tgt_res.data

        if src["type"] != tgt["type"]:
            raise HTTPException(status_code=400, detail="Tipos diferentes — não é possível mesclar")

        # Reatribui lançamentos
        db.table("financial_entries").update({"category": tgt["slug"]}).eq("user_id", str(body.user_id)).eq("category", src["slug"]).execute()

        # Remove categoria origem
        db.table("financial_categories").delete().eq("id", str(cat_id)).execute()

        return {"ok": True, "reassigned_to": tgt["slug"]}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
