import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CopyButton } from '../components/ui/CopyButton';
import { getErrorMessage } from '../lib/errors';
import { formatBytes, formatDate, formatDuration } from '../lib/format';
import { deleteTranscription, getTranscription } from '../services/transcriptions';

export function TranscriptionDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['transcriptions', 'detail', id], queryFn: () => getTranscription(id), retry: false });
  const remove = useMutation({
    mutationFn: () => deleteTranscription(id),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['transcriptions', 'detail', id] });
      await queryClient.invalidateQueries({ queryKey: ['transcriptions', 'list'] });
      navigate('/app/historico', { replace: true });
    },
  });

  const t = query.data;

  return (
    <div className="space-y-6">
      <Link to="/app/historico" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Histórico
      </Link>

      {query.isPending && <Loader2 className="size-6 animate-spin text-accent" aria-label="Carregando" />}
      {query.isError && <Alert>{getErrorMessage(query.error)}</Alert>}

      {t && (
        <Card>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl font-bold">{t.originalFilename}</h1>
              <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                <div><dt className="sr-only">Data</dt><dd>{formatDate(t.createdAt)}</dd></div>
                <div><dt className="sr-only">Duração</dt><dd>{formatDuration(t.durationSeconds)}</dd></div>
                <div><dt className="sr-only">Tamanho</dt><dd>{formatBytes(t.sizeBytes)}</dd></div>
                <div><dt className="sr-only">Idioma</dt><dd>{t.language}</dd></div>
                <div><dt className="sr-only">Modelo</dt><dd>{t.model}</dd></div>
              </dl>
            </div>
            <div className="flex gap-2">
              <CopyButton text={t.text} />
              <Button
                variant="danger"
                loading={remove.isPending}
                onClick={() => {
                  if (window.confirm('Excluir esta transcrição? Não é possível desfazer.')) remove.mutate();
                }}
              >
                <Trash2 className="size-4" aria-hidden /> Excluir
              </Button>
            </div>
          </div>
          {remove.isError && <Alert>{getErrorMessage(remove.error)}</Alert>}
          <p className="leading-relaxed whitespace-pre-wrap">{t.text || <em className="text-muted">Nenhuma fala reconhecida.</em>}</p>
        </Card>
      )}
    </div>
  );
}
