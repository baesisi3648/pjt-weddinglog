// @TASK Blessing main photo — 책 첫 장 메인 사진 경로
//   기본값: 23_wedding_day_4 (꽃잎 축하 받으며 퇴장 컷, 외곽 여백 충분)
//   사용자가 새 사진 만들면 frontend/public/landing/blessing_main.png 로 저장 후
//   이 상수만 변경하면 됨.
import { photoUrl } from '../utils/photo';

// 시드 사진 (백엔드 timeline API 통해 가져온 file_url 형식)을 그대로 노출.
// 정적 이미지로 갈아끼우려면 '/landing/blessing_main.png' 같은 경로로 변경.
// → 백엔드 시드의 photo id 를 직접 참조하지 않고, 별도 정적 자산을 사용.
export const BLESSING_MAIN_PHOTO_PATH = '/landing/23_wedding_day_4.png';

// public 안의 정적 이미지는 절대 경로로 그대로 사용 (photoUrl 통하지 않아도 됨).
export const BLESSING_MAIN_PHOTO = BLESSING_MAIN_PHOTO_PATH;

// photoUrl 헬퍼는 외부 인터페이스 호환을 위해 export 만 유지.
export { photoUrl };
