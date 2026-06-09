"""
Envia e-mail com o .docx da proposta em anexo.

Prioridade:
  1. Gmail API  — se o usuário conectou sua conta Gmail (usa refresh_token salvo)
  2. SMTP       — fallback com as credenciais do sistema (.env)
"""
import base64
import json
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
from pathlib import Path

import aiosmtplib
import httpx

from app.config import get_settings

GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"


# ── Gmail API ────────────────────────────────────────────────────────────────

async def _send_via_gmail_api(
    access_token: str,
    from_email: str,
    to_email: str,
    subject: str,
    body: str,
    docx_path: str,
) -> None:
    msg = MIMEMultipart()
    msg["From"]    = from_email
    msg["To"]      = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain", "utf-8"))

    with open(docx_path, "rb") as f:
        part = MIMEBase("application", "octet-stream")
        part.set_payload(f.read())
    encoders.encode_base64(part)
    part.add_header(
        "Content-Disposition",
        f'attachment; filename="{Path(docx_path).name}"',
    )
    msg.attach(part)

    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            GMAIL_SEND_URL,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type":  "application/json",
            },
            content=json.dumps({"raw": raw}),
        )
    resp.raise_for_status()


# ── SMTP fallback ────────────────────────────────────────────────────────────

async def _send_via_smtp(
    to_email: str,
    subject: str,
    body: str,
    docx_path: str,
) -> None:
    cfg = get_settings()
    msg = MIMEMultipart()
    msg["From"]    = cfg.smtp_user
    msg["To"]      = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain", "utf-8"))

    with open(docx_path, "rb") as f:
        part = MIMEBase("application", "octet-stream")
        part.set_payload(f.read())
    encoders.encode_base64(part)
    part.add_header(
        "Content-Disposition",
        f'attachment; filename="{Path(docx_path).name}"',
    )
    msg.attach(part)

    await aiosmtplib.send(
        msg,
        hostname=cfg.smtp_host,
        port=cfg.smtp_port,
        username=cfg.smtp_user,
        password=cfg.smtp_password,
        start_tls=True,
        timeout=15,
    )


# ── interface pública ────────────────────────────────────────────────────────

async def send_proposal_email(
    to_email: str,
    client_name: str,
    service: str,
    docx_path: str,
    user_id: str | None = None,   # se fornecido, tenta Gmail API primeiro
    is_approval: bool = False,
) -> None:
    if is_approval:
        subject = f"Proposta Aprovada — {service}"
        body = (
            f"Olá {client_name},\n\n"
            f"Temos o prazer de confirmar a aprovação da proposta referente ao serviço: {service}.\n\n"
            "Em breve entraremos em contato para alinhar os próximos passos.\n\n"
            "Segue em anexo o documento da proposta para seus registros.\n\n"
            "Atenciosamente"
        )
    else:
        subject = f"Proposta Comercial — {service}"
        body = (
            f"Olá {client_name},\n\n"
            f"Segue em anexo a proposta comercial referente ao serviço: {service}.\n\n"
            "Qualquer dúvida, estamos à disposição.\n\n"
            "Atenciosamente"
        )

    # Tenta Gmail API se user_id for informado
    if user_id:
        try:
            from app.routers.integrations import get_valid_gmail_token
            token = await get_valid_gmail_token(user_id)
            if token:
                # busca e-mail do remetente salvo na integração
                from app.database import get_supabase
                row = (
                    get_supabase()
                    .table("integrations")
                    .select("provider_email")
                    .eq("user_id", user_id)
                    .eq("provider", "gmail")
                    .single()
                    .execute()
                )
                from_email = row.data.get("provider_email", "") if row.data else ""
                await _send_via_gmail_api(token, from_email, to_email, subject, body, docx_path)
                return
        except Exception:
            pass  # cai no fallback SMTP

    await _send_via_smtp(to_email, subject, body, docx_path)
