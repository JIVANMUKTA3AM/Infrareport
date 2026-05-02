from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class FinancialMessageRequest(BaseModel):
    user_id: UUID
    message: str          # ex: "gastei R$386 em material elétrico no projeto Gama"
    project_id: Optional[UUID] = None


class FinancialMessageResponse(BaseModel):
    entry_id: UUID
    type: str             # entrada | saida
    value: float
    category: str
    description: str
    balance: float
    confirmation: str     # mensagem amigável para o usuário
