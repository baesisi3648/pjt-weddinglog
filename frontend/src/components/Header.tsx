// @TASK STITCH-DESIGN - Header 재작성 (Stitch home_desktop/code.html 기반)
import { NavLink, Link } from 'react-router-dom';

const NAV_ITEMS: { to: string; label: string; icon: string; mobileIcon: string }[] = [
  { to: '/', label: 'Home', icon: 'home', mobileIcon: 'home' },
  { to: '/calendar', label: 'Calendar', icon: 'calendar_today', mobileIcon: 'calendar_today' },
  { to: '/timeline', label: 'Timeline', icon: 'auto_stories', mobileIcon: 'auto_stories' },
  { to: '/orders', label: 'Orders', icon: 'receipt_long', mobileIcon: 'receipt_long' },
];

export default function Header() {
  return (
    <>
      {/* 데스크톱 상단 헤더 */}
      <header className="hidden md:flex justify-between items-center max-w-container-max mx-auto px-4 h-16 w-full sticky top-0 z-50 bg-[#FAF9F6] border-b border-[#E3DBC8]">
        <Link
          to="/"
          aria-label="WeddingLog 홈으로 이동"
          className="text-2xl font-display-md font-bold text-on-surface hover:opacity-80 transition-opacity"
        >
          WeddingLog
        </Link>

        <nav className="flex gap-6 items-center" aria-label="주요 메뉴">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                isActive
                  ? 'text-on-surface border-b-2 border-primary-container pb-1 font-body-sm text-body-sm hover:opacity-80 transition-opacity duration-200'
                  : 'text-[#B5AEA0] hover:text-on-surface transition-colors font-body-sm text-body-sm hover:opacity-80 duration-200'
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4 text-primary-container">
          <span className="material-symbols-outlined cursor-pointer hover:opacity-80 transition-opacity duration-200">
            favorite
          </span>
        </div>
      </header>

      {/* 모바일 하단 네비게이션 */}
      <nav
        className="md:hidden fixed bottom-0 w-full bg-[#FAF9F6] border-t border-[#E3DBC8] z-50 flex justify-around py-3"
        aria-label="모바일 메뉴"
      >
        {NAV_ITEMS.map(({ to, label, mobileIcon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 ${isActive ? 'text-on-surface' : 'text-[#B5AEA0] hover:text-on-surface'}`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {mobileIcon}
                </span>
                <span className="font-label-caps text-[10px]">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
