import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export function Pagination({ page, limit, total, onChange }: { page: number; limit: number; total: number; onChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <nav className="flex items-center justify-between pt-4 text-sm text-muted" aria-label="Paginação">
      <Button variant="ghost" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        <ChevronLeft className="size-4" aria-hidden /> Anterior
      </Button>
      <span>
        Página {page} de {pages}
      </span>
      <Button variant="ghost" onClick={() => onChange(page + 1)} disabled={page >= pages}>
        Próxima <ChevronRight className="size-4" aria-hidden />
      </Button>
    </nav>
  );
}
