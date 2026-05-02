from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class FileRecord(BaseModel):
    id: UUID
    user_id: UUID
    file_name: str
    file_path: str
    file_url: Optional[str] = None
    file_type: str          # proposta | relatorio | financeiro
    mime_type: str
    size_bytes: Optional[int] = None
    ref_id: Optional[UUID] = None
    created_at: datetime


class FileListItem(BaseModel):
    id: UUID
    file_name: str
    file_type: str
    mime_type: str
    size_bytes: Optional[int] = None
    created_at: datetime
    download_url: str       # URL relativa: /files/{id}/download
