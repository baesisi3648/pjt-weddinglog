// @TASK P1-S0-T1 - 공통 Header 컴포넌트
// @SPEC docs/planning/06-tasks.md#P1-S0-T1
import { NavLink, Link } from 'react-router-dom';

const NAV_ITEMS: { to: string; label: string }[] = [
  { to: '/', label: 'Home' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/timeline', label: 'Timeline' },
  { to: '/orders', label: 'Orders' },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-coral-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* 로고 — Mockup v3 .wl-logo-mark 스타일 참조 */}
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 rounded"
          aria-label="WeddingLog 홈으로 이동"
        >
          {/* .wl-logo-mark: 28×28 dark square, Fraunces, heart accent */}
          <span
            className="relative w-8 h-8 rounded-[9px] bg-gray-900 text-white font-display text-sm grid place-items-center select-none"
            aria-hidden="true"
          >
            W
            <span className="absolute right-[3px] bottom-[2px] text-[6px] text-coral-500">♥</span>
          </span>
          <span className="font-display text-lg font-semibold text-gray-900 leading-tight tracking-tight">
            WeddingLog
          </span>
        </Link>

        {/* 네비게이션 — 모바일: inline-flex 가로 스크롤 */}
        <nav
          className="flex items-center gap-1 overflow-x-auto scrollbar-none"
          aria-label="주요 메뉴"
        >
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                [
                  'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-500',
                  isActive
                    ? 'bg-coral-100 text-coral-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                ].join(' ')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
