import { NavLink, Outlet } from 'react-router-dom';
import {
  Receipt,
  UtensilsCrossed,
  FolderTree,
  QrCode,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const nav = [
  { to: '/orders', label: 'Buyurtmalar', icon: Receipt },
  { to: '/products', label: 'Mahsulotlar', icon: UtensilsCrossed },
  { to: '/categories', label: 'Kategoriyalar', icon: FolderTree },
  { to: '/tables', label: 'Stollar / QR', icon: QrCode },
];

export default function Layout() {
  const { logout } = useAuth();
  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <UtensilsCrossed size={18} strokeWidth={2.25} />
          </div>
          <div className="text-[15px] font-semibold tracking-tight text-slate-900">
            Girgitton<span className="text-brand-600">AI</span>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <n.icon
                    size={18}
                    className={isActive ? 'text-brand-600' : 'text-slate-400'}
                    strokeWidth={2}
                  />
                  {n.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut size={18} className="text-slate-400" strokeWidth={2} />
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
