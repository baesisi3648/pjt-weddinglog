# @TASK P4-R1-T1 - TimelineService 단위 테스트
# @SPEC specs/screens/04_timeline.yaml
# @SPEC docs/planning/06-tasks.md#p4-r1-t1-timelineservice-챕터-그룹핑
"""
TimelineService 테스트.

핵심 시나리오:
- 빈 커플 → chapters=[], total_photos=0, pages=0
- WEDDING_PHOTO 이벤트 2개, 각 사진 3장 → chapter '웨딩촬영' 1개, photos 6장
- 혼합 카테고리 (STUDIO + VENUE + CEREMONY + HONEYMOON) → 챕터 3개 반환
- ETC 카테고리만 → '기타' 챕터만 반환
- selected=false 사진 제외 시 selected_photos 카운트 정확
- only_selected=True 옵션: photos 배열에는 선택 사진만, 집계는 전체 기준
- 챕터 내부 정렬: sort_order ASC
- chapter_number: 비어있는 챕터 제외 후 1부터 재부여
- 존재하지 않는 couple_id → 빈 타임라인
"""
from __future__ import annotations

from datetime import date, datetime

from sqlalchemy.orm import Session

from app.models.couple import Couple
from app.models.event import Event
from app.models.photo import Photo
from app.schemas.enums import Category
from app.services import timeline_service


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
def _make_couple(db: Session, cid: str = "cpl_tl") -> Couple:
    couple = Couple(
        id=cid,
        groom_name="성우",
        bride_name="은비",
        wedding_date=date(2026, 10, 25),
    )
    db.add(couple)
    db.flush()
    return couple


def _make_event(
    db: Session,
    couple_id: str,
    eid: str,
    category: str,
    *,
    title: str = "e",
    d: date = date(2026, 8, 1),
) -> Event:
    event = Event(
        id=eid,
        couple_id=couple_id,
        title=title,
        date=d,
        category=category,
    )
    db.add(event)
    db.flush()
    return event


def _make_photo(
    db: Session,
    event_id: str,
    pid: str,
    *,
    is_selected: bool = True,
    sort_order: int = 0,
    caption: str | None = None,
    created_at: datetime | None = None,
) -> Photo:
    photo = Photo(
        id=pid,
        event_id=event_id,
        file_path=f"photos/{event_id}/{pid}.jpg",
        caption=caption,
        caption_source="manual" if caption else None,
        is_selected=is_selected,
        sort_order=sort_order,
    )
    if created_at is not None:
        photo.created_at = created_at
    db.add(photo)
    db.flush()
    return photo


# -----------------------------------------------------------------------------
# Tests
# -----------------------------------------------------------------------------
class TestGetTimelineEmpty:
    def test_couple_without_events(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "cpl_tl_empty")
        result = timeline_service.get_timeline(db_session, couple.id)

        assert result["chapters"] == []
        assert result["total_photos"] == 0
        assert result["selected_photos"] == 0
        assert result["total_pages_estimated"] == 0

    def test_couple_with_event_but_no_photos(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "cpl_tl_no_photos")
        _make_event(
            db_session,
            couple.id,
            "evt_tl_np1",
            Category.WEDDING_PHOTO.value,
        )

        result = timeline_service.get_timeline(db_session, couple.id)
        assert result["chapters"] == []
        assert result["total_photos"] == 0
        assert result["total_pages_estimated"] == 0

    def test_nonexistent_couple_returns_empty(self, db_session: Session) -> None:
        # 서비스 레이어는 404 대신 빈 타임라인 반환.
        result = timeline_service.get_timeline(db_session, "cpl_missing")
        assert result["chapters"] == []
        assert result["total_photos"] == 0


