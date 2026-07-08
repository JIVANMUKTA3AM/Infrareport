"""
CRUD de eventos da Agenda + notificações + sincronização Google Calendar.

Ordem de rotas: /upcoming, /notifications, /gcal-sync ANTES de /{event_id}
para evitar conflito de parâmetros no FastAPI.
"""
import json
from datetime import date, datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.database import get_supabase
from app.models.event import EventCreate

router = APIRouter(prefix="/api/events", tags=["events"])

GCAL_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events"


# ── LIST ──────────────────────────────────────────────────────────────────────

@router.get("")
async def list_events(
    user_id:    UUID            = Query(...),
    year:       Optional[int]   = Query(None),
    month:      Optional[int]   = Query(None),
    date_from:  Optional[date]  = Query(None),
    date_to:    Optional[date]  = Query(None),
    status:     Optional[str]   = Query(None),
):
    try:
        db = get_supabase()
        q  = db.table("events").select("*").eq("user_id", str(user_id))

        if year and month:
            import calendar as cal_mod
            last = cal_mod.monthrange(year, month)[1]
            q = q.gte("date", f"{year:04d}-{month:02d}-01")
            q = q.lte("date", f"{year:04d}-{month:02d}-{last:02d}")
        elif date_from:
            q = q.gte("date", date_from.isoformat())
            if date_to:
                q = q.lte("date", date_to.isoformat())

        if status:
            q = q.eq("status", status)

        result = q.order("date").order("start_time").execute()
        return result.data or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── UPCOMING (antes de /{event_id}) ──────────────────────────────────────────

@router.get("/upcoming")
async def upcoming_events(
    user_id: UUID = Query(...),
    days:    int  = Query(default=7),
):
    try:
        db    = get_supabase()
        today = date.today()
        end   = today + timedelta(days=days)
        result = (
            db.table("events")
            .select("*")
            .eq("user_id", str(user_id))
            .gte("date", today.isoformat())
            .lte("date", end.isoformat())
            .eq("status", "agendado")
            .order("date")
            .order("start_time")
            .limit(20)
            .execute()
        )
        return result.data or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── NOTIFICATIONS (antes de /{event_id}) ─────────────────────────────────────

@router.get("/notifications")
async def get_notifications(user_id: UUID = Query(...)):
    """
    Notificações computadas: eventos hoje/amanhã, OS com prazo,
    propostas enviadas sem resposta há 5+ dias.
    """
    try:
        db       = get_supabase()
        today    = date.today()
        tomorrow = today + timedelta(days=1)
        in3days  = today + timedelta(days=3)

        notifications = []

        # Eventos hoje e amanhã
        evts = (
            db.table("events")
            .select("id, title, type, date, start_time, client_name")
            .eq("user_id", str(user_id))
            .gte("date", today.isoformat())
            .lte("date", tomorrow.isoformat())
            .eq("status", "agendado")
            .order("date")
            .execute()
        )
        TYPE_LABELS = {
            "visita": "Visita", "execucao": "Execução",
            "vencimento": "Vencimento", "followup": "Follow-up", "outro": "Evento",
        }
        for e in (evts.data or []):
            is_today = e["date"] == today.isoformat()
            when     = "Hoje" if is_today else "Amanhã"
            time_str = f" às {e['start_time'][:5]}" if e.get("start_time") else ""
            client   = f" · {e['client_name']}" if e.get("client_name") else ""
            notifications.append({
                "id":      f"event_{e['id']}",
                "type":    "event",
                "icon":    "📅",
                "title":   f"{TYPE_LABELS.get(e['type'], 'Evento')}: {e['title']}",
                "body":    f"{when}{time_str}{client}",
                "urgency": "high" if is_today else "normal",
                "link":    "agenda",
            })

        # Projetos com prazo vencendo em até 3 dias
        try:
            projs = (
                db.table("projects")
                .select("id, name, client, expected_end_date")
                .eq("user_id", str(user_id))
                .eq("status", "em_andamento")
                .gte("expected_end_date", today.isoformat())
                .lte("expected_end_date", in3days.isoformat())
                .execute()
            )
            for p in (projs.data or []):
                d    = p["expected_end_date"]
                when = ("Hoje" if d == today.isoformat()
                        else "Amanhã" if d == tomorrow.isoformat() else "Em 3 dias")
                notifications.append({
                    "id":      f"proj_{p['id']}",
                    "type":    "project",
                    "icon":    "🔧",
                    "title":   f"OS vence {when}: {p['name']}",
                    "body":    p.get("client", ""),
                    "urgency": "high" if d == today.isoformat() else "normal",
                    "link":    "projetos",
                })
        except Exception:
            pass  # projetos pode não existir ainda

        # Propostas enviadas sem resposta há 5+ dias
        cutoff = (today - timedelta(days=5)).isoformat()
        try:
            props = (
                db.table("proposals")
                .select("id, client_name, service, created_at")
                .eq("user_id", str(user_id))
                .eq("status", "enviada")
                .lte("created_at", cutoff + "T00:00:00")
                .limit(5)
                .execute()
            )
            for p in (props.data or []):
                notifications.append({
                    "id":      f"prop_{p['id']}",
                    "type":    "proposal",
                    "icon":    "📄",
                    "title":   f"Follow-up: {p['client_name']}",
                    "body":    f"Proposta de {p.get('service', '')} aguardando resposta",
                    "urgency": "normal",
                    "link":    "propostas",
                })
        except Exception:
            pass

        return {"count": len(notifications), "items": notifications[:10]}

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── GOOGLE CALENDAR SYNC (antes de /{event_id}) ───────────────────────────────

