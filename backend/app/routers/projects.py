"""
Módulo Projetos / OS — CRUD completo + encerramento com PDF.
"""
import json
from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from app.database import get_supabase
from app.models.project import ProjectCreate, compute_extras
from app.services.report_generator import generate_project_report

router = APIRouter(prefix="/api/projects", tags=["projects"])

VALID_STATUSES = {"aguardando", "em_andamento", "concluido", "cancelado"}


def _enrich(p: dict) -> dict:
    return compute_extras(p)


def _serialize_row(body: dict) -> dict:
    """Prepara campos para escrita no banco (serializa datas e jsonb)."""
    row = dict(body)
    if "team" in row and isinstance(row["team"], list):
        row["team"] = json.dumps(row["team"])
    for f in ("start_date", "expected_end_date", "end_date"):
        if f in row and row[f] is not None and hasattr(row[f], "isoformat"):
            row[f] = row[f].isoformat()
    return row


def _add_history(db, project_id: str, user_id: str,
                 status_from: Optional[str], status_to: Optional[str],
                 note: str = "") -> None:
    try:
        db.table("project_history").insert({
            "project_id":  project_id,
            "user_id":     user_id,
            "status_from": status_from,
            "status_to":   status_to,
            "note":        note or "",
        }).execute()
    except Exception:
        pass  # histórico não bloqueia a operação principal


# ── LIST ──────────────────────────────────────────────────────────────────────

@router.get("")
async def list_projects(
    user_id: UUID           = Query(...),
    status:  Optional[str]  = Query(None),
    client:  Optional[str]  = Query(None),
    start:   Optional[date] = Query(None),
    end:     Optional[date] = Query(None),
):
    try:
        db = get_supabase()
        q  = (db.table("projects")
                .select("*")
                .eq("user_id", str(user_id))
                .order("created_at", desc=True))
        if status:
            q = q.eq("status", status)
        if client:
            q = q.ilike("client", f"%{client}%")
        if start:
            q = q.gte("created_at", start.isoformat())
        if end:
            q = q.lte("created_at", (end.isoformat() + "T23:59:59"))
        result = q.execute()
        return [_enrich(p) for p in result.data]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── CREATE ────────────────────────────────────────────────────────────────────

@router.post("")
async def create_project(body: ProjectCreate):
    try:
        db  = get_supabase()
        row = _serialize_row({
            "user_id":           str(body.user_id),
            "name":              body.name,
            "client":            body.client,
            "address":           body.address,
            "scope":             body.scope,
            "revenue":           body.revenue,
            "material_cost":     body.material_cost,
            "labor_cost":        body.labor_cost,
            "start_date":        body.start_date,
            "expected_end_date": body.expected_end_date,
            "team":              body.team,
            "notes":             body.notes,
            "proposal_id":       str(body.proposal_id) if body.proposal_id else None,
            "segment":           body.segment,
            "status":            body.status,
        })
        result = db.table("projects").insert(row).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Falha ao criar projeto")
        proj = result.data[0]
        _add_history(db, proj["id"], str(body.user_id), None, body.status, "Projeto criado")
        return _enrich(proj)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── GET ───────────────────────────────────────────────────────────────────────

@router.get("/{project_id}")
async def get_project(project_id: UUID, user_id: UUID = Query(...)):
    try:
        db     = get_supabase()
        result = (db.table("projects")
                    .select("*")
                    .eq("id", str(project_id))
                    .eq("user_id", str(user_id))
                    .single()
                    .execute())
        if not result.data:
            raise HTTPException(status_code=404, detail="Projeto não encontrado")
        return _enrich(result.data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── UPDATE ────────────────────────────────────────────────────────────────────

@router.patch("/{project_id}")
async def update_project(project_id: UUID, body: dict):
    # Extrai metadados que não vão ao banco
    user_id    = body.pop("user_id", None)
    old_status = body.pop("_old_status", None)
    new_status = body.get("status")

    if new_status and new_status not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail=f"Status inválido: {new_status}")

    _blocked = {"id", "created_at"}
    update_data = _serialize_row({k: v for k, v in body.items() if k not in _blocked})

    try:
        db     = get_supabase()
        result = (db.table("projects")
                    .update(update_data)
                    .eq("id", str(project_id))
                    .execute())
        if not result.data:
            raise HTTPException(status_code=404, detail="Projeto não encontrado")
        proj = result.data[0]
        if new_status and user_id and new_status != old_status:
            _add_history(db, str(project_id), str(user_id), old_status, new_status)
        return _enrich(proj)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── CLOSE (encerra OS e gera PDF) ────────────────────────────────────────────

@router.post("/{project_id}/close")
async def close_project(project_id: UUID, body: dict):
    user_id = body.get("user_id")
    note    = body.get("note", "OS encerrada")

    try:
        db = get_supabase()

        res = (db.table("projects")
                 .select("*")
                 .eq("id", str(project_id))
                 .single()
                 .execute())
        if not res.data:
            raise HTTPException(status_code=404, detail="Projeto não encontrado")
        proj = res.data

        fin = (db.table("financial_entries")
                 .select("*")
                 .eq("project_id", str(project_id))
                 .order("date")
                 .execute())

        report_path = None
        try:
            report_path = await generate_project_report(proj, fin.data or [])
        except Exception as exc:
            print(f"[projects] Falha ao gerar relatório PDF: {exc}")

        update = {"status": "concluido", "end_date": date.today().isoformat()}
        if report_path:
            update["report_url"] = report_path

        updated = db.table("projects").update(update).eq("id", str(project_id)).execute()
        _add_history(db, str(project_id), str(user_id) if user_id else "", proj.get("status"), "concluido", note)

        return _enrich(updated.data[0])
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── FINANCEIRO (lançamentos vinculados) ───────────────────────────────────────

@router.get("/{project_id}/financeiro")
async def get_project_financeiro(project_id: UUID, user_id: UUID = Query(...)):
    try:
        db     = get_supabase()
        result = (db.table("financial_entries")
                    .select("*")
                    .eq("project_id", str(project_id))
                    .eq("user_id", str(user_id))
                    .order("date", desc=True)
                    .execute())
        return result.data
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── ARQUIVOS vinculados ───────────────────────────────────────────────────────

@router.get("/{project_id}/arquivos")
async def get_project_arquivos(project_id: UUID, user_id: UUID = Query(...)):
    try:
        db     = get_supabase()
        result = (db.table("files")
                    .select("*")
                    .eq("ref_id", str(project_id))
                    .eq("user_id", str(user_id))
                    .execute())
        return result.data
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── HISTÓRICO ─────────────────────────────────────────────────────────────────

@router.get("/{project_id}/historico")
async def get_project_historico(project_id: UUID, user_id: UUID = Query(...)):
    try:
        db     = get_supabase()
        result = (db.table("project_history")
                    .select("*")
                    .eq("project_id", str(project_id))
                    .order("created_at", desc=False)
                    .execute())
        return result.data
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── DOWNLOAD RELATÓRIO ────────────────────────────────────────────────────────

@router.get("/{project_id}/report")
async def download_report(project_id: UUID):
    import os
    db  = get_supabase()
    res = (db.table("projects")
             .select("report_url, name")
             .eq("id", str(project_id))
             .single()
             .execute())
    if not res.data or not res.data.get("report_url"):
        raise HTTPException(status_code=404, detail="Relatório não encontrado")
    path = res.data["report_url"]
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Arquivo do relatório não encontrado no servidor")
    return FileResponse(
        path,
        media_type="application/pdf",
        filename=f"relatorio_{project_id}.pdf",
    )
