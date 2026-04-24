// @TASK P0-T3 - Axios 인스턴스 (API 클라이언트)
import axios from 'axios';

// 빌드 시점 주입 (Vite VITE_* 환경변수):
//   dev  → undefined → '/api' (Vite proxy가 /api → backend:8000 전달)
//   prod → docker-compose build args 로 'http://localhost:${API_PORT}/api' 주입
//           (브라우저가 백엔드 포트로 직접 호출, CORS_ORIGINS 에 프론트 origin 허용 필요)
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 (인증 토큰 등 추가 자리)
api.interceptors.request.use(
  (config) => {
    // TODO: Authorization 헤더 추가 (Phase 1에서 구현)
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 (에러 토스트 준비 자리)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // TODO: 에러 토스트 알림 (Phase 1에서 구현)
    return Promise.reject(error);
  }
);

export default api;
