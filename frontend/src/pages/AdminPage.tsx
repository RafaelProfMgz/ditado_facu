import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { getErrorMessage } from '../lib/errors';
import { formatDay } from '../lib/format';
import { deleteUser, listUsers, updateUser } from '../services/users';
import { useAuthStore } from '../store/authStore';
import type { AdminUser, Role } from '../types/api';

export function AdminPage() {
  const me = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  // Espera o usuário parar de digitar antes de buscar.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const query = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => listUsers({ page, search: search || undefined }),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] });
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role?: Role; active?: boolean } }) => updateUser(id, data),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deleteUser, onSuccess: invalidate });

  const error = update.error ?? remove.error;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Usuários</h1>
        {query.data && <p className="mt-1 text-muted">{query.data.total} conta(s)</p>}
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por nome ou e-mail"
          aria-label="Buscar usuários"
          className="w-full rounded-lg border border-line bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {error && <Alert>{getErrorMessage(error)}</Alert>}
      {query.isError && <Alert>{getErrorMessage(query.error)}</Alert>}
      {query.isPending && <Loader2 className="size-6 animate-spin text-accent" aria-label="Carregando" />}

      {query.data && (
        <>
          <div className="relative overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-line text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-3 py-3 font-medium">Usuário</th>
                  <th className="px-3 py-3 font-medium">Papel</th>
                  <th className="px-3 py-3 font-medium">Situação</th>
                  <th className="px-3 py-3 text-right font-medium">Áudios</th>
                  <th className="px-3 py-3 font-medium">Desde</th>
                  <th className="px-3 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {query.data.items.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    isMe={u.id === me?.id}
                    busy={(update.isPending && update.variables?.id === u.id) || (remove.isPending && remove.variables === u.id)}
                    onUpdate={(data) => update.mutate({ id: u.id, data })}
                    onDelete={() => {
                      if (window.confirm(`Excluir a conta de ${u.name} e todas as transcrições dela?`)) remove.mutate(u.id);
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} limit={query.data.limit} total={query.data.total} onChange={setPage} />
        </>
      )}
    </div>
  );
}

function UserRow({
  user,
  isMe,
  busy,
  onUpdate,
  onDelete,
}: {
  user: AdminUser;
  isMe: boolean;
  busy: boolean;
  onUpdate: (data: { role?: Role; active?: boolean }) => void;
  onDelete: () => void;
}) {
  return (
    <tr className={user.active ? '' : 'bg-stone-50 text-muted'}>
      <td className="px-3 py-3">
        <div className="font-medium text-ink">
          {user.name} {isMe && <span className="text-xs font-normal text-muted">(você)</span>}
        </div>
        <div className="text-xs text-muted">{user.email}</div>
      </td>
      <td className="px-3 py-3">
        <select
          aria-label={`Papel de ${user.name}`}
          value={user.role}
          disabled={isMe || busy}
          onChange={(e) => onUpdate({ role: e.target.value as Role })}
          className="rounded-md border border-line bg-white px-2 py-1 disabled:opacity-60"
        >
          <option value="user">Usuário</option>
          <option value="admin">Admin</option>
        </select>
      </td>
      <td className="px-3 py-3">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${user.active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-200 text-stone-600'}`}>
          {user.active ? 'Ativa' : 'Inativa'}
        </span>
      </td>
      <td className="px-3 py-3 text-right tabular-nums">{user.transcriptionCount}</td>
      <td className="px-3 py-3 whitespace-nowrap">{formatDay(user.createdAt)}</td>
      <td className="px-3 py-3">
        <div className="flex justify-end gap-2">
          <Button variant="secondary" className="px-3 py-1" disabled={isMe || busy} onClick={() => onUpdate({ active: !user.active })}>
            {user.active ? 'Desativar' : 'Ativar'}
          </Button>
          <Button variant="danger" className="px-2 py-1" disabled={isMe || busy} onClick={onDelete} aria-label={`Excluir ${user.name}`}>
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </td>
    </tr>
  );
}
