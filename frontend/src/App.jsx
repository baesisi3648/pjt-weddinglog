// @TASK P0-T3 - App 라우터 (Phase 1.5에서 실제 구현 예정)
import { Routes, Route } from 'react-router-dom';

function Home() {
  return <div className="p-8 font-display">Home (Phase 1.5에서 구현)</div>;
}

function Calendar() {
  return <div className="p-8 font-display">Calendar (Phase 1.5에서 구현)</div>;
}

function EventDetail() {
  return <div className="p-8 font-display">EventDetail (Phase 1.5에서 구현)</div>;
}

function Timeline() {
  return <div className="p-8 font-display">Timeline (Phase 1.5에서 구현)</div>;
}

function OrderCheckout() {
  return <div className="p-8 font-display">OrderCheckout (Phase 1.5에서 구현)</div>;
}

function Orders() {
  return <div className="p-8 font-display">Orders (Phase 1.5에서 구현)</div>;
}

function NotFound() {
  return <div className="p-8 font-display">404 — 페이지를 찾을 수 없습니다</div>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/events/:eventId" element={<EventDetail />} />
      <Route path="/timeline" element={<Timeline />} />
      <Route path="/order-checkout" element={<OrderCheckout />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
