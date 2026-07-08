from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date


class EventCreate(BaseModel):
    user_id: UUID
    title: str
    type: str = "outro"
    date: date
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    all_day: bool = False
    client_name: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    responsible: Optional[str] = None
    project_id: Optional[UUID] = None
    proposal_id: Optional[UUID] = None
    reminder_minutes: int = 60
    color: Optional[str] = None
    status: str = "agendado"
