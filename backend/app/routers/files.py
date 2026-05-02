"""
Router de arquivos — download seguro com verificação de propriedade.

Endpoints:
  GET  /files                    → lista arquivos do usuário
  GET  /files/{file_id}/download → baixa o arquivo (verifica ownership)
  DELETE /files/{file_id}        → remove registro (não apaga o arquivo do disco)
"""
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from app.services.file_storage import (
    get_file_record,
    is_owner,
    list_user_files,
    fmt_size,
)
from app.database import get_supabase

router = APIRouter(prefix="/files", tags=["files"])


# ──────────────────────────────────────────────────────────────────────────────
# GET /files  — lista arquivos do usuário
# ──────────────────────────────────────────────────────────────────────────────
@router.get("")
async def list_files(
    user_id: UUID = Query(..., description="ID do usuário"),
    file_type: str | None = Query(None, description="proposta | relatorio | financeiro"),
):
    records = list_user_files(user_id, file_type)
    return [
        {
            **r,
            "size_fmt":    fmt_size(r.get("size_bytes")),
            "download_url": f"/files/{r['id']}/download?user_id={user_id}",
        }
        for r in records
    ]


# ──────────────────────────────────────────────────────────────────────────────
# GET /files/{file_id}/download — download seguro
# ──────────────────────────────────────────────────────────────────────────────
@router.get("/{file_id}/download")
async def download_file(
    file_id: UUID,
    user_id: UUID = Query(..., description="ID do usuário solicitante"),
):
    # 1. Busca registro
    record = get_file_record(file_id)
    if not record:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")

    # 2. Verifica propriedade
    if not is_owner(record, user_id):
        raise HTTPException(status_code=403, detail="Acesso negado.")

    # 3. Verifica se o arquivo existe no disco
    file_path = Path(record["file_path"])
    if not file_path.exists():
        raise HTTPException(
            status_code=410,
            detail="Arquivo não está mais disponível no servidor.",
        )

    # 4. Retorna o arquivo com Content-Disposition: attachment
    return FileResponse(
        path=str(file_path),
        media_type=record["mime_type"],
        filename=record["file_name"],
        headers={
            "Content-Disposition": f'attachment; filename="{record["file_name"]}"',
        },
    )


# ──────────────────────────────────────────────────────────────────────────────
# DELETE /files/{file_id} — remove registro do banco (mantém arquivo no disco)
# ──────────────────────────────────────────────────────────────────────────────
@router.delete("/{file_id}")
async def delete_file_record(
    file_id: UUID,
    user_id: UUID = Query(..., description="ID do usuário solicitante"),
):
    record = get_file_record(file_id)
    if not record:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")
    if not is_owner(record, user_id):
        raise HTTPException(status_code=403, detail="Acesso negado.")

    db = get_supabase()
    db.table("files").delete().eq("id", str(file_id)).execute()
    return {"deleted": str(file_id)}
