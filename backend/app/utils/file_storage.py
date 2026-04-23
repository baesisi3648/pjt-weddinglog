# @TASK P3-R1-T3 - 파일 저장 (Path Traversal 방어)
# @SPEC docs/planning/council-report.md#B6
# @TEST tests/utils/test_file_storage.py
"""
사진 파일 디스크 저장.

Council B6 보안 권고 반영:
- 저장 경로는 `pathlib.Path.resolve()` 후 UPLOAD_DIR prefix 검증.
- event_id / photo_id 에 `../` 가 섞여도 상위로 벗어나지 못하도록.
- 파일명은 서버 생성 UUID(photo_id) + 실제 포맷 확장자로만 결정 (원본 파일명 X).
"""
from __future__ import annotations

import logging
from pathlib import Path

from app.config import get_settings

logger = logging.getLogger(__name__)


# 저장 허용 확장자 (file_validator 가 반환하는 값과 일치해야 함)
ALLOWED_EXTS: set[str] = {"jpg", "jpeg", "png"}


class PathTraversalError(ValueError):
    """Path Traversal 감지 — 라우터에서 400 으로 변환."""


def _upload_root() -> Path:
    """UPLOAD_DIR 상위의 'uploads' 루트.

    config.UPLOAD_DIR 이 `./data/uploads/photos` 로 설정된 프로젝트이므로
    photos 하위 경로만 쓰되, 'uploads' 자체를 prefix 로 본다.
    """
    return get_settings().UPLOAD_DIR.resolve()


def safe_save_photo(
    content: bytes,
    event_id: str,
    photo_id: str,
    ext: str,
) -> str:
    """사진을 UPLOAD_DIR 하위에 안전하게 저장한다.

    저장 경로: `<UPLOAD_DIR>/<event_id>/<photo_id>.<ext>`
    (UPLOAD_DIR 이 `./data/uploads/photos` 이므로 최종 경로는
     `data/uploads/photos/<event_id>/<photo_id>.<ext>`.)

    Args:
        content: 디스크에 쓸 원본 바이트.
        event_id: 이벤트 ID (디렉토리명).
        photo_id: 사진 ID (파일명).
        ext: 확장자 (점 없이, "jpg" | "png").

    Returns:
        UPLOAD_DIR 부모 기준 상대 경로 (e.g. "photos/evt_x/pho_y.jpg").
        API 응답 / DB 저장용.

    Raises:
        PathTraversalError: Path 이탈 또는 허용되지 않은 확장자.
    """
    # 확장자 정규화
    ext_norm = ext.lower().lstrip(".")
    if ext_norm not in ALLOWED_EXTS:
        raise PathTraversalError(
            f"Unsupported extension: {ext_norm!r} "
            f"(allowed: {sorted(ALLOWED_EXTS)})"
        )

    upload_root = _upload_root()
    upload_root.mkdir(parents=True, exist_ok=True)

    # 타겟 경로 생성
    target = (upload_root / event_id / f"{photo_id}.{ext_norm}").resolve()

    # Path Traversal 방어: resolve 결과가 UPLOAD_DIR 아래에 있는지 검증
    try:
        target.relative_to(upload_root)
    except ValueError as exc:
        raise PathTraversalError(
            f"Path traversal detected: "
            f"target={target!s} outside upload_root={upload_root!s}"
        ) from exc

    # 디렉토리 생성 후 쓰기
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(content)

    # 반환은 UPLOAD_DIR 부모 기준 상대 경로 ("photos/..." 형식)
    # UPLOAD_DIR = ".../data/uploads/photos" 이므로 그 부모 "uploads" 기준.
    try:
        rel = target.relative_to(upload_root.parent)
    except ValueError:
        # 예기치 못한 경우: 절대경로 그대로 반환
        rel = target
    return str(rel).replace("\\", "/")  # 윈도우 호환


def resolve_photo_abs_path(stored_rel_path: str) -> Path:
    """DB 에 저장된 상대 경로를 절대 경로로 복원.

    FileResponse 서빙용 래퍼에서 사용. Path Traversal 재검증 포함.

    Args:
        stored_rel_path: DB file_path 컬럼 값 (e.g. "photos/evt_x/pho_y.jpg").

    Returns:
        절대 경로 Path (존재 여부는 호출자가 판단).

    Raises:
        PathTraversalError: 저장 시 검증을 우회해 들어온 악성 경로 방어용.
    """
    upload_root = _upload_root()
    abs_path = (upload_root.parent / stored_rel_path).resolve()

    try:
        abs_path.relative_to(upload_root.parent)
    except ValueError as exc:
        raise PathTraversalError(
            f"Stored path escapes upload root: {stored_rel_path!r}"
        ) from exc
    return abs_path


def delete_photo_file(stored_rel_path: str) -> bool:
    """저장된 사진 파일을 디스크에서 삭제.

    Returns:
        True 면 삭제 성공, False 면 파일이 이미 없음 (idempotent).
    """
    try:
        abs_path = resolve_photo_abs_path(stored_rel_path)
    except PathTraversalError:
        logger.warning("delete_photo_file: traversal detected %r", stored_rel_path)
        return False

    if not abs_path.exists():
        logger.warning(
            "delete_photo_file: file already missing %s", abs_path
        )
        return False

    abs_path.unlink()
    return True
