from pydantic import BaseModel
from typing import Optional, Any


class WAHAWebhookPayload(BaseModel):
    """Payload enviado pelo WAHA no webhook."""
    event: str
    session: str
    payload: dict[str, Any]


class IncomingMessage(BaseModel):
    phone: str
    name: Optional[str] = None
    body: str
    message_id: str
