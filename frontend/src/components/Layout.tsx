// @TASK STITCH-DESIGN - Layout 재작성 (아이보리 배경 + 800px container)
import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <Header />
      <main className="max-w-container-max mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 pb-24 md:pb-10">
        <Outlet />
      </main>
    </div>
  );
}
