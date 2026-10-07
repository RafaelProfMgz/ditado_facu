import { Link } from 'react-router-dom';

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-accent" />
        <g className="fill-paper">
          <rect x="7" y="13" width="3" height="6" rx="1.5" />
          <rect x="12" y="9" width="3" height="14" rx="1.5" />
          <rect x="17" y="6" width="3" height="20" rx="1.5" />
          <rect x="22" y="11" width="3" height="10" rx="1.5" />
        </g>
      </svg>
      Ditado
    </Link>
  );
}
