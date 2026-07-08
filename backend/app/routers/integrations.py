"""
Rotas OAuth para integrações externas (Gmail, etc.)
GET  /api/integrations/status              → lista integrações ativas do usuário
GET  /api/integrations/gmail/auth          → gera URL de autorização Google
GET  /api/integrations/gmail/callback      → recebe code, troca por tokens, persiste
DELETE /api/integrations/gmail/disconnect  → remove tokens do DB
"""
import httpx
from datetime import datetime, timezone
from urllib.parse import urlencode

from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.responses import RedirectResponse

from app.config import get_settings
from app.database import get_supabase

router = APIRouter(prefix="/api/integrations", tags=["integrations"])

GOOGLE_AUTH_URL   = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL  = "https://oauth2.googleapis.com/token"
GMAIL_SCOPE       = "https://www.googleapis.com/auth/gmail.send"
CALENDAR_SCOPE    = "https://www.googleapis.com/auth/calendar.events"
USERINFO_SCOPE    = "https://www.googleapis.com/auth/userinfo.email"


# ── helpers ──────────────────────────────────────────────────────────────────

async def _get_user_id(authorization: str) -> str:
    """Valida JWT Supabase e retorna users.id do perfil."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Token ausente")
    token = authorization.split(" ", 1)[1]
    sb = get_supabase()
    auth_resp = sb.auth.get_user(token)
    if not auth_resp or not auth_resp.user:
        raise HTTPException(401, "Token inválido")
    auth_id = auth_resp.user.id
    profile = sb.table("users").select("id").eq("auth_id", auth_id).single().execute()
    if not profile.data:
        raise HTTPException(404, "Perfil não encontrado")
    return profile.data["id"]


async def _exchange_code(code: str, cfg) -> dict:
    """Troca authorization code por access_token + refresh_token."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(GOOGLE_TOKEN_URL, data={
            "code":          code,
            "client_id":     cfg.google_client_id,
            "client_secret": cfg.google_client_secret,
            "redirect_uri":  cfg.google_redirect_uri,
            "grant_type":    "authorization_code",
        })
    resp.raise_for_status()
    return resp.json()


async def _refresh_access_token(refresh_token: str, cfg) -> dict:
    """Renova access_token usando refresh_token."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(GOOGLE_TOKEN_URL, data={
            "refresh_token": refresh_token,
            "client_id":     cfg.google_client_id,
            "client_secret": cfg.google_client_secret,
            "grant_type":    "refresh_token",
        })
    resp.raise_for_status()
    return resp.json()


async def _get_gmail_email(access_token: str) -> str:
    """Busca o email da conta Google via userinfo."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
    resp.raise_for_status()
    return resp.json().get("email", "")


# ── endpoints ────────────────────────────────────────────────────────────────

@router.get("/status")
async def integration_status(authorization: str = Header(None)):
    user_id = await _get_user_id(authorization)
    sb = get_supabase()
    rows = (
        sb.table("integrations")
        .select("provider, provider_email, token_expiry, updated_at")
        .eq("user_id", user_id)
        .execute()
    )
    return {"integrations": rows.data or []}


@router.get("/gmail/auth")
async def gmail_auth_url(authorization: str = Header(None)):
    """Retorna a URL para o usuário autorizar o Gmail."""
    await _get_user_id(authorization)   # só valida que está autenticado
    cfg = get_settings()
    params = {
        "client_id":     cfg.google_client_id,
        "redirect_uri":  cfg.google_redirect_uri,
        "response_type": "code",
        "scope":         f"{GMAIL_SCOPE} {CALENDAR_SCOPE} {USERINFO_SCOPE}",
        "access_type":   "offline",
        "prompt":        "consent",   # força refresh_token sempre
    }
    return {"auth_url": f"{GOOGLE_AUTH_URL}?{urlencode(params)}"}


@router.get("/gmail/callback")
async def gmail_callback(
    code:          str  = Query(...),
    state:         str  = Query(None),
    authorization: str  = Header(None),
):
    """
    Recebe o code do Google, troca por tokens e persiste no DB.
    Em produção, o frontend chama este endpoint passando o code recebido.
    """
    user_id = await _get_user_id(authorization)
    cfg     = get_settings()

    tokens = await _exchange_code(code, cfg)
    if "refresh_token" not in tokens:
        raise HTTPException(400, "refresh_token ausente — revogue o acesso no Google e tente novamente")

    gmail_email = await _get_gmail_email(tokens["access_token"])

    expiry = None
    if "expires_in" in tokens:
        from datetime import timedelta
        expiry = (datetime.now(timezone.utc) + timedelta(seconds=tokens["expires_in"])).isoformat()

    sb = get_supabase()
    sb.table("integrations").upsert({
        "user_id":       user_id,
        "provider":      "gmail",
        "provider_email": gmail_email,
        "access_token":  tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_expiry":  expiry,
        "metadata":      {"scope": tokens.get("scope", "")},
    }, on_conflict="user_id,provider").execute()

    return {"ok": True, "email": gmail_email}


@router.delete("/gmail/disconnect")
async def gmail_disconnect(authorization: str = Header(None)):
    user_id = await _get_user_id(authorization)
    sb = get_supabase()
    sb.table("integrations").delete().eq("user_id", user_id).eq("provider", "gmail").execute()
    return {"ok": True}


# ── função utilitária para o agente de email ─────────────────────────────────

async def get_valid_gmail_token(user_id: str) -> str | None:
    """
    Retorna um access_token válido para o user_id ou None se não tiver Gmail conectado.
    Renova automaticamente se expirado.
    """
    sb  = get_supabase()
    cfg = get_settings()

    row = (
        sb.table("integrations")
        .select("access_token, refresh_token, token_expiry")
        .eq("user_id", user_id)
        .eq("provider", "gmail")
        .single()
        .execute()
    )
    if not row.data:
        return None

    data     = row.data
    expiry   = data.get("token_expiry")
    expired  = True
    if expiry:
        exp_dt  = datetime.fromisoformat(expiry)
        now_utc = datetime.now(timezone.utc)
        expired = now_utc >= exp_dt

    if not expired:
        return data["access_token"]

    # Renova
    try:
        tokens = await _refresh_access_token(data["refresh_token"], cfg)
    except Exception:
        return None

    from datetime import timedelta
    new_expiry = (
        datetime.now(timezone.utc) + timedelta(seconds=tokens.get("expires_in", 3600))
    ).isoformat()

    sb.table("integrations").update({
        "access_token": tokens["access_token"],
        "token_expiry": new_expiry,
    }).eq("user_id", user_id).eq("provider", "gmail").execute()

    return tokens["access_token"]
