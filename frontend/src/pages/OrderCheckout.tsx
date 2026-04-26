// @TASK P5-FRONTEND - OrderCheckout 4단계 실 API 연동 + AI 앨범 프리뷰
// @SPEC docs/planning/06-tasks.md#Phase5

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { composeAlbum } from '../services/album_api';
import { createOrder } from '../services/order_api';
import { getTimeline } from '../services/timeline_api';
import AlbumEditor from '../components/AlbumEditor';
import BookPreviewModal from '../components/BookPreviewModal';
import DaumPostcode from 'react-daum-postcode';
import Toast from '../components/Toast';
import type { AlbumLayout } from '../types/album';
import type { OrderFormat, OrderCoverType } from '../types/order';
import type { Photo } from '../types/photo';
import { photoUrl } from '../utils/photo';

const COUPLE_ID = 'cpl_sample_001';
const LS_KEY = 'weddinglog_selected_photos';

// 가격 계산
function calcPrice(format: OrderFormat, coverType: OrderCoverType, quantity: number) {
  const base = format === 'SQUARE' ? 150000 : 180000;
  const surcharge = coverType === 'HARD' ? 20000 : 0;
  return { base, surcharge, total: quantity * (base + surcharge) };
}

const fmt = (n: number) => n.toLocaleString() + '원';

// 전화번호 정규식 — 하이픈/공백 제거 후 010 + 10~11자리 검증.
// 허용: "01012345678", "010-1234-5678", "010 1234 5678"
const PHONE_RE = /^010[-\s]?\d{3,4}[-\s]?\d{4}$/;

type StepId = 1 | 2 | 3 | 4;

const STEPS: { id: StepId; label: string }[] = [
  { id: 1, label: '앨범 확인' },
  { id: 2, label: '옵션 선택' },
  { id: 3, label: '배송 정보' },
  { id: 4, label: '완료' },
];

interface FieldErrors {
  name?: string;
  phone?: string;
  address?: string;
}

