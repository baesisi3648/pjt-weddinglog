// @TASK P1-S0-T1 - App 라우터
//   /          = Landing (자체 헤더, 데모 진입점) — eager
//   /home      = 데모 홈 (Layout — 공통 GNB) — eager
//   /calendar, /events/:id, /timeline, /order-checkout, /orders = Layout 안 — lazy
//
// 코드 스플리팅: 진입점 두 화면(Landing / Home)만 초기 번들에 포함하고,
// 나머지는 React.lazy 로 라우트 진입 시점에 로드. 큰 컴포넌트
// (PhotoCurationModal, AlbumEditor, BookPreviewModal 등)가 초기 번들에서 빠진다.
import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Home from './pages/Home';

const Calendar = lazy(() => import('./pages/Calendar'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const Timeline = lazy(() => import('./pages/Timeline'));
const OrderCheckout = lazy(() => import('./pages/OrderCheckout'));
const Orders = lazy(() => import('./pages/Orders'));

function NotFound() {
  return <div className="p-8 font-display">404 — 페이지를 찾을 수 없습니다</div>;
}

function RouteLoading() {
  return (
    <div className="p-8 text-center text-on-surface-variant font-body-sm">
      불러오는 중…
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/events/:eventId" element={<EventDetail />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/order-checkout" element={<OrderCheckout />} />
          <Route path="/orders" element={<Orders />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
