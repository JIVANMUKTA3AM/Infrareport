from functools import lru_cache
from supabase import create_client, Client
from app.config import get_settings


@lru_cache
def get_supabase() -> Client:
    cfg = get_settings()
    return create_client(cfg.supabase_url, cfg.supabase_service_key)
