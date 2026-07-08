from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class CategoryCreate(BaseModel):
    user_id: UUID
    type: str        # entrada | saida
    name: str
    color: str = "#64748B"
    icon: str = "📌"
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class CategoryMerge(BaseModel):
    user_id: UUID
    target_id: UUID
