import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@demo.uz');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate('/orders', { replace: true });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/orders', { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-card">
            <UtensilsCrossed size={24} strokeWidth={2.25} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Girgitton<span className="text-brand-600">AI</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Restoran admin paneliga kiring
          </p>
        </div>

        <form onSubmit={submit} className="card p-6">
          <div className="mb-4">
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label" htmlFor="password">
              Parol
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {error}
            </p>
          )}

          <button
            disabled={loading}
            className="btn btn-primary mt-6 w-full"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Kirilmoqda…' : 'Kirish'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          Demo: admin@demo.uz / demo123
        </p>
      </div>
    </div>
  );
}
