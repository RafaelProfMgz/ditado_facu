import type { AuthResponse } from '../types/api';
import { api } from './api';

export async function login(data: { email: string; password: string }) {
  return (await api.post<AuthResponse>('/auth/login', data)).data;
}

export async function register(data: { name: string; email: string; password: string }) {
  return (await api.post<AuthResponse>('/auth/register', data)).data;
}
