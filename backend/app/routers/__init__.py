# @TASK P1-R1-T3, P2-R1-T3, P2-R1-T5, P3-R1-T4 - 라우터 패키지
"""FastAPI 라우터 (API 엔드포인트)."""
from app.routers.ai import router as ai_router
from app.routers.couples import router as couples_router
from app.routers.events import router as events_router
from app.routers.photos import events_router as photo_events_router
from app.routers.photos import photo_router

__all__ = [
    "ai_router",
    "couples_router",
    "events_router",
    "photo_events_router",
    "photo_router",
]
