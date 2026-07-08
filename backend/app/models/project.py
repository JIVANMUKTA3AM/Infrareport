from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import date


class ProjectCreate(BaseModel):
    user_id: UUID
    name: str
    client: str
    address: Optional[str] = None
    scope: Optional[str] = None
    revenue: float = 0.0
    material_cost: float = 0.0
    labor_cost: float = 0.0
    start_date: Optional[date] = None
    expected_end_date: Optional[date] = None
    team: List[str] = []
    notes: Optional[str] = None
    proposal_id: Optional[UUID] = None
    segment: Optional[str] = None
    status: str = "em_andamento"


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    scope: Optional[str] = None
    revenue: Optional[float] = None
    material_cost: Optional[float] = None
    labor_cost: Optional[float] = None
    start_date: Optional[date] = None
    expected_end_date: Optional[date] = None
    end_date: Optional[date] = None
    team: Optional[List[str]] = None
    notes: Optional[str] = None
    status: Optional[str] = None


def compute_extras(p: dict) -> dict:
    """Injeta total_cost e margin calculados no dict retornado pela API."""
    mat = float(p.get("material_cost") or 0)
    lab = float(p.get("labor_cost") or 0)
    rev = float(p.get("revenue") or 0)
    total_cost = mat + lab
    margin = round((rev - total_cost) / rev * 100, 1) if rev > 0 else 0.0
    return {**p, "total_cost": total_cost, "margin": margin}
