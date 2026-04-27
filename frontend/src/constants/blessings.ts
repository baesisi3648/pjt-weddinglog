// @TASK Blessings — 책 첫 장 (사진 위 손글씨 축복 메시지)
//   사용자가 편집 모드에서 메시지/위치 수정 가능하도록 기본값.
//   사진 인물(가운데)을 피해 외곽 8슬롯에 분산 배치.

import { BLESSING_MAIN_PHOTO } from './blessing_photo';

export interface BlessingMessage {
  id: string;
  name: string;
  relation?: string;
  text: string;
  // 사진 위 절대 위치(%) — 외곽에 분산.
  pos: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  rotate: number; // ±5° 정도
  size?: 'sm' | 'md' | 'lg';
}

export const BLESSINGS_MAIN_PHOTO = BLESSING_MAIN_PHOTO;

// 사용자가 직접 수정 가능. 시드 데이터 10개.
export const DEFAULT_BLESSINGS: BlessingMessage[] = [
  {
    id: 'b01',
    name: '김민재',
    relation: '신랑 친구',
    text: '두 분 시작을 응원해요 ♡',
    pos: { top: '8%', left: '4%' },
    rotate: -3,
    size: 'md',
  },
  {
    id: 'b02',
    name: '박지윤',
    relation: '신부 동기',
    text: '축하해 행복해라 :)',
    pos: { top: '12%', right: '6%' },
    rotate: 4,
    size: 'md',
  },
  {
    id: 'b03',
    name: '이서연',
    relation: '직장 동료',
    text: '예쁘게 잘 살아',
    pos: { top: '32%', left: '3%' },
    rotate: -5,
    size: 'sm',
  },
  {
    id: 'b04',
    name: '신랑 어머니',
    relation: '시어머니',
    text: '둘 다 너무 이쁘다.',
    pos: { top: '34%', right: '4%' },
    rotate: 2,
    size: 'sm',
  },
  {
    id: 'b05',
    name: '신부 동생',
    relation: '처제',
    text: '형부 우리 언니 잘 부탁해요.',
    pos: { bottom: '32%', left: '5%' },
    rotate: -2,
    size: 'sm',
  },
  {
    id: 'b07',
    name: '정수민',
    relation: '신랑 절친',
    text: '축하 또 축하! ★',
    pos: { bottom: '14%', left: '7%' },
    rotate: -4,
    size: 'md',
  },
  {
    id: 'b08',
    name: '회사 선배',
    relation: '회사 동료',
    text: '행복하세요',
    pos: { bottom: '8%', right: '8%' },
    rotate: 3,
    size: 'sm',
  },
  {
    id: 'b09',
    name: '큰 이모',
    relation: '친지',
    text: '따뜻한 가정 이루세요',
    pos: { top: '52%', left: '3%' },
    rotate: -3,
    size: 'sm',
  },
  {
    id: 'b10',
    name: '신부 아버지',
    relation: '장인 어른',
    text: '우리 영희 다 컸네. 시집도 가고!',
    pos: { top: '54%', right: '3%' },
    rotate: 2,
    size: 'sm',
  },
];
