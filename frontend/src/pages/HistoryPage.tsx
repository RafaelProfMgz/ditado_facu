import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';
import { Pagination } from '../components/ui/Pagination';
import { getErrorMessage } from '../lib/errors';
import { formatDate, formatDuration } from '../lib/format';
import { listTranscriptions } from '../services/transcriptions';

export function HistoryPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('pagina')) || 1);
  const query = useQuery({
    queryKey: ['transcriptions', 'list', page],
    queryFn: () => listTranscriptions(page),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Histórico</h1>
        {query.data && <p className="mt-1 text-muted">{query.data.total} transcrição(ões)</p>}
      </div>

      {query.isPending && <Loader2 className="size-6 animate-spin text-accent" aria-label="Carregando" />}
      {query.isError && <Alert>{getErrorMessage(query.error)}</Alert>}

      {query.data && query.data.items.length === 0 && (
        <Card className="text-center">
          <p className="text-muted">Nenhuma transcrição ainda.</p>
          <Link to="/app" className="mt-2 inline-block font-medium text-accent hover:underline">
            Enviar o primeiro áudio
          </Link>
        </Card>
      )}

      {query.data && query.data.items.length > 0 && (
        <>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {query.data.items.map((t) => (
              <li key={t.id}>
                <Link to={`/app/historico/${t.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-accent-soft/30">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 text-sm">
                      <span className="truncate font-medium">{t.originalFilename}</span>
                      <span className="text-muted">{formatDate(t.createdAt)}</span>
                      <span className="text-muted">{formatDuration(t.durationSeconds)}</span>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted">{t.preview || '—'}</p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          <Pagination
            page={page}
            limit={query.data.limit}
            total={query.data.total}
            onChange={(p) => setParams({ pagina: String(p) })}
          />
        </>
      )}
    </div>
  );
}
