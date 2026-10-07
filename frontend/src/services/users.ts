import type { AdminUser, Paginated, Role, User } from '../types/api';
import { api } from './api';

export async function listUsers(params: { page: number; limit?: number; search?: string }) {
  return (await api.get<Paginated<AdminUser>>('/users', { params })).data;
}

export async function updateUser(id: string, data: { role?: Role; active?: boolean; name?: string }) {
  return (await api.patch<User>(`/users/${id}`, data)).data;
}

export async function deleteUser(id: string) {
  await api.delete(`/users/${id}`);
}
