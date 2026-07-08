from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date


class FinancialMessageRequest(BaseModel):
    user_id: UUID
    message: str
    project_id: Optional[UUID] = None


class FinancialMessageResponse(BaseModel):
    entry_id: UUID
    type: str
    value: float
    category: str
    description: str
    balance: float
    confirmation: str


class EntryCreate(BaseModel):
    user_id: UUID
    type: str                     # entrada | saida
    value: float
    category: str = "outro"
    description: str = ""
    date: Optional[date] = None   # defaults to today on the backend
    payment_method: str = "pix"
    project_id: Optional[UUID] = None
    attachment_url: Optional[str] = None
    supplier: Optional[str] = None
