import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  CreditCard,
  Wallet,
  LogOut,
  Hexagon,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const nav = [
  { to: '/dashboard', label: 'Boshqaruv paneli', icon: LayoutDashboard },
  { to: '/restaurants', label: 'Restoranlar', icon: Store },
  { to: '/plans', label: 'Tariflar', icon: CreditCard },
  { to: '/payments', label: 'To‘lovlar', icon: Wallet },
];

export default function Layout() {
  const { logout } = useAuth();
  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 flex w-64 flex-col border-r border-slate-800 bg-slate-900 text-slate-300">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Hexagon size={18} strokeWidth={2.25} />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight text-white">
              Girgitton<span className="text-brand-400">AI</span>
            </div>
            <div className="text-[11px] text-slate-500">Super admin</div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <n.icon
                    size={18}
                    strokeWidth={2}
                    className={isActive ? 'text-brand-400' : 'text-slate-500'}
                  />
                  {n.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-white"
          >
            <LogOut size={18} strokeWidth={2} className="text-slate-500" />
            Chiqish
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
