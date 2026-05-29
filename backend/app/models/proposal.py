from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID


class Equipment(BaseModel):
    description: str
    quantity: int
    unit_price: float


class ProposalContent(BaseModel):
    """Conteúdo gerado pelo Agente Comercial (Claude)."""
    introduction: str
    scope: str
    methodology: str
    warranty: str
    payment_terms: str
    execution_deadline: str
    differentials: Optional[str] = None
    notes: Optional[str] = None


class ProposalRequest(BaseModel):
    user_id: UUID
    client_name: str
    client_email: EmailStr
    service: str
    segment: str  # ac | cftv | ti | eletrica | hidraulica
    equipments: list[Equipment]
    notes: Optional[str] = None
    project_id: Optional[UUID] = None
    logo_base64: Optional[str] = None
    company_name: Optional[str] = None
    company_phone: Optional[str] = None
    company_email: Optional[str] = None
    company_address: Optional[str] = None
    validity_days: Optional[int] = 30


class ProposalResponse(BaseModel):
    proposal_id: UUID
    docx_url: str
    total_value: float
    email_sent: bool
    message: str