export default function OrderCheckout() {
  const navigate = useNavigate();

  // ── Step 상태 ──
  const [step, setStep] = useState<StepId>(1);

  // ── Step 1: 앨범 구성 ──
  const [albumLayout, setAlbumLayout] = useState<AlbumLayout | null>(null);
  const [albumSource, setAlbumSource] = useState<'ai' | 'template' | null>(null);
  const [composeLoading, setComposeLoading] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  // MiniBookPreview 가 layout.photo_ids → 이미지로 그릴 수 있도록
  // 선택된 사진의 메타(file_url, caption)를 timeline 응답에서 가져온다.
  const [photoMap, setPhotoMap] = useState<Record<string, Photo>>({});

  // ── Step 2: 옵션 ──
  const [format, setFormat] = useState<OrderFormat>('SQUARE');
  const [coverType, setCoverType] = useState<OrderCoverType>('HARD');
  const [quantity, setQuantity] = useState(1);

  // ── Step 3: 배송 ──
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  // 주소 = 우편번호 + 도로명주소(또는 지번주소) + 상세주소.
  // 백엔드에는 합쳐서 한 줄로 보낸다 (recipient_address 단일 필드).
  const [postcode, setPostcode] = useState('');
  const [roadAddress, setRoadAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [postcodeOpen, setPostcodeOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // 백엔드 전송용: "[우편번호] 도로명주소 상세주소"
  const recipientAddress = roadAddress
    ? `[${postcode}] ${roadAddress} ${detailAddress}`.trim()
    : '';

  // ── Step 4: 완료 ──
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderCreatedAt, setOrderCreatedAt] = useState<string | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);

  // ── Toast ──
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  // ── 책 미리보기 모달 ──
  const [bookPreviewOpen, setBookPreviewOpen] = useState(false);

  // LocalStorage에서 사진 ID 로드
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      navigate('/timeline');
      return;
    }
    try {
      const ids = JSON.parse(raw) as string[];
      if (!ids.length) {
        navigate('/timeline');
        return;
      }
      setSelectedPhotoIds(ids);
    } catch {
      navigate('/timeline');
    }
  }, [navigate]);

  // selectedPhotoIds 가 채워지면 timeline 에서 사진 메타 (file_url) 수집.
  // - timeline 응답 chapters[].photos[]: { id, file_url, caption, ... }
  // - file_url 은 "/api/photos/{id}/file" 상대 경로 → photoUrl()로 절대화
  useEffect(() => {
    if (!selectedPhotoIds.length) return;
    let cancelled = false;
    (async () => {
      try {
        const tl = await getTimeline(COUPLE_ID);
        if (cancelled) return;
        const map: Record<string, Photo> = {};
        for (const ch of tl.chapters ?? []) {
          for (const p of ch.photos ?? []) {
            map[p.id] = {
              id: p.id,
              event_id: '',
              file_url: photoUrl(p.file_url),
              caption: p.caption ?? null,
              caption_source: null,
              is_selected: p.is_selected ?? false,
              sort_order: 0,
              created_at: '',
            } as Photo;
          }
        }
        setPhotoMap(map);
      } catch {
        // 사진 메타가 없어도 layout 자체는 보임 (회색 박스만)
      }
    })();
    return () => { cancelled = true; };
  }, [selectedPhotoIds]);

  // MiniBookPreview 에 넘길 photos 배열 (선택된 ID 만)
  const previewPhotos: Photo[] = useMemo(() => {
    if (!selectedPhotoIds.length) return [];
    return selectedPhotoIds
      .map((id) => photoMap[id])
      .filter((p): p is Photo => Boolean(p));
  }, [selectedPhotoIds, photoMap]);

  // compose 호출
  const runCompose = useCallback(async (photoIds: string[]) => {
    if (!photoIds.length) return;
    setComposeLoading(true);
    setComposeError(null);
    try {
      const res = await composeAlbum(COUPLE_ID, photoIds);
      setAlbumLayout(res.album_layout);
      setAlbumSource(res.source);
    } catch (err) {
      const e = err as { message?: string };
      setComposeError(e.message ?? 'AI 앨범 구성에 실패했습니다.');
    } finally {
      setComposeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPhotoIds.length > 0) {
      runCompose(selectedPhotoIds);
    }
  }, [selectedPhotoIds, runCompose]);

  const { base, surcharge, total } = calcPrice(format, coverType, quantity);

  // ── Step 3 검증 ──
  function validateStep3(): boolean {
    const errors: FieldErrors = {};
    if (recipientName.trim().length < 2) errors.name = '이름을 2자 이상 입력해주세요.';
    if (!PHONE_RE.test(recipientPhone)) errors.phone = '올바른 전화번호를 입력해주세요 (010-xxxx-xxxx 또는 01012345678).';
    if (recipientAddress.trim().length < 5) errors.address = '주소를 정확히 입력해주세요.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // ── 주문 생성 ──
  async function handleCreateOrder() {
    if (!albumLayout) {
      setToast({ message: '앨범 구성을 먼저 만들어주세요.', type: 'error' });
      return;
    }
    setOrderLoading(true);
    try {
      // 백엔드 ChapterSelectionSchema 형식으로 변환:
      //   { chapter_number, title, photo_ids[] }
      const chaptersSelected = albumLayout.chapters.map((ch) => ({
        chapter_number: ch.chapter_number,
        title: ch.title,
        photo_ids: ch.pages.flatMap((p) => p.photo_ids),
      }));
      const order = await createOrder(COUPLE_ID, {
        format,
        cover_type: coverType,
        quantity,
        chapters_selected: chaptersSelected,
        album_layout: albumLayout,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        recipient_address: recipientAddress,
      });
      setOrderId(order.id);
      setOrderCreatedAt(order.created_at);
      setStep(4);
    } catch (err) {
      const e = err as {
        response?: { data?: { detail?: unknown } };
        message?: string;
      };
      const detail = e.response?.data?.detail;
      const msg =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? (detail[0] as { msg?: string } | undefined)?.msg ?? '주문 생성에 실패했습니다.'
            : e.message ?? '주문 생성에 실패했습니다.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setOrderLoading(false);
    }
  }

  // 예상 배송일 (created_at + 14일)
  function calcDeliveryDate(createdAt: string): string {
    const d = new Date(createdAt);
    d.setDate(d.getDate() + 14);
    return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`;
  }


  return (
    <div className="flex flex-col items-center min-h-screen bg-background">
      {/* 미니 헤더 */}
      <header className="w-full max-w-container-max flex flex-col items-center py-sm mt-md mb-xl gap-1">
        <span className="font-display-md text-display-md text-on-surface tracking-tight">WeddingLog</span>
        <span className="font-body-sm text-on-surface-variant">앨범 주문</span>
      </header>

      <main className="w-full max-w-container-max px-gutter flex-1 flex flex-col pb-32">
        {/* ── 스테퍼 ── */}
        <nav aria-label="주문 진행 단계" className="mb-xl relative">
          <div aria-hidden="true" className="absolute inset-y-0 left-0 w-full flex items-center">
            <div className="h-px w-full bg-outline-variant" />
          </div>
          <ol className="relative flex justify-between" role="list">
            {STEPS.map((s) => {
              const state = s.id < step ? 'done' : s.id === step ? 'current' : 'future';
              return (
                <li key={s.id} className="relative flex flex-col items-center">
                  <div
                    className={`relative flex items-center justify-center rounded-full w-8 h-8 z-10 shadow-sm border ${
                      state === 'done'
                        ? 'bg-on-surface border-on-surface'
                        : state === 'current'
                        ? 'bg-primary-container border-on-surface'
                        : 'bg-background border-outline-variant'
                    }`}
                  >
                    {state === 'done' ? (
                      <span className="text-background text-[12px] font-bold leading-none" aria-hidden="true">✓</span>
                    ) : state === 'current' ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-on-surface" />
                    ) : null}
                  </div>
                  <span
                    className={`absolute -bottom-6 left-1/2 -translate-x-1/2 font-label-caps text-label-caps whitespace-nowrap ${
                      state === 'current' ? 'text-primary' : state === 'done' ? 'text-on-surface' : 'text-outline'
                    }`}
                  >
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* ── Step 1: 앨범 확인 ── */}
        {step === 1 && (
          <section className="flex flex-col gap-lg flex-1 mt-8">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">앨범 미리보기</h2>

            {composeLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div
                  className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin"
                  aria-hidden="true"
                />
                <p className="font-body-md text-on-surface-variant">AI가 앨범을 구성하고 있어요...</p>
              </div>
            )}

            {!composeLoading && composeError && (
              <div className="py-6 text-center">
                <p className="font-body-md text-error mb-4">{composeError}</p>
                <button
                  className="px-5 py-2.5 border border-outline rounded font-body-sm text-body-sm hover:bg-surface-variant transition-colors"
                  onClick={() => runCompose(selectedPhotoIds)}
                >
                  다시 시도
                </button>
              </div>
            )}

            {!composeLoading && albumLayout && (
              <div className="flex flex-col gap-md">
                {/* 서머리 + 배지 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-body-md text-on-surface">
                      총 <strong>{albumLayout.total_photos}장</strong>
                    </span>
                    <span className="text-outline-variant">·</span>
                    <span className="font-body-md text-on-surface">
                      <strong>{albumLayout.total_pages}페이지</strong> 예상
                    </span>
                    <span className="text-outline-variant">·</span>
                    <span className="font-body-md text-on-surface">
                      <strong>{albumLayout.chapters.length}개</strong> 챕터
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      albumSource === 'ai'
                        ? 'bg-primary-container text-on-surface border-primary-container'
                        : 'bg-surface-variant text-on-surface-variant border-outline-variant'
                    }`}
                  >
                    {albumSource === 'ai' ? 'AI 생성' : '기본 템플릿'}
                  </span>
                </div>

                {/* 편집 컨트롤 바 */}
                <div className="flex items-center gap-3 mt-2 mb-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full bg-coral text-white text-[13px] font-medium hover:opacity-90 transition-opacity"
                    onClick={() => setBookPreviewOpen(true)}
                  >
                    책으로 미리보기
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-[13px] text-ink-muted hover:text-ink underline-offset-4 hover:underline"
                    onClick={() => runCompose(selectedPhotoIds)}
                  >
                    AI 다시 구성
                  </button>
                </div>

                {/* AlbumEditor — 직접 편집 (사진 교체/순서/템플릿/추가/삭제) */}
                <AlbumEditor
                  layout={albumLayout}
                  photos={previewPhotos}
                  onChange={setAlbumLayout}
                />
              </div>
            )}
          </section>
        )}

        {/* ── Step 2: 옵션 선택 ── */}
        {step === 2 && (
          <section className="flex flex-col gap-lg flex-1 mt-8">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">옵션 선택</h2>

            {/* 판형 */}
            <div>
              <h3 className="font-body-md text-on-surface font-medium mb-sm">판형</h3>
              <div className="grid grid-cols-2 gap-gutter">
                {([
                  { value: 'SQUARE' as OrderFormat, label: '정사각형', desc: '인스타그램 감성의 아담한 사이즈.', note: '+0원' },
                  { value: 'A4' as OrderFormat, label: 'A4 비율', desc: '클래식한 앨범 느낌을 원하신다면.', note: '+30,000원' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    className={`relative flex flex-col p-md rounded-lg text-left transition-all hover:bg-surface-dim ${
                      format === opt.value
                        ? 'border-2 border-primary bg-surface shadow-sm'
                        : 'border border-outline-variant bg-surface'
                    }`}
                    onClick={() => setFormat(opt.value)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-body-md text-on-surface font-medium">{opt.label}</span>
                      <span
                        aria-hidden="true"
                        className={`w-5 h-5 rounded-full border flex items-center justify-center text-[12px] font-bold ${
                          format === opt.value ? 'border-coral bg-coral text-white' : 'border-outline'
                        }`}
                      >
                        {format === opt.value ? '✓' : ''}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{opt.desc}</p>
                    <p className="font-label-caps text-label-caps text-outline mt-2">{opt.note}</p>
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-t border-outline-variant" />

            {/* 표지 */}
            <div>
              <h3 className="font-body-md text-on-surface font-medium mb-sm">표지 소재</h3>
              <div className="flex gap-md">
                {([
                  { value: 'HARD' as OrderCoverType, label: '하드 커버 (양장)' },
                  { value: 'SOFT' as OrderCoverType, label: '소프트 커버' },
                ] as const).map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-xs cursor-pointer">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        coverType === value ? 'border-primary' : 'border-outline-variant'
                      }`}
                      onClick={() => setCoverType(value)}
                    >
                      {coverType === value && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <span
                      className={`font-body-md text-body-md transition-colors ${coverType === value ? 'text-on-surface' : 'text-on-surface-variant'}`}
                      onClick={() => setCoverType(value)}
                    >
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <hr className="border-t border-outline-variant" />

            {/* 수량 + 가격 */}
            <div className="flex justify-between items-end">
              <div>
                <h3 className="font-body-md text-on-surface font-medium mb-sm">수량</h3>
                <div className="flex items-center gap-md">
                  <div className="flex items-center border border-outline-variant rounded bg-surface overflow-hidden">
                    <button
                      aria-label="수량 줄이기"
                      className="p-2 hover:bg-surface-variant transition-colors disabled:opacity-40"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                    >
                      <span aria-hidden="true" className="text-on-surface-variant text-[18px] leading-none px-1">−</span>
                    </button>
                    <span className="w-12 text-center font-body-lg text-body-lg text-on-surface">{quantity}</span>
                    <button
                      aria-label="수량 늘리기"
                      className="p-2 hover:bg-surface-variant transition-colors disabled:opacity-40"
                      onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                      disabled={quantity >= 10}
                    >
                      <span aria-hidden="true" className="text-on-surface-variant text-[18px] leading-none px-1">+</span>
                    </button>
                  </div>
                  {quantity >= 2 ? (
                    <p className="font-body-sm text-body-sm text-primary italic">양가 부모님께도 드리기 좋은 권수</p>
                  ) : (
                    <p className="font-body-sm text-body-sm text-outline italic">1권도 충분합니다</p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="font-label-caps text-label-caps text-outline mb-1">총 결제 예정 금액</p>
                <p
                  className="text-on-surface leading-none"
                  style={{ fontFamily: 'Fraunces, serif', fontSize: '40px', fontWeight: 300 }}
                >
                  {fmt(total)}
                </p>
                {surcharge > 0 && (
                  <p className="font-body-sm text-body-sm text-outline mt-1">
                    기본 {fmt(base)} + 하드커버 {fmt(surcharge)}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Step 3: 배송 정보 ── */}
        {step === 3 && (
          <section className="flex flex-col gap-md flex-1 mt-8">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">배송 정보</h2>

            <div className="flex flex-col gap-md">
              {/* 이름 */}
              <div>
                <label className="font-body-sm text-body-sm text-on-surface-variant block mb-1" htmlFor="recipient-name">
                  수령인 이름
                </label>
                <input
                  id="recipient-name"
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="홍길동"
                  className={`w-full border rounded px-4 py-3 font-body-md text-body-md text-on-surface bg-surface outline-none focus:border-primary transition-colors ${
                    fieldErrors.name ? 'border-error' : 'border-outline-variant'
                  }`}
                />
                {fieldErrors.name && (
                  <p className="font-body-sm text-body-sm text-error mt-1">{fieldErrors.name}</p>
                )}
              </div>

              {/* 전화번호 */}
              <div>
                <label className="font-body-sm text-body-sm text-on-surface-variant block mb-1" htmlFor="recipient-phone">
                  휴대폰
                </label>
                <input
                  id="recipient-phone"
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="010-xxxx-xxxx"
                  className={`w-full border rounded px-4 py-3 font-body-md text-body-md text-on-surface bg-surface outline-none focus:border-primary transition-colors ${
                    fieldErrors.phone ? 'border-error' : 'border-outline-variant'
                  }`}
                />
                {fieldErrors.phone && (
                  <p className="font-body-sm text-body-sm text-error mt-1">{fieldErrors.phone}</p>
                )}
              </div>

              {/* 주소 — 한국 표준: 검색으로 도로명 자동 + 상세주소 직접 입력 */}
              <div>
                <label className="font-body-sm text-body-sm text-on-surface-variant block mb-1">
                  주소
                </label>

                {/* 우편번호 + 검색 버튼 */}
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={postcode}
                    readOnly
                    placeholder="우편번호"
                    aria-label="우편번호"
                    className="w-32 border border-outline-variant rounded px-3 py-2.5 font-body-md text-body-md text-on-surface bg-bg-soft outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setPostcodeOpen(true)}
                    className="px-4 py-2.5 rounded bg-coral text-white text-[13px] font-medium hover:opacity-90 transition-opacity"
                  >
                    주소 검색
                  </button>
                </div>

                {/* 도로명 주소 (read-only) */}
                <input
                  type="text"
                  value={roadAddress}
                  readOnly
                  placeholder="주소 검색을 눌러 도로명주소를 선택하세요"
                  aria-label="도로명 주소"
                  className={`w-full border rounded px-4 py-3 font-body-md text-body-md text-on-surface bg-bg-soft outline-none mb-2 ${
                    fieldErrors.address ? 'border-error' : 'border-outline-variant'
                  }`}
                />

                {/* 상세 주소 (사용자 입력) */}
                <input
                  type="text"
                  value={detailAddress}
                  onChange={(e) => setDetailAddress(e.target.value)}
                  placeholder="상세주소 (동/호수, 층 등)"
                  aria-label="상세 주소"
                  disabled={!roadAddress}
                  className={`w-full border rounded px-4 py-3 font-body-md text-body-md text-on-surface bg-surface outline-none focus:border-primary transition-colors disabled:bg-bg-soft disabled:cursor-not-allowed ${
                    fieldErrors.address ? 'border-error' : 'border-outline-variant'
                  }`}
                />
                {fieldErrors.address && (
                  <p className="font-body-sm text-body-sm text-error mt-1">{fieldErrors.address}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Step 4: 완료 ── */}
        {step === 4 && (
          <section className="flex flex-col items-center gap-lg flex-1 mt-16 text-center">
            {/* 체크 서클 — 코랄 단색 + 텍스트 ✓ */}
            <div className="w-20 h-20 rounded-full bg-coral text-white flex items-center justify-center">
              <span aria-hidden="true" className="text-[32px] font-light leading-none">✓</span>
            </div>

            <div>
              <h2 className="font-headline-sm text-on-surface mb-2" style={{ fontSize: '24px' }}>
                주문이 완료되었습니다
              </h2>
              {orderId && (
                <p
                  className="font-mono text-on-surface-variant"
                  style={{ fontFamily: 'monospace', fontSize: '14px', letterSpacing: '0.05em' }}
                >
                  {orderId}
                </p>
              )}
              {orderCreatedAt && (
                <p className="font-body-sm text-body-sm text-outline mt-2">
                  예상 배송일: {calcDeliveryDate(orderCreatedAt)}
                </p>
              )}
            </div>

            <div className="flex gap-sm mt-4">
              <button
                className="px-6 py-3 border border-outline text-on-surface rounded font-body-sm text-body-sm hover:bg-surface-variant transition-colors"
                onClick={() => navigate('/home')}
              >
                홈으로
              </button>
              <button
                className="px-8 py-3 bg-primary text-on-primary rounded font-body-sm text-body-sm hover:bg-primary-fixed-dim transition-colors shadow-sm"
                onClick={() => navigate('/orders')}
              >
                주문 관리로
              </button>
            </div>
          </section>
        )}
      </main>

      {/* ── 하단 고정 액션 바 (Step 1/2/3) ── */}
      {step < 4 && (
        <div className="fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-md border-t border-outline-variant py-sm px-gutter flex justify-center z-50">
          <div className="w-full max-w-container-max flex justify-between items-center">
            <button
              className="font-body-sm text-body-sm text-outline hover:text-on-surface transition-colors"
              onClick={() => navigate('/timeline')}
            >
              취소
            </button>
            <div className="flex gap-sm">
              {step > 1 && (
                <button
                  className="px-6 py-3 rounded-md border border-outline text-on-surface hover:bg-surface-variant transition-colors font-body-sm text-body-sm"
                  onClick={() => setStep((s) => (s - 1) as StepId)}
                >
                  이전 단계
                </button>
              )}
              {step === 1 && albumLayout && !composeLoading && (
                <button
                  className="px-8 py-3 rounded-md bg-primary text-on-primary hover:bg-primary-fixed-dim transition-colors font-body-sm text-body-sm shadow-sm flex items-center gap-2"
                  onClick={() => setStep(2)}
                >
                  만족해요
                  <span aria-hidden="true">→</span>
                </button>
              )}
              {step === 2 && (
                <button
                  className="px-8 py-3 rounded-md bg-primary text-on-primary hover:bg-primary-fixed-dim transition-colors font-body-sm text-body-sm shadow-sm flex items-center gap-2"
                  onClick={() => setStep(3)}
                >
                  다음으로
                  <span aria-hidden="true">→</span>
                </button>
              )}
              {step === 3 && (
                <button
                  className="px-8 py-3 rounded-md bg-primary text-on-primary hover:bg-primary-fixed-dim transition-colors font-body-sm text-body-sm shadow-sm flex items-center gap-2 disabled:opacity-50"
                  disabled={orderLoading}
                  onClick={async () => {
                    if (!validateStep3()) return;
                    await handleCreateOrder();
                  }}
                >
                  {orderLoading ? '처리 중...' : '주문하기'}
                  {!orderLoading && (
                    <span aria-hidden="true">✓</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* 책 미리보기 모달 — 양면 펼침 책 모션 */}
      {bookPreviewOpen && albumLayout && (
        <BookPreviewModal
          layout={albumLayout}
          photos={previewPhotos}
          onClose={() => setBookPreviewOpen(false)}
        />
      )}

      {/* 다음 우편번호 검색 모달 */}
      {postcodeOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="주소 검색"
          className="fixed inset-0 z-[1500] bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setPostcodeOpen(false)}
        >
          <div className="bg-bg w-full max-w-[520px] max-h-[85vh] overflow-hidden flex flex-col rounded">
            <div className="flex items-center justify-between px-5 py-3 border-b border-line">
              <h3 className="font-display-md text-[16px] text-ink">주소 검색</h3>
              <button
                onClick={() => setPostcodeOpen(false)}
                aria-label="닫기"
                className="text-ink-muted hover:text-ink text-[20px] leading-none px-2"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <DaumPostcode
                onComplete={(data) => {
                  // 도로명 우선, 없으면 지번주소.
                  const main = data.roadAddress || data.jibunAddress || data.address;
                  // 건물명이 있으면 괄호 안에 표시 (예: "성수동 카페거리타워(미왕빌딩)")
                  const withBuilding =
                    data.buildingName && data.autoRoadAddress !== ''
                      ? `${main} (${data.buildingName})`
                      : main;
                  setPostcode(data.zonecode);
                  setRoadAddress(withBuilding);
                  setDetailAddress('');
                  setPostcodeOpen(false);
                }}
                style={{ width: '100%', height: 460 }}
                autoClose={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
