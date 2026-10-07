import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/** /app/* exige sessão. */
export function ProtectedRoute() {
  const token = useAuthStore((s) => s.accessToken);
  const location = useLocation();
  if (!token) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** /app/admin exige papel admin. A proteção real é a do backend; isto só evita a tela vazia. */
export function AdminRoute() {
  const role = useAuthStore((s) => s.user?.role);
  if (role !== 'admin') return <Navigate to="/app" replace />;
  return <Outlet />;
}

/** /entrar e /cadastrar: quem já está logado vai direto para /app. */
export function PublicOnlyRoute() {
  const token = useAuthStore((s) => s.accessToken);
  if (token) return <Navigate to="/app" replace />;
  return <Outlet />;
}
