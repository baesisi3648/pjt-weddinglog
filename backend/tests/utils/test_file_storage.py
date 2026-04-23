# @TASK P3-R1-T3 - 파일 저장 (Path Traversal 방어) 단위 테스트
# @SPEC docs/planning/council-report.md#B6
"""
file_storage.safe_save_photo / resolve_photo_abs_path / delete_photo_file 테스트.

핵심 시나리오:
- 정상 저장 → 파일 존재 + 상대 경로 반환
- event_id="../.." 등 Path Traversal 시도 → PathTraversalError
- 지원되지 않는 확장자 → PathTraversalError
- resolve_photo_abs_path: traversal 재검증
- delete_photo_file: 파일 존재 시 True, 없으면 False (idempotent)
"""
from __future__ import annotations

from pathlib import Path

import pytest

from app.config import get_settings
from app.utils.file_storage import (
    PathTraversalError,
    delete_photo_file,
    resolve_photo_abs_path,
    safe_save_photo,
)


@pytest.fixture()
def tmp_upload_dir(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """UPLOAD_DIR 을 임시 디렉토리로 바꿔서 테스트 격리."""
    upload_dir = tmp_path / "uploads" / "photos"
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Settings 인스턴스의 UPLOAD_DIR 을 덮어쓴다 (lru_cache 캐시 공유).
    settings = get_settings()
    monkeypatch.setattr(settings, "UPLOAD_DIR", upload_dir)
    return upload_dir


class TestSafeSavePhoto:
    def test_saves_file_and_returns_relative_path(
        self, tmp_upload_dir: Path
    ) -> None:
        rel = safe_save_photo(
            content=b"\x89PNG\r\n\x1a\ntest",
            event_id="evt_abc",
            photo_id="pho_xyz",
            ext="png",
        )
        # 반환 경로는 "photos/..." 로 시작
        assert rel.startswith("photos/")
        assert "evt_abc" in rel
        assert rel.endswith("pho_xyz.png")

        # 실제 파일 존재
        target = tmp_upload_dir / "evt_abc" / "pho_xyz.png"
        assert target.exists()
        assert target.read_bytes() == b"\x89PNG\r\n\x1a\ntest"

    def test_jpeg_extension_ok(self, tmp_upload_dir: Path) -> None:
        rel = safe_save_photo(
            content=b"\xff\xd8\xff",
            event_id="evt_j",
            photo_id="pho_j",
            ext="jpg",
        )
        assert rel.endswith("pho_j.jpg")

    def test_unsupported_extension_rejected(
        self, tmp_upload_dir: Path
    ) -> None:
        with pytest.raises(PathTraversalError, match="extension"):
            safe_save_photo(
                content=b"GIF89a",
                event_id="evt_g",
                photo_id="pho_g",
                ext="gif",
            )


class TestPathTraversalDefense:
    def test_dotdot_event_id_rejected(self, tmp_upload_dir: Path) -> None:
        """event_id='../..' → 상위 디렉토리 탈출 시도 → 차단."""
        with pytest.raises(PathTraversalError, match="traversal"):
            safe_save_photo(
                content=b"data",
                event_id="../../etc",
                photo_id="passwd",
                ext="png",
            )

    def test_absolute_photo_id_rejected(self, tmp_upload_dir: Path) -> None:
        """photo_id 에 경로 구분자가 섞인 케이스도 차단."""
        with pytest.raises(PathTraversalError, match="traversal"):
            safe_save_photo(
                content=b"data",
                event_id="evt_x",
                photo_id="../../../root_escape",
                ext="png",
            )


class TestResolvePhotoAbsPath:
    def test_normal_path_resolves(self, tmp_upload_dir: Path) -> None:
        rel = safe_save_photo(
            content=b"x",
            event_id="evt_r",
            photo_id="pho_r",
            ext="png",
        )
        abs_path = resolve_photo_abs_path(rel)
        assert abs_path.exists()
        assert abs_path.read_bytes() == b"x"

    def test_traversal_in_stored_path_rejected(
        self, tmp_upload_dir: Path
    ) -> None:
        # 악의적으로 조작된 상대 경로
        with pytest.raises(PathTraversalError):
            resolve_photo_abs_path("../../../../etc/passwd")


class TestDeletePhotoFile:
    def test_delete_existing_file(self, tmp_upload_dir: Path) -> None:
        rel = safe_save_photo(
            content=b"delete me",
            event_id="evt_del",
            photo_id="pho_del",
            ext="png",
        )
        assert delete_photo_file(rel) is True
        # 재삭제 시 False (idempotent)
        assert delete_photo_file(rel) is False

    def test_delete_nonexistent_returns_false(
        self, tmp_upload_dir: Path
    ) -> None:
        assert delete_photo_file("photos/evt_nope/pho_nope.png") is False

    def test_delete_traversal_path_safe(
        self, tmp_upload_dir: Path
    ) -> None:
        """악성 경로 삭제 시도 — raise 대신 False 반환 + 로그."""
        assert delete_photo_file("../../../etc/passwd") is False
