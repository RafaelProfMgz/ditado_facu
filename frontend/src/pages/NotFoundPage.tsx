import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-display text-6xl font-bold text-accent">404</p>
      <p className="text-muted">Esta página não existe.</p>
      <Link to="/" className="font-medium text-accent hover:underline">
        Voltar ao início
      </Link>
    </div>
  );
}
