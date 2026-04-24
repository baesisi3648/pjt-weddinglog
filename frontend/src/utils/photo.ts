// 사진 파일 URL 헬퍼
//
// Backend는 photo.file_url 을 '/api/photos/{id}/file' 상대 경로로 반환한다.
// axios 는 baseURL(VITE_API_URL = 'http://localhost:8100/api')로 요청을 보내지만,
// <img src>는 그 규칙을 따르지 않아 현재 페이지 origin(3100)으로 요청 → 404.
// 이 헬퍼가 file_url 앞에 API origin을 붙여 절대 URL로 만든다.

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/api\/?$/, '');

/**
 * photo.file_url (또는 유사 상대 경로)을 절대 URL로 변환.
 *
 * 예:
 *   photoUrl('/api/photos/abc/file')
 *     → 'http://localhost:8100/api/photos/abc/file' (prod)
 *     → '/api/photos/abc/file' (dev, VITE_API_URL=/api)
 */
export function photoUrl(fileUrl: string | null | undefined): string {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
  // API_ORIGIN이 비어있으면(/api 상대) Vite dev proxy가 처리
  return `${API_ORIGIN}${fileUrl}`;
}
