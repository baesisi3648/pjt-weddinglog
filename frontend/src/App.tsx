// @TASK P1-S0-T1 - App 라우터 (Layout 공통 부모로 감싸기)
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import EventDetail from './pages/EventDetail';
import Timeline from './pages/Timeline';
import OrderCheckout from './pages/OrderCheckout';
import Orders from './pages/Orders';

function NotFound() {
  return <div className="p-8 font-display">404 — 페이지를 찾을 수 없습니다</div>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/events/:eventId" element={<EventDetail />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/order-checkout" element={<OrderCheckout />} />
        <Route path="/orders" element={<Orders />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
