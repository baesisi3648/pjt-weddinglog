// @TASK Header — 데모 GNB (영상 원칙 적용)
//   · 텍스트 로고 (아이콘 ❌)
//   · 메뉴는 텍스트만 (Material Symbols 제거)
//   · 강조선 = coral 1색
//   · 모바일 하단 네비도 텍스트 + 단색 점만 사용
import { NavLink, Link } from 'react-router-dom';

const NAV_ITEMS: { to: string; label: string }[] = [
  { to: '/home', label: 'Home' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/timeline', label: 'Timeline' },
  { to: '/orders', label: 'Orders' },
];

export default function Header() {
  return (
    <>
      {/* 데스크톱 */}
      <header className="hidden md:flex justify-between items-center max-w-container-max mx-auto px-6 lg:px-10 h-16 w-full sticky top-0 z-50 bg-bg/90 backdrop-blur-md border-b border-line">
        <Link
          to="/"
          aria-label="WeddingLog 랜딩으로 이동"
          className="font-display-md text-[20px] tracking-tight text-ink hover:opacity-80 transition-opacity"
        >
          WeddingLog
        </Link>

        <nav className="flex gap-8 items-center" aria-label="주요 메뉴">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/home'}
              className={({ isActive }) =>
                isActive
                  ? 'text-ink text-[14px] tracking-tight font-medium border-b-2 border-coral pb-1 transition-colors'
                  : 'text-ink-muted text-[14px] tracking-tight hover:text-ink transition-colors'
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <Link
          to="/order-checkout"
          className="px-4 py-1.5 rounded-full bg-coral text-white text-[12px] font-medium hover:opacity-90 transition-opacity"
        >
          앨범 주문
        </Link>
      </header>

      {/* 모바일 하단 — 텍스트만 */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 bg-bg/95 backdrop-blur-md border-t border-line z-50 flex justify-around py-3"
        aria-label="모바일 메뉴"
      >
        {NAV_ITEMS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/home'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 ${
                isActive ? 'text-ink' : 'text-ink-muted hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="text-[12px] tracking-tight font-medium">{label}</span>
                <span
                  className={`block w-1 h-1 rounded-full ${
                    isActive ? 'bg-coral' : 'bg-transparent'
                  }`}
                />
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