@router.get("/gcal-sync")
async def gcal_sync(
    user_id:   UUID           = Query(...),
    date_from: Optional[date] = Query(None),
    date_to:   Optional[date] = Query(None),
):
    """Puxa eventos do Google Calendar e cria/atualiza eventos locais."""
    from app.routers.integrations import get_valid_gmail_token

    token = await get_valid_gmail_token(str(user_id))
    if not token:
        raise HTTPException(status_code=400, detail="Google Calendar não conectado — reconecte o Gmail")

    today   = date.today()
    d_from  = date_from or today
    d_to    = date_to   or (today + timedelta(days=30))

    time_min = datetime(d_from.year, d_from.month, d_from.day, tzinfo=timezone.utc).isoformat()
    time_max = datetime(d_to.year, d_to.month, d_to.day, 23, 59, 59, tzinfo=timezone.utc).isoformat()

    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(
            GCAL_EVENTS_URL,
            headers={"Authorization": f"Bearer {token}"},
            params={
                "timeMin": time_min, "timeMax": time_max,
                "singleEvents": "true", "orderBy": "startTime", "maxResults": "100",
            },
        )

    if resp.status_code == 403:
        raise HTTPException(
            status_code=400,
            detail="Escopo de Calendar não autorizado — reconecte o Gmail com escopo completo"
        )
    resp.raise_for_status()

    db      = get_supabase()
    created = updated = 0

    for ge in resp.json().get("items", []):
        gid   = ge["id"]
        start = ge.get("start", {})
        ev_date = start.get("date") or start.get("dateTime", "")[:10]
        if not ev_date:
            continue

        ev_start = start.get("dateTime", "")[11:16] or None
        ev_end   = ge.get("end", {}).get("dateTime", "")[11:16] or None

        row = {
            "title":           ge.get("summary", "Evento Google"),
            "date":            ev_date,
            "start_time":      ev_start,
            "end_time":        ev_end,
            "all_day":         "date" in start,
            "notes":           ge.get("description", ""),
            "location":        ge.get("location", ""),
            "google_event_id": gid,
            "type":            "outro",
            "status":          "agendado",
        }

        existing = (
            db.table("events").select("id")
            .eq("user_id", str(user_id)).eq("google_event_id", gid)
            .limit(1).execute()
        )
        if existing.data:
            db.table("events").update(row).eq("id", existing.data[0]["id"]).execute()
            updated += 1
        else:
            row["user_id"] = str(user_id)
            db.table("events").insert(row).execute()
            created += 1

    return {"synced": created + updated, "created": created, "updated": updated}


