# @TASK P3-R1-T3 - 파일 업로드 유효성 검사 단위 테스트
# @SPEC docs/planning/council-report.md#B6
"""
file_validator.validate_photo 단위 테스트.

핵심 시나리오:
- 유효 PNG/JPEG 통과
- Content-Type spoofing (application/pdf 등) → ValueError
- 5MB 초과 → ValueError
- 빈 파일 → ValueError
- 확장자/Content-Type 은 맞지만 실제 바이트가 이미지가 아님 → ValueError
  (매직넘버 스푸핑 방어, Council B6 핵심)
- Content-Type 과 실제 포맷 불일치 → ValueError
"""
from __future__ import annotations

from io import BytesIO

import pytest
from fastapi import UploadFile
from PIL import Image

from app.utils.file_validator import (
    FileValidationError,
    MAX_SIZE_BYTES,
    validate_photo,
)


# -----------------------------------------------------------------------------
# Helpers — 실제 Pillow 로 유효한 테스트 이미지 생성
# -----------------------------------------------------------------------------
def _png_bytes(size: tuple[int, int] = (10, 10), color: str = "white") -> bytes:
    buf = BytesIO()
    Image.new("RGB", size, color=color).save(buf, format="PNG")
    return buf.getvalue()


def _jpeg_bytes(
    size: tuple[int, int] = (10, 10), color: str = "white"
) -> bytes:
    buf = BytesIO()
    Image.new("RGB", size, color=color).save(buf, format="JPEG")
    return buf.getvalue()


def _upload(
    content: bytes, content_type: str, filename: str = "x"
) -> UploadFile:
    return UploadFile(
        filename=filename,
        file=BytesIO(content),
        headers={"content-type": content_type},  # type: ignore[arg-type]
    )


# -----------------------------------------------------------------------------
# 긍정 케이스
# -----------------------------------------------------------------------------
class TestValidImages:
    @pytest.mark.asyncio
    async def test_valid_png(self) -> None:
        content = _png_bytes()
        file = _upload(content, "image/png", "photo.png")
        raw, ext = await validate_photo(file)
        assert raw == content
        assert ext == "png"

    @pytest.mark.asyncio
    async def test_valid_jpeg(self) -> None:
        content = _jpeg_bytes()
        file = _upload(content, "image/jpeg", "photo.jpg")
        raw, ext = await validate_photo(file)
        assert raw == content
        assert ext == "jpg"


# -----------------------------------------------------------------------------
# Content-Type 차단
# -----------------------------------------------------------------------------
class TestContentTypeGuard:
    @pytest.mark.asyncio
    async def test_pdf_content_type_rejected(self) -> None:
        content = _png_bytes()
        file = _upload(content, "application/pdf", "x.pdf")
        with pytest.raises(FileValidationError, match="content type"):
            await validate_photo(file)

    @pytest.mark.asyncio
    async def test_gif_content_type_rejected(self) -> None:
        content = _png_bytes()
        file = _upload(content, "image/gif", "x.gif")
        with pytest.raises(FileValidationError, match="content type"):
            await validate_photo(file)

    @pytest.mark.asyncio
    async def test_missing_content_type_rejected(self) -> None:
        content = _png_bytes()
        # content_type 누락 — UploadFile 기본값 ""
        file = UploadFile(filename="x", file=BytesIO(content))
        with pytest.raises(FileValidationError):
            await validate_photo(file)


# -----------------------------------------------------------------------------
# 크기 제한
# -----------------------------------------------------------------------------
class TestSizeLimit:
    @pytest.mark.asyncio
    async def test_over_5mb_rejected(self) -> None:
        # 5MB + 1 byte 의 "PNG 처럼 보이는" 페이로드.
        # 실제 PNG 매직 바이트로 시작하되 크기만 초과.
        huge = b"\x89PNG\r\n\x1a\n" + b"\x00" * (MAX_SIZE_BYTES + 1)
        file = _upload(huge, "image/png", "big.png")
        with pytest.raises(FileValidationError, match="too large"):
            await validate_photo(file)

    @pytest.mark.asyncio
    async def test_empty_file_rejected(self) -> None:
        file = _upload(b"", "image/png", "empty.png")
        with pytest.raises(FileValidationError, match="Empty"):
            await validate_photo(file)


# -----------------------------------------------------------------------------
# 매직넘버 스푸핑 방어 (Council B6 핵심)
# -----------------------------------------------------------------------------
class TestMagicNumberSpoofing:
    @pytest.mark.asyncio
    async def test_fake_png_rejected(self) -> None:
        """Content-Type 은 image/png 지만 바이트는 평문 텍스트 → 거부."""
        fake = b"not an image - plain text data"
        file = _upload(fake, "image/png", "fake.png")
        with pytest.raises(FileValidationError):
            await validate_photo(file)

    @pytest.mark.asyncio
    async def test_fake_jpeg_with_garbage_rejected(self) -> None:
        """JPEG 매직 일부만 복사한 엉터리 파일 거부."""
        # JPEG SOI 매직 + 나머지 쓰레기
        fake = b"\xff\xd8" + b"garbage bytes no JPEG content"
        file = _upload(fake, "image/jpeg", "fake.jpg")
        with pytest.raises(FileValidationError):
            await validate_photo(file)

    @pytest.mark.asyncio
    async def test_content_type_jpeg_but_bytes_png_rejected(self) -> None:
        """Content-Type=image/jpeg 인데 실제 바이트는 PNG → 불일치로 거부."""
        png_content = _png_bytes()
        file = _upload(png_content, "image/jpeg", "sneaky.jpg")
        with pytest.raises(FileValidationError, match="mismatch"):
            await validate_photo(file)
