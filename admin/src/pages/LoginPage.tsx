import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('super@girgitton.ai');
  const [password, setPassword] = useState('superadmin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) navigate('/dashboard', { replace: true });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Hexagon size={24} strokeWidth={2.25} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Girgitton<span className="text-brand-400">AI</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">Super admin paneli</p>
        </div>

        <form onSubmit={submit} className="rounded-xl bg-white p-6 shadow-card">
          <div className="mb-4">
            <label className="label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label">Parol</label>
            <input
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

          <button disabled={loading} className="btn btn-primary mt-6 w-full">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Kirilmoqda…' : 'Kirish'}
          </button>
        </form>
      </div>
    </div>
  );
}
