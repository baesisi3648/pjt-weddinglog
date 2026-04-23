# @TASK P0-T4 - Backend Docker 이미지 (멀티스테이지)
# @SPEC docs/planning/05-architecture.md#배포-구조-docker-compose

# ---------- Stage 1: builder ----------
FROM python:3.11-slim AS builder

WORKDIR /app

# 시스템 빌드 의존성 (python-magic 용 libmagic 포함)
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libmagic1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# ---------- Stage 2: runtime ----------
FROM python:3.11-slim

WORKDIR /app

# 런타임 의존성 (libmagic, curl — healthcheck 용)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libmagic1 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# 빌드 스테이지에서 설치된 파이썬 패키지 복사
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 애플리케이션 코드 복사
COPY . .

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
