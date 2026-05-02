from pydantic import BaseModel
from typing import Optional, Any


class WhatsAppMessage(BaseModel):
    """Payload enviado pela Evolution API no webhook."""
    event: str
    instance: str
    data: dict[str, Any]


class IncomingMessage(BaseModel):
    phone: str
    name: Optional[str] = None
    body: str
    message_id: str