# ── CREATE ────────────────────────────────────────────────────────────────────

@router.post("")
async def create_event(body: EventCreate):
    try:
        db  = get_supabase()
        row = {
            "user_id":          str(body.user_id),
            "title":            body.title,
            "type":             body.type,
            "date":             body.date.isoformat(),
            "start_time":       body.start_time,
            "end_time":         body.end_time,
            "all_day":          body.all_day,
            "client_name":      body.client_name,
            "location":         body.location,
            "notes":            body.notes,
            "responsible":      body.responsible,
            "project_id":       str(body.project_id) if body.project_id else None,
            "proposal_id":      str(body.proposal_id) if body.proposal_id else None,
            "reminder_minutes": body.reminder_minutes,
            "color":            body.color,
            "status":           body.status,
        }
        result = db.table("events").insert(row).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Falha ao criar evento")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── UPDATE ────────────────────────────────────────────────────────────────────

@router.patch("/{event_id}")
async def update_event(event_id: UUID, body: dict):
    blocked = {"id", "user_id", "created_at"}
    data    = {k: v for k, v in body.items() if k not in blocked}
    if "date" in data and hasattr(data["date"], "isoformat"):
        data["date"] = data["date"].isoformat()
    try:
        db = get_supabase()
        result = db.table("events").update(data).eq("id", str(event_id)).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Evento não encontrado")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── DELETE ────────────────────────────────────────────────────────────────────

@router.delete("/{event_id}")
async def delete_event(event_id: UUID, user_id: UUID = Query(...)):
    try:
        db = get_supabase()
        db.table("events").delete().eq("id", str(event_id)).eq("user_id", str(user_id)).execute()
        return {"ok": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── GCAL PUSH ─────────────────────────────────────────────────────────────────

@router.post("/{event_id}/gcal-push")
async def gcal_push_event(event_id: UUID, body: dict):
    """Envia/atualiza um evento local no Google Calendar."""
    user_id = body.get("user_id")
    if not user_id:
        raise HTTPException(status_code=422, detail="user_id obrigatório")

    from app.routers.integrations import get_valid_gmail_token
    token = await get_valid_gmail_token(str(user_id))
    if not token:
        raise HTTPException(status_code=400, detail="Google Calendar não conectado")

    db  = get_supabase()
    res = db.table("events").select("*").eq("id", str(event_id)).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    ev = res.data

    ev_date = ev["date"]
    if ev.get("start_time"):
        tz  = "America/Sao_Paulo"
        gcal_start = {"dateTime": f"{ev_date}T{ev['start_time']}:00", "timeZone": tz}
        end_t      = ev.get("end_time") or ev["start_time"]
        gcal_end   = {"dateTime": f"{ev_date}T{end_t}:00", "timeZone": tz}
    else:
        gcal_start = {"date": ev_date}
        gcal_end   = {"date": ev_date}

    payload = {
        "summary":     ev["title"],
        "description": ev.get("notes", ""),
        "location":    ev.get("location", ""),
        "start":       gcal_start,
        "end":         gcal_end,
    }

    async with httpx.AsyncClient(timeout=20) as client:
        if ev.get("google_event_id"):
            resp = await client.put(
                f"{GCAL_EVENTS_URL}/{ev['google_event_id']}",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                content=json.dumps(payload),
            )
        else:
            resp = await client.post(
                GCAL_EVENTS_URL,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                content=json.dumps(payload),
            )

    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=400, detail=f"Google Calendar: {resp.text[:200]}")

    gcal_id = resp.json().get("id")
    db.table("events").update({"google_event_id": gcal_id}).eq("id", str(event_id)).execute()
    return {"ok": True, "google_event_id": gcal_id}
