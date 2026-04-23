# @TASK P0-T2 - uvicorn 엔트리포인트
# @SPEC docs/planning/05-architecture.md#백엔드-구조
"""
uvicorn 엔트리포인트.

실행 예:
    uvicorn main:app --host 0.0.0.0 --port 8000
    uvicorn main:app --reload  # 개발용
    python main.py              # 직접 실행 시 uvicorn 구동
"""
from __future__ import annotations

from app.main import app  # noqa: F401 — uvicorn main:app 가 참조

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )
