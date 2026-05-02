"""
Serviço de armazenamento de arquivos.

Responsabilidades:
  - Registrar arquivos gerados (docx, pdf, xlsx) na tabela `files` do Supabase
  - Servir arquivos a partir do disco local (pasta storage/)
  - Verificar propriedade antes do download

Tipos suportados:
  proposta  → .docx
  relatorio → .pdf
  financeiro → .xlsx
"""
import os
from pathlib import Path
from uuid import UUID, uuid4
from datetime import datetime, timezone

from app.config import get_settings
from app.database import get_supabase

MIME_MAP = {
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pdf":  "application/pdf",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}

FileType = str  # 'proposta' | 'relatorio' | 'financeiro'


def register_file(
    user_id: UUID,
    file_path: str,
    file_type: FileType,
    ref_id: UUID | None = None,
) -> dict:
    """
    Registra o arquivo no banco e retorna o registro criado.
    `file_path` deve ser o caminho absoluto ou relativo ao servidor.
    """
    path   = Path(file_path)
    ext    = path.suffix.lower()
    mime   = MIME_MAP.get(ext, "application/octet-stream")
    size   = path.stat().st_size if path.exists() else None
    file_id = uuid4()

    record = {
        "id":         str(file_id),
        "user_id":    str(user_id),
        "file_name":  path.name,
        "file_path":  str(path),
        "file_type":  file_type,
        "mime_type":  mime,
        "size_bytes": size,
        "ref_id":     str(ref_id) if ref_id else None,
    }

    db = get_supabase()
    db.table("files").insert(record).execute()
    return record


def get_file_record(file_id: UUID) -> dict | None:
    """Retorna o registro do arquivo ou None se não existir."""
    db = get_supabase()
    result = (
        db.table("files")
        .select("*")
        .eq("id", str(file_id))
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def is_owner(file_record: dict, user_id: UUID) -> bool:
    """Verifica se o user_id é dono do arquivo."""
    return str(file_record.get("user_id")) == str(user_id)


def list_user_files(user_id: UUID, file_type: str | None = None) -> list[dict]:
    """Lista todos os arquivos de um usuário, opcionalmente filtrados por tipo."""
    db = get_supabase()
    q = (
        db.table("files")
        .select("id, file_name, file_type, mime_type, size_bytes, created_at")
        .eq("user_id", str(user_id))
        .order("created_at", desc=True)
    )
    if file_type:
        q = q.eq("file_type", file_type)
    result = q.execute()
    return result.data or []


def fmt_size(size_bytes: int | None) -> str:
    """Formata bytes em KB / MB para exibição."""
    if not size_bytes:
        return "—"
    if size_bytes < 1024:
        return f"{size_bytes} B"
    if size_bytes < 1024 ** 2:
        return f"{size_bytes / 1024:.1f} KB"
    return f"{size_bytes / 1024 ** 2:.1f} MB"
