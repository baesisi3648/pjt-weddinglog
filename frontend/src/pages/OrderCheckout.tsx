// @TASK STITCH-DESIGN - OrderCheckout 페이지 이식 (Stitch checkout_desktop/code.html 기반)
// @SPEC docs/planning/06-tasks.md#P1.5-S0-T1

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Format = 'square' | 'a4';
type Cover = 'hard' | 'soft';

interface Step {
  id: number;
  label: string;
}

export default function OrderCheckout() {
  const [format, setFormat] = useState<Format>('square');
  const [cover, setCover] = useState<Cover>('hard');
  const [qty, setQty] = useState(1);
  const navigate = useNavigate();

  const basePrice = 160000;
  const a4Surcharge = format === 'a4' ? 20000 : 0;
  const total = (basePrice + a4Surcharge) * qty;
  const fmt = (n: number) => n.toLocaleString() + '원';

  const steps: Step[] = [
    { id: 1, label: '배송 정보' },
    { id: 2, label: '옵션 선택' },
    { id: 3, label: '결제 방식' },
    { id: 4, label: '확인' },
  ];
  const current = 2;

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
            {steps.map((step) => {
              const state = step.id < current ? 'done' : step.id === current ? 'current' : 'future';
              return (
                <li key={step.id} className="relative flex flex-col items-center">
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
                      <span className="material-symbols-outlined text-background" style={{ fontSize: '16px', fontVariationSettings: "'wght' 600" }}>check</span>
                    ) : state === 'current' ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-on-surface" />
                    ) : null}
                  </div>
                  <span
                    className={`absolute -bottom-6 left-1/2 -translate-x-1/2 font-label-caps text-label-caps whitespace-nowrap ${
                      state === 'current' ? 'text-primary' : state === 'done' ? 'text-on-surface' : 'text-outline'
                    }`}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* ── 옵션 섹션 ── */}
        <section className="flex flex-col gap-lg flex-1 mt-8">
          {/* 판형 선택 */}
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-sm">판형을 선택해주세요</h2>
            <div className="grid grid-cols-2 gap-gutter">
              {/* 정사각형 */}
              <button
                className={`relative flex flex-col p-md rounded-lg text-left transition-all hover:bg-surface-dim ${
                  format === 'square'
                    ? 'border-2 border-primary bg-surface shadow-sm'
                    : 'border border-outline-variant bg-surface'
                }`}
                onClick={() => setFormat('square')}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="font-body-lg text-on-surface font-medium">정사각형</span>
                  <span className="material-symbols-outlined fill text-primary" style={{ fontSize: '20px', fontVariationSettings: `'FILL' ${format === 'square' ? 1 : 0}` }}>
                    {format === 'square' ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                </div>
                <div className="w-full aspect-square bg-surface-variant rounded border border-outline-variant flex items-center justify-center mb-4">
                  <div className="w-2/3 h-2/3 border border-outline bg-surface rounded-sm shadow-sm flex items-center justify-center">
                    <span className="font-label-caps text-label-caps text-outline">1:1 비율</span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">인스타그램 감성의 아담한 사이즈.</p>
                <p className="font-label-caps text-label-caps text-outline mt-2">+0원</p>
              </button>

              {/* A4 */}
              <button
                className={`relative flex flex-col p-md rounded-lg text-left transition-all hover:bg-surface-dim ${
                  format === 'a4'
                    ? 'border-2 border-primary bg-surface shadow-sm'
                    : 'border border-outline-variant bg-surface'
                }`}
                onClick={() => setFormat('a4')}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="font-body-lg text-on-surface font-medium">A4 비율</span>
                  <span className="material-symbols-outlined text-outline-variant" style={{ fontSize: '20px', fontVariationSettings: `'FILL' ${format === 'a4' ? 1 : 0}` }}>
                    {format === 'a4' ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                </div>
                <div className="w-full aspect-square bg-surface-variant rounded border border-outline-variant flex items-center justify-center mb-4">
                  <div className="w-2/3 h-[85%] border border-outline bg-surface rounded-sm shadow-sm flex items-center justify-center">
                    <span className="font-label-caps text-label-caps text-outline">세로형</span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">클래식한 앨범 느낌을 원하신다면.</p>
                <p className="font-label-caps text-label-caps text-outline mt-2">+20,000원</p>
              </button>
            </div>
          </div>

          <hr className="border-t border-outline-variant" />

          {/* 표지 소재 */}
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-sm">표지 소재</h2>
            <div className="flex gap-md">
              {[
                { value: 'hard' as Cover, label: '하드 커버 (양장)' },
                { value: 'soft' as Cover, label: '소프트 커버' },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-xs cursor-pointer group" onClick={() => setCover(value)}>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center relative transition-colors ${
                      cover === value ? 'border-primary' : 'border-outline-variant'
                    }`}
                  >
                    {cover === value && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <span className={`font-body-md text-body-md transition-colors ${cover === value ? 'text-on-surface' : 'text-on-surface group-hover:text-primary'}`}>
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
              <h2 className="font-headline-sm text-headline-sm text-on-surface mb-sm">수량</h2>
              <div className="flex items-center gap-md">
                <div className="flex items-center border border-outline-variant rounded bg-surface overflow-hidden">
                  <button
                    aria-label="수량 줄이기"
                    className="p-2 hover:bg-surface-variant transition-colors"
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                  >
                    <span className="material-symbols-outlined text-on-surface-variant">remove</span>
                  </button>
                  <span className="w-12 text-center font-body-lg text-body-lg text-on-surface">{qty}</span>
                  <button
                    aria-label="수량 늘리기"
                    className="p-2 hover:bg-surface-variant transition-colors"
                    onClick={() => setQty(q => Math.min(10, q + 1))}
                    disabled={qty >= 10}
                  >
                    <span className="material-symbols-outlined text-on-surface-variant">add</span>
                  </button>
                </div>
                {qty >= 2 ? (
                  <p className="font-body-sm text-body-sm text-primary italic">양가 부모님께도</p>
                ) : (
                  <p className="font-body-sm text-body-sm text-outline italic">1권도 충분합니다</p>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="font-label-caps text-label-caps text-outline mb-1">총 결제 예정 금액</p>
              <p
                className="font-display-lg text-on-surface leading-none"
                style={{ fontFamily: 'Fraunces, serif', fontSize: '40px', fontWeight: 300 }}
              >
                {fmt(total)}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ── 하단 고정 액션 바 ── */}
      <div className="fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-md border-t border-outline-variant py-sm px-gutter flex justify-center z-50">
        <div className="w-full max-w-container-max flex justify-between items-center">
          <button
            className="font-body-sm text-body-sm text-outline hover:text-on-surface transition-colors"
            onClick={() => navigate('/timeline')}
          >
            취소
          </button>
          <div className="flex gap-sm">
            <button
              className="px-6 py-3 rounded-md border border-outline text-on-surface hover:bg-surface-variant transition-colors font-body-sm text-body-sm"
              onClick={() => navigate(-1)}
            >
              이전 단계
            </button>
            <button
              className="px-8 py-3 rounded-md bg-primary text-on-primary hover:bg-primary-fixed-dim transition-colors font-body-sm text-body-sm shadow-sm flex items-center gap-2"
            >
              다음으로
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
