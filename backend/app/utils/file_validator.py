# @TASK P3-R1-T3 - 파일 업로드 유효성 (MIME 스푸핑 방어)
# @SPEC docs/planning/council-report.md#B6
# @SPEC specs/domain/resources.yaml#photos
# @TEST tests/utils/test_file_validator.py
"""
사진 업로드 검증.

Council B6 보안 권고 반영:
1. Content-Type 1차 체크 (image/jpeg, image/png 만 허용).
2. 파일 크기 5MB 상한.
3. 실제 바이트 헤더(매직넘버)를 Pillow 로 검증 — MIME 스푸핑 방어.
   (확장자 또는 Content-Type 만 믿으면 악성 파일 우회 가능.)

반환:
    (content: bytes, ext: str) 튜플
    - content: 검증된 raw 바이트 (디스크에 저장할 원본).
    - ext: 실제 이미지 포맷 기반 확장자 ("jpg" 또는 "png").
"""
from __future__ import annotations

import logging
from io import BytesIO

from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError

logger = logging.getLogger(__name__)


ALLOWED_CONTENT_TYPES: set[str] = {"image/jpeg", "image/png"}
MAX_SIZE_BYTES: int = 5 * 1024 * 1024  # 5MB

# Pillow format → 확장자 정규화 매핑
_PIL_FORMAT_TO_EXT: dict[str, str] = {
    "JPEG": "jpg",
    "PNG": "png",
}


class FileValidationError(ValueError):
    """파일 검증 실패 — 라우터에서 400 으로 변환."""


async def validate_photo(file: UploadFile) -> tuple[bytes, str]:
    """사진 UploadFile 을 검증하고 (바이트, 확장자) 를 반환한다.

    Args:
        file: FastAPI UploadFile.

    Returns:
        (content, ext):
            content — 디스크 저장용 원본 바이트.
            ext — 실제 포맷 기반 확장자 ("jpg" | "png").

    Raises:
        FileValidationError: 검증 실패 시.
    """
    # 1) Content-Type 1차 체크
    content_type = file.content_type or ""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise FileValidationError(
            f"Unsupported content type: {content_type!r} "
            f"(allowed: {sorted(ALLOWED_CONTENT_TYPES)})"
        )

    # 2) 크기 체크 — UploadFile 전체 읽어서 길이 측정 (5MB 상한 작아서 안전)
    content = await file.read()
    size = len(content)
    if size == 0:
        raise FileValidationError("Empty file")
    if size > MAX_SIZE_BYTES:
        raise FileValidationError(
            f"File too large: {size} bytes > {MAX_SIZE_BYTES} bytes (5MB)"
        )

    # 3) 매직넘버 검증 — Pillow 로 실제 포맷 확인
    try:
        img = Image.open(BytesIO(content))
        img.verify()  # 헤더 검증 (raise on corrupt/fake)
    except UnidentifiedImageError as exc:
        raise FileValidationError(
            "File is not a valid image (magic number check failed)"
        ) from exc
    except Exception as exc:  # noqa: BLE001 — Pillow 모든 예외 포괄
        raise FileValidationError(
            f"Image validation failed: {exc}"
        ) from exc

    # verify() 후 객체 재사용 불가 — 포맷만 재검증 위해 다시 open
    img2 = Image.open(BytesIO(content))
    fmt = (img2.format or "").upper()
    if fmt not in _PIL_FORMAT_TO_EXT:
        raise FileValidationError(
            f"Unsupported image format: {fmt!r} "
            f"(allowed: {sorted(_PIL_FORMAT_TO_EXT)})"
        )

    # Content-Type 과 실제 포맷 일관성 교차 검증 (스푸핑 방어)
    expected_content_type = {
        "JPEG": "image/jpeg",
        "PNG": "image/png",
    }[fmt]
    if content_type != expected_content_type:
        raise FileValidationError(
            f"Content-Type mismatch: header says {content_type!r} "
            f"but actual bytes are {fmt}"
        )

    return content, _PIL_FORMAT_TO_EXT[fmt]
