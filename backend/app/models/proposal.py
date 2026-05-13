from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID


class Equipment(BaseModel):
    description: str
    quantity: int
    unit_price: float


class ProposalRequest(BaseModel):
    user_id: UUID
    client_name: str
    client_email: EmailStr
    service: str
    segment: str  # ac | cftv | ti | eletrica | hidraulica
    equipments: list[Equipment]
    notes: Optional[str] = None
    project_id: Optional[UUID] = None
    logo_base64: Optional[str] = None  # data:image/...;base64,<data>
    company_name: Optional[str] = None


class ProposalResponse(BaseModel):
    proposal_id: UUID
    docx_url: str
    total_value: float
    email_sent: bool
    message: str
