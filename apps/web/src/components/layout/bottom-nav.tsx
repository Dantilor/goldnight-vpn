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
      className="gn-safe-bottom fixed bottom-0 left-0 right-0 z-40 mx-auto w-full max-w-md border-t border-primary/10 bg-[#131313]/95 px-2 pt-2 backdrop-blur-xl"
      aria-label="Основная навигация"
    >
      <ul className="grid grid-cols-4 gap-1 rounded-2xl border border-outline-variant/10 bg-[#171615]/90 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
        {items.map((item) => (
          <li key={item.to} className="min-w-0">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-1.5 transition ${
                  isActive
                    ? 'bg-primary/[0.12] text-[var(--gn-gold)] shadow-[0_8px_22px_rgba(242,202,80,0.14)]'
                    : 'text-slate-400 hover:bg-white/[0.02] hover:text-slate-200'
                }`
              }
            >
              <span className="material-symbols-outlined shrink-0 text-[21px] leading-none">{item.icon}</span>
              <span className="max-w-full truncate text-center text-[10px] font-semibold leading-tight tracking-tight">
                {item.label}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
