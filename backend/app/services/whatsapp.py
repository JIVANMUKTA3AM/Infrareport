"""
Cliente para enviar mensagens via Evolution API.
"""
import httpx
from app.config import get_settings


async def send_whatsapp_message(phone: str, text: str) -> None:
    cfg = get_settings()
    url = f"{cfg.evolution_api_url}/message/sendText/{cfg.evolution_instance}"
    headers = {"apikey": cfg.evolution_api_key, "Content-Type": "application/json"}
    payload = {
        "number": phone,
        "options": {"delay": 1200, "presence": "composing"},
        "textMessage": {"text": text},
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
