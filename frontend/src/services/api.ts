// @TASK P0-T3 - Axios 인스턴스 (API 클라이언트)
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
