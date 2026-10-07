import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileAudio, UploadCloud, X } from 'lucide-react';
import { useRef, useState, type DragEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CopyButton } from '../components/ui/CopyButton';
import { getErrorMessage } from '../lib/errors';
import { formatBytes, formatDuration } from '../lib/format';
import { ACCEPTED_AUDIO, MAX_UPLOAD_MB } from '../lib/schemas';
import { createTranscription } from '../services/transcriptions';

const LANGUAGES = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'Inglês' },
  { code: 'es', label: 'Espanhol' },
];

export function TranscribePage() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('pt');
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => createTranscription(file!, language),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transcriptions'] }),
  });

  function pick(next: File | undefined) {
    mutation.reset();
    setLocalError(null);
    if (!next) return;
    if (next.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setLocalError(`Arquivo maior que ${MAX_UPLOAD_MB} MB`);
      return;
    }
    setFile(next);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files[0]);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (file) mutation.mutate();
  }

  const result = mutation.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Transcrever áudio</h1>
        <p className="mt-1 text-muted">Envie um arquivo de até {MAX_UPLOAD_MB} MB. O áudio não é guardado, só o texto.</p>
      </div>

      <Card>
        <form onSubmit={submit} className="space-y-4">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
              dragging ? 'border-accent bg-accent-soft/40' : 'border-line hover:border-accent/60'
            }`}
          >
            <UploadCloud className="size-8 text-accent" aria-hidden />
            <span className="font-medium">Arraste o arquivo aqui ou clique para escolher</span>
            <span className="text-xs text-muted">mp3, m4a, wav, ogg, webm, flac, mp4, mpeg</span>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_AUDIO}
              className="sr-only"
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </label>

          {file && (
            <div className="flex items-center gap-3 rounded-lg bg-accent-soft/40 px-3 py-2 text-sm">
              <FileAudio className="size-4 shrink-0 text-accent-dark" aria-hidden />
              <span className="min-w-0 flex-1 truncate font-medium">{file.name}</span>
              <span className="text-muted">{formatBytes(file.size)}</span>
              <button
                type="button"
                aria-label="Remover arquivo"
                className="text-muted hover:text-ink"
                onClick={() => {
                  setFile(null);
                  mutation.reset();
                  if (inputRef.current) inputRef.current.value = '';
                }}
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {localError && <Alert>{localError}</Alert>}
          {mutation.isError && <Alert>{getErrorMessage(mutation.error)}</Alert>}

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label htmlFor="language" className="block text-sm font-medium">
                Idioma do áudio
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={!file} loading={mutation.isPending} className="ml-auto">
              {mutation.isPending ? 'Transcrevendo…' : 'Transcrever'}
            </Button>
          </div>
        </form>
      </Card>

      {result && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-bold">Transcrição</h2>
              <p className="text-sm text-muted">
                {result.originalFilename} · {formatDuration(result.durationSeconds)}
              </p>
            </div>
            <div className="flex gap-2">
              <CopyButton text={result.text} />
              <Link to={`/app/historico/${result.id}`} className="rounded-lg px-4 py-2 text-sm font-medium text-accent hover:underline">
                Ver no histórico
              </Link>
            </div>
          </div>
          <p className="leading-relaxed whitespace-pre-wrap">{result.text || <em className="text-muted">Nenhuma fala reconhecida.</em>}</p>
        </Card>
      )}
    </div>
  );
}
