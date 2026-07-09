"""
Rotas para geração de relatórios (PDF e XLSX).
POST /api/reports/financeiro
POST /api/reports/projetos
POST /api/reports/propostas
"""
from datetime import date
from pathlib import Path
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import get_settings
from app.database import get_supabase
from app.services.file_storage import register_file
from app.services.reports_generator import (
    pdf_financeiro, pdf_projetos, pdf_propostas,
    xlsx_financeiro, xlsx_projetos, xlsx_propostas,
)

router = APIRouter(prefix="/api/reports", tags=["reports"])
cfg    = get_settings()


class FinanceiroRequest(BaseModel):
    user_id:   UUID
    format:    str = "pdf"   # "pdf" | "xlsx"
    date_from: Optional[date] = None
    date_to:   Optional[date] = None
    category:  Optional[str] = None
    project_id: Optional[str] = None


class ProjetosRequest(BaseModel):
    user_id:   UUID
    format:    str = "pdf"
    date_from: Optional[date] = None
    date_to:   Optional[date] = None
    status:    Optional[str] = None
    client:    Optional[str] = None


class PropostasRequest(BaseModel):
    user_id:   UUID
    format:    str = "pdf"
    date_from: Optional[date] = None
    date_to:   Optional[date] = None
    status:    Optional[str] = None
    client:    Optional[str] = None


# ── FINANCEIRO ────────────────────────────────────────────────────────────────

@router.post("/financeiro")
async def generate_financeiro(body: FinanceiroRequest):
    db  = get_supabase()
    uid = str(body.user_id)

    q = db.table("financial_entries").select("*").eq("user_id", uid)
    if body.date_from:
        q = q.gte("date", body.date_from.isoformat())
    if body.date_to:
        q = q.lte("date", body.date_to.isoformat())
    if body.category:
        q = q.eq("category", body.category)
    if body.project_id:
        q = q.eq("project_id", body.project_id)
    entries = (q.order("date", desc=False).execute().data or [])

    # Category name map
    cat_map: dict[str, str] = {}
    try:
        cats = db.table("financial_categories").select("slug, name").eq("user_id", uid).execute()
        cat_map = {c["slug"]: c["name"] for c in (cats.data or [])}
    except Exception:
        pass

    storage = Path(cfg.storage_path)

    try:
        if body.format == "xlsx":
            path = xlsx_financeiro(storage, uid, entries, cat_map, body.date_from, body.date_to)
            mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        else:
            path = await pdf_financeiro(cfg.gotenberg_url, storage, uid, entries, cat_map, body.date_from, body.date_to)
            mime = "application/pdf"
    except Exception as e:
        raise HTTPException(502, f"Erro ao gerar relatório: {e}")

    record = register_file(body.user_id, path, "relatorio")
    return {
        "file_id":      record["id"],
        "file_name":    record["file_name"],
        "download_url": f"/files/{record['id']}/download?user_id={uid}",
        "size_bytes":   record["size_bytes"],
    }


# ── PROJETOS ──────────────────────────────────────────────────────────────────

@router.post("/projetos")
async def generate_projetos(body: ProjetosRequest):
    db  = get_supabase()
    uid = str(body.user_id)

    q = db.table("projects").select("*").eq("user_id", uid)
    if body.status:
        q = q.eq("status", body.status)
    if body.client:
        q = q.ilike("client", f"%{body.client}%")
    if body.date_from:
        q = q.gte("start_date", body.date_from.isoformat())
    if body.date_to:
        q = q.lte("start_date", body.date_to.isoformat())
    projects = (q.order("created_at", desc=False).execute().data or [])

    storage = Path(cfg.storage_path)

    try:
        if body.format == "xlsx":
            path = xlsx_projetos(storage, uid, projects, body.date_from, body.date_to)
        else:
            path = await pdf_projetos(cfg.gotenberg_url, storage, uid, projects, body.date_from, body.date_to)
    except Exception as e:
        raise HTTPException(502, f"Erro ao gerar relatório: {e}")

    record = register_file(body.user_id, path, "relatorio")
    return {
        "file_id":      record["id"],
        "file_name":    record["file_name"],
        "download_url": f"/files/{record['id']}/download?user_id={uid}",
        "size_bytes":   record["size_bytes"],
    }


# ── PROPOSTAS ─────────────────────────────────────────────────────────────────

@router.post("/propostas")
async def generate_propostas(body: PropostasRequest):
    db  = get_supabase()
    uid = str(body.user_id)

    q = db.table("proposals").select("*").eq("user_id", uid)
    if body.status:
        q = q.eq("status", body.status)
    if body.client:
        q = q.ilike("client_name", f"%{body.client}%")
    if body.date_from:
        q = q.gte("created_at", body.date_from.isoformat())
    if body.date_to:
        # include full day
        q = q.lte("created_at", f"{body.date_to.isoformat()}T23:59:59")
    proposals = (q.order("created_at", desc=False).execute().data or [])

    storage = Path(cfg.storage_path)

    try:
        if body.format == "xlsx":
            path = xlsx_propostas(storage, uid, proposals, body.date_from, body.date_to)
        else:
            path = await pdf_propostas(cfg.gotenberg_url, storage, uid, proposals, body.date_from, body.date_to)
    except Exception as e:
        raise HTTPException(502, f"Erro ao gerar relatório: {e}")

    record = register_file(body.user_id, path, "relatorio")
    return {
        "file_id":      record["id"],
        "file_name":    record["file_name"],
        "download_url": f"/files/{record['id']}/download?user_id={uid}",
        "size_bytes":   record["size_bytes"],
    }
