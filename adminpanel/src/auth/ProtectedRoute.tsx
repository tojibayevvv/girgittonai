import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Yuklanmoqda…
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
