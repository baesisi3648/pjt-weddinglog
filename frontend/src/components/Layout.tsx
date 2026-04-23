// @TASK P1-S0-T1 - 공통 Layout (Header + Outlet)
// @SPEC docs/planning/06-tasks.md#P1-S0-T1
import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
  return (
    <div className="min-h-screen bg-coral-50 font-body">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
