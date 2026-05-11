"""
Cliente para enviar mensagens via WAHA (WhatsApp HTTP API).
"""
import httpx
from app.config import get_settings


async def send_whatsapp_message(phone: str, text: str) -> None:
    cfg = get_settings()
    url = f"{cfg.waha_url}/api/sendText"
    headers = {"Content-Type": "application/json"}
    if cfg.waha_api_key:
        headers["X-Api-Key"] = cfg.waha_api_key

    # WAHA usa formato {number}@c.us para chats individuais
    chat_id = f"{phone}@c.us" if "@" not in phone else phone

    payload = {
        "chatId": chat_id,
        "text": text,
        "session": cfg.waha_session,
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