class TestGetTimelineSingleChapter:
    def test_two_wedding_photo_events_with_three_photos_each(
        self, db_session: Session
    ) -> None:
        couple = _make_couple(db_session, "cpl_tl_wp")

        e1 = _make_event(
            db_session,
            couple.id,
            "evt_wp1",
            Category.WEDDING_PHOTO.value,
            title="본식 촬영",
        )
        e2 = _make_event(
            db_session,
            couple.id,
            "evt_wp2",
            Category.WEDDING_PHOTO.value,
            title="야외 촬영",
        )

        for i in range(3):
            _make_photo(db_session, e1.id, f"pho_wp1_{i}", sort_order=i)
            _make_photo(db_session, e2.id, f"pho_wp2_{i}", sort_order=i)

        result = timeline_service.get_timeline(db_session, couple.id)

        assert result["total_photos"] == 6
        assert result["selected_photos"] == 6
        # ceil(6 / 2.5) = 3
        assert result["total_pages_estimated"] == 3

        assert len(result["chapters"]) == 1
        chapter = result["chapters"][0]
        assert chapter["chapter_number"] == 1
        assert chapter["key"] == "wedding_photo"
        assert chapter["title"] == "웨딩촬영"
        assert chapter["color"] == "coral"
        assert chapter["photo_count"] == 6
        assert len(chapter["photos"]) == 6

        # 각 photo 에 file_url 과 event 메타가 붙어있어야 한다.
        first = chapter["photos"][0]
        assert first["file_url"].startswith("/api/photos/")
        assert first["file_url"].endswith("/file")
        assert first["event_title"] in {"본식 촬영", "야외 촬영"}
        assert first["category"] == "WEDDING_PHOTO"
        assert first["event_date"] == "2026-08-01"


class TestGetTimelineMixedCategories:
    def test_mixed_categories_produce_three_chapters(
        self, db_session: Session
    ) -> None:
        """STUDIO + VENUE (→ 준비의 날들), CEREMONY (→ 본식), HONEYMOON (→ 신혼여행).

        WEDDING_PHOTO / ETC 챕터는 사진이 없으므로 응답에서 제외.
        """
        couple = _make_couple(db_session, "cpl_tl_mix")

        e_studio = _make_event(
            db_session,
            couple.id,
            "evt_studio",
            Category.STUDIO_DRESS_MAKEUP.value,
        )
        e_venue = _make_event(
            db_session,
            couple.id,
            "evt_venue",
            Category.VENUE.value,
        )
        e_ceremony = _make_event(
            db_session,
            couple.id,
            "evt_ceremony",
            Category.CEREMONY.value,
        )
        e_honeymoon = _make_event(
            db_session,
            couple.id,
            "evt_honey",
            Category.HONEYMOON.value,
        )

        _make_photo(db_session, e_studio.id, "pho_s1")
        _make_photo(db_session, e_venue.id, "pho_v1")
        _make_photo(db_session, e_venue.id, "pho_v2")
        _make_photo(db_session, e_ceremony.id, "pho_c1")
        _make_photo(db_session, e_honeymoon.id, "pho_h1")
        _make_photo(db_session, e_honeymoon.id, "pho_h2")

        result = timeline_service.get_timeline(db_session, couple.id)

        # 챕터 3개: preparation(3장: s1+v1+v2), ceremony(1장), honeymoon(2장).
        assert len(result["chapters"]) == 3

        # 순서 검증: CHAPTER_MAPPING 의 선언 순서를 따르되, 비어있는 챕터 제외 후
        # chapter_number 는 1부터 재부여.
        keys = [c["key"] for c in result["chapters"]]
        assert keys == ["preparation", "ceremony", "honeymoon"]

        prep = result["chapters"][0]
        assert prep["chapter_number"] == 1
        assert prep["title"] == "준비의 날들"
        assert prep["color"] == "lavender"
        assert prep["photo_count"] == 3  # studio 1 + venue 2

        cer = result["chapters"][1]
        assert cer["chapter_number"] == 2
        assert cer["title"] == "그 날 — 본식"
        assert cer["photo_count"] == 1

        hm = result["chapters"][2]
        assert hm["chapter_number"] == 3
        assert hm["title"] == "첫 여행 — 신혼여행"
        assert hm["photo_count"] == 2

        assert result["total_photos"] == 6
        assert result["selected_photos"] == 6
        # ceil(6 / 2.5) = 3
        assert result["total_pages_estimated"] == 3


class TestGetTimelineEtcOnly:
    def test_etc_only_returns_etc_chapter(self, db_session: Session) -> None:
        couple = _make_couple(db_session, "cpl_tl_etc")
        e = _make_event(
            db_session, couple.id, "evt_etc", Category.ETC.value, title="기타"
        )
        _make_photo(db_session, e.id, "pho_etc1")
        _make_photo(db_session, e.id, "pho_etc2")

        result = timeline_service.get_timeline(db_session, couple.id)
        assert len(result["chapters"]) == 1
        assert result["chapters"][0]["key"] == "etc"
        assert result["chapters"][0]["title"] == "기타"
        assert result["chapters"][0]["color"] == "gray"
        assert result["chapters"][0]["photo_count"] == 2


