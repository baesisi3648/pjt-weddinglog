// @TASK BlessingsPage — 책 첫 장 (사진 위 손글씨 축복 메시지 + QR)
//   · 메인 사진을 풀페이지로 깔고 그 위에 흰 손글씨 메시지 8~10개를 외곽에 분산
//   · 사진 우측 상단 QR 1개 → 클릭 시 모든 메시지를 일렬로 보여주는 모달
//   · BookPreviewModal(읽기 전용) + AlbumEditor(읽기 전용) 양쪽에서 사용
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  BLESSINGS_MAIN_PHOTO,
  DEFAULT_BLESSINGS,
  type BlessingMessage,
} from '../constants/blessings';

interface Props {
  /** 메인 사진 src (없으면 기본값 사용) */
  mainPhoto?: string;
  /** 표시할 메시지 (없으면 시드 사용) */
  messages?: BlessingMessage[];
  /** QR 들어가는 URL (시연용 — 가짜) */
  qrValue?: string;
  /** 책 미리보기 톤(밝은 배경)인지, 편집 페이지(살짝 톤다운)인지 */
  variant?: 'book' | 'editor';
}

const SIZE_CLASS: Record<NonNullable<BlessingMessage['size']>, string> = {
  sm: 'text-[14px]',
  md: 'text-[18px]',
  lg: 'text-[24px]',
};

export default function BlessingsPage({
  mainPhoto = BLESSINGS_MAIN_PHOTO,
  messages = DEFAULT_BLESSINGS,
  qrValue,
  variant = 'book',
}: Props) {
  const [open, setOpen] = useState(false);
  const qrUrl =
    qrValue ?? `weddinglog://blessings?count=${messages.length}`;

  return (
    <div className="relative w-full h-full overflow-hidden bg-ink">
      {/* 메인 사진 */}
      <img
        src={mainPhoto}
        alt="본식 메인"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 가독성용 살짝 어두운 그라디언트 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/35 via-ink/15 to-ink/40" />

      {/* 좌상단 라벨 */}
      <div className="absolute top-3 left-4 text-white">
        <div
          className="font-mono text-[8px] tracking-[0.3em] opacity-90"
          aria-hidden="true"
        >
          WEDDING ALBUM · 2026
        </div>
      </div>

      {/* 우상단 QR — 클릭 시 메시지 일람 모달 (절반 사이즈) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute top-2 right-2 bg-white p-1 rounded-sm shadow-md hover:scale-105 transition-transform"
        aria-label="축하 메시지 전체 보기"
        title="QR 스캔 또는 클릭하면 모든 축하 메시지를 볼 수 있어요"
      >
        <QRCodeSVG value={qrUrl} size={24} bgColor="#ffffff" fgColor="#1A1614" />
      </button>

      {/* 메시지 8~10개 — 외곽 슬롯에 분산 */}
      {messages.map((m) => {
        const sizeCls = SIZE_CLASS[m.size ?? 'sm'];
        return (
          <div
            key={m.id}
            className={`absolute font-hand-ko text-white pointer-events-none ${sizeCls}`}
            style={{
              ...m.pos,
              transform: `rotate(${m.rotate}deg)`,
              maxWidth: 220,
              textShadow: '0 1px 3px rgba(0,0,0,0.55)',
              lineHeight: 1.25,
              letterSpacing: '-0.3px',
            }}
          >
            <span className="block">{m.text}</span>
            <span
              className="block font-hand-en text-[10px] opacity-85 mt-0.5"
              style={{ letterSpacing: '0.5px' }}
            >
              — {m.name}
            </span>
          </div>
        );
      })}


      {/* 메시지 일람 팝업 */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="축하 메시지 모음"
          className="fixed inset-0 z-[1800] bg-ink/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-bg w-full max-w-[480px] max-h-[85vh] overflow-hidden flex flex-col rounded">
            <div className="flex items-baseline justify-between px-6 py-4 border-b border-line">
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] text-coral mb-1">
                  BLESSINGS · {messages.length}
                </p>
                <h3 className="font-display-md text-[18px] text-ink">
                  축하 메시지
                </h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="text-ink-muted hover:text-ink text-[20px] leading-none px-2"
              >
                ×
              </button>
            </div>

            <ul className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-line">
              {messages.map((m) => (
                <li key={m.id} className="py-4">
                  <p
                    className="font-hand-ko text-[18px] text-ink leading-tight mb-1"
                    style={{ letterSpacing: '-0.3px' }}
                  >
                    {m.text}
                  </p>
                  <p className="text-[12px] text-ink-muted">
                    — {m.name}
                    {m.relation && (
                      <span className="text-line mx-1.5">·</span>
                    )}
                    {m.relation && (
                      <span className="text-ink-muted">{m.relation}</span>
                    )}
                  </p>
                </li>
              ))}
            </ul>

            <div className="px-6 py-3 border-t border-line bg-bg-soft text-center">
              <p className="text-[11px] text-ink-muted leading-relaxed">
                실물 책에서 우측 상단 QR을 스캔하면
                <br />
                축하 영상 메시지로 연결됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* editor 모드일 때 살짝 안내 (읽기 전용) */}
      {variant === 'editor' && (
        <div className="absolute inset-x-0 bottom-2 flex justify-center pointer-events-none">
          <span className="text-[10px] text-white/70 font-mono tracking-wider bg-ink/40 px-2 py-0.5 rounded-sm">
            Blessings page · preview only
          </span>
        </div>
      )}
    </div>
  );
}
