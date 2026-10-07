import { History, LogOut, Mic, Shield } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { Logo } from './Logo';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-accent-soft text-accent-dark' : 'text-muted hover:text-ink'
  }`;

export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  function logout() {
    clear();
    queryClient.clear(); // não deixar dados de um usuário para o próximo
    navigate('/entrar');
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Logo to="/app" />
          <nav className="flex flex-1 flex-wrap items-center gap-1">
            <NavLink to="/app" end className={linkClass}>
              <Mic className="size-4" aria-hidden /> Transcrever
            </NavLink>
            <NavLink to="/app/historico" className={linkClass}>
              <History className="size-4" aria-hidden /> Histórico
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/app/admin" className={linkClass}>
                <Shield className="size-4" aria-hidden /> Admin
              </NavLink>
            )}
          </nav>
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden text-muted sm:inline">{user?.name}</span>
            <button onClick={logout} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-muted hover:text-ink" type="button">
              <LogOut className="size-4" aria-hidden /> Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
