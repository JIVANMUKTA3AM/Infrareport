from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID


class TechnicalMessage(BaseModel):
    role: str       # "user" | "assistant"
    content: str


class TechnicalChatRequest(BaseModel):
    user_id: UUID
    message: str
    niche: Optional[str] = None   # ac | cftv | ti | acesso | eletrica | alarme | automacao | telecom
    history: List[TechnicalMessage] = []  # histórico da conversa (últimas N mensagens)


class TechnicalChatResponse(BaseModel):
    reply: str
    niche_detected: Optional[str] = None
    has_report: bool = False       # True quando a resposta contém relatório formatado
    suggestions: List[str] = []    # ações rápidas sugeridas pelo agente
