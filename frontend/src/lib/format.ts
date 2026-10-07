const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export const formatDate = (iso: string) => dateFormat.format(new Date(iso));

export function formatDuration(seconds: number | null) {
  if (seconds == null) return '—';
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const dayFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });

export const formatDay = (iso: string) => dayFormat.format(new Date(iso));
