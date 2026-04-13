import { NavLink } from 'react-router-dom';

const items: Array<{ to: string; label: string; icon: string }> = [
  { to: '/home', label: 'Главная', icon: 'home' },
  { to: '/plans', label: 'Планы', icon: 'inventory_2' },
  { to: '/connect', label: 'VPN', icon: 'vpn_key' },
  { to: '/profile', label: 'Профиль', icon: 'person' }
];

export function BottomNav() {
  return (
    <nav
      className="gn-safe-bottom fixed bottom-0 left-0 right-0 z-40 mx-auto w-full max-w-md border-t border-[var(--gn-outline-soft)] bg-[#131313]/95 px-1 pt-1 backdrop-blur-xl"
      aria-label="Основная навигация"
    >
      <ul className="grid grid-cols-4 gap-0.5">
        {items.map((item) => (
          <li key={item.to} className="min-w-0">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 transition-colors ${
                  isActive
                    ? 'text-[var(--gn-gold)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <span className="material-symbols-outlined shrink-0 text-[22px] leading-none">{item.icon}</span>
              <span className="max-w-full truncate text-center text-[10px] font-semibold uppercase leading-tight tracking-tight">
                {item.label}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