class TestSelectedCounting:
    def test_selected_count_excludes_unselected(
        self, db_session: Session
    ) -> None:
        couple = _make_couple(db_session, "cpl_tl_sel")
        e = _make_event(
            db_session, couple.id, "evt_sel", Category.WEDDING_PHOTO.value
        )
        _make_photo(db_session, e.id, "pho_s_1", is_selected=True)
        _make_photo(db_session, e.id, "pho_s_2", is_selected=True)
        _make_photo(db_session, e.id, "pho_s_3", is_selected=False)
        _make_photo(db_session, e.id, "pho_s_4", is_selected=False)

        result = timeline_service.get_timeline(db_session, couple.id)

        assert result["total_photos"] == 4
        assert result["selected_photos"] == 2
        # ceil(2 / 2.5) = 1
        assert result["total_pages_estimated"] == 1

        # photo_count 는 전체 기준.
        assert result["chapters"][0]["photo_count"] == 4
        # photos 도 기본(only_selected=False) 에서는 모두 포함.
        assert len(result["chapters"][0]["photos"]) == 4

    def test_only_selected_filter_applies_to_photos_list(
        self, db_session: Session
    ) -> None:
        couple = _make_couple(db_session, "cpl_tl_only")
        e = _make_event(
            db_session, couple.id, "evt_only", Category.WEDDING_PHOTO.value
        )
        _make_photo(db_session, e.id, "pho_o_1", is_selected=True)
        _make_photo(db_session, e.id, "pho_o_2", is_selected=False)
        _make_photo(db_session, e.id, "pho_o_3", is_selected=True)

        result = timeline_service.get_timeline(
            db_session, couple.id, only_selected=True
        )

        # 집계는 전체 기준.
        assert result["total_photos"] == 3
        assert result["selected_photos"] == 2

        # photos 배열만 필터링.
        chapter = result["chapters"][0]
        assert chapter["photo_count"] == 3  # 전체 기준 유지
        returned_ids = [p["id"] for p in chapter["photos"]]
        assert set(returned_ids) == {"pho_o_1", "pho_o_3"}
        assert all(p["is_selected"] for p in chapter["photos"])


class TestPageEstimation:
    def test_page_formula_ceil_divide_by_2_5(self, db_session: Session) -> None:
        """selected=5 → ceil(5/2.5)=2, selected=6 → ceil(6/2.5)=3."""
        couple = _make_couple(db_session, "cpl_tl_page5")
        e = _make_event(
            db_session, couple.id, "evt_page5", Category.WEDDING_PHOTO.value
        )
        for i in range(5):
            _make_photo(db_session, e.id, f"pho_p5_{i}", is_selected=True)

        result = timeline_service.get_timeline(db_session, couple.id)
        assert result["selected_photos"] == 5
        assert result["total_pages_estimated"] == 2  # ceil(5/2.5)=2

    def test_page_count_45_photos_equals_18(self, db_session: Session) -> None:
        """spec 예시: 45장 선택 시 18페이지."""
        couple = _make_couple(db_session, "cpl_tl_page45")
        # 10장/이벤트 제약은 service(photo_service) 에만 있으므로,
        # 여기서는 여러 이벤트로 분산 생성.
        for ev_i in range(5):
            e = _make_event(
                db_session,
                couple.id,
                f"evt_p45_{ev_i}",
                Category.WEDDING_PHOTO.value,
            )
            for p_i in range(9):
                _make_photo(db_session, e.id, f"pho_p45_{ev_i}_{p_i}")

        result = timeline_service.get_timeline(db_session, couple.id)
        assert result["total_photos"] == 45
        assert result["selected_photos"] == 45
        # ceil(45/2.5) = 18
        assert result["total_pages_estimated"] == 18


class TestSortOrder:
    def test_photos_sorted_by_sort_order_then_created_at(
        self, db_session: Session
    ) -> None:
        couple = _make_couple(db_session, "cpl_tl_sort")
        e = _make_event(
            db_session, couple.id, "evt_sort", Category.WEDDING_PHOTO.value
        )

        _make_photo(db_session, e.id, "pho_sort_A", sort_order=5)
        _make_photo(db_session, e.id, "pho_sort_B", sort_order=1)
        _make_photo(db_session, e.id, "pho_sort_C", sort_order=3)

        result = timeline_service.get_timeline(db_session, couple.id)
        ordered_ids = [p["id"] for p in result["chapters"][0]["photos"]]
        assert ordered_ids == ["pho_sort_B", "pho_sort_C", "pho_sort_A"]
