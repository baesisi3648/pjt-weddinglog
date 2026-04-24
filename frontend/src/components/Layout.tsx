// @TASK STITCH-DESIGN - Layout 재작성 (아이보리 배경 + 800px container)
import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <Header />
      <main className="max-w-container-max mx-auto px-gutter py-lg pb-24 md:pb-lg">
        <Outlet />
      </main>
    </div>
  );
}
