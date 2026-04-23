# @TASK P1-R1-T3, P2-R1-T3, P2-R1-T5 - 라우터 패키지
"""FastAPI 라우터 (API 엔드포인트)."""
from app.routers.ai import router as ai_router
from app.routers.couples import router as couples_router
from app.routers.events import router as events_router

__all__ = ["ai_router", "couples_router", "events_router"]
