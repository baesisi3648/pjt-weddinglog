# @TASK P1-R1-T3, P2-R1-T3, P2-R1-T5, P3-R1-T4, P4-R1-T2, P4-R1-T4, P5-R1-T3, P5-BACKEND - 라우터 패키지
"""FastAPI 라우터 (API 엔드포인트)."""
from app.routers.ai import router as ai_router
from app.routers.album import router as album_router
from app.routers.couples import router as couples_router
from app.routers.events import router as events_router
from app.routers.home import router as home_router
from app.routers.orders import (
    couples_orders_router,
    orders_router,
)
from app.routers.photos import events_router as photo_events_router
from app.routers.photos import photo_router
from app.routers.timeline import router as timeline_router

__all__ = [
    "ai_router",
    "album_router",
    "couples_orders_router",
    "couples_router",
    "events_router",
    "home_router",
    "orders_router",
    "photo_events_router",
    "photo_router",
    "timeline_router",
]
