import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Instância única. Caminho relativo: o mesmo código funciona em dev (proxy do Vite) e em produção.
export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 numa requisição autenticada = sessão inválida ou expirada.
    // (O 401 do login, sem token, é só "credenciais inválidas" e fica com a página.)
    const hadToken = Boolean(error.config?.headers?.Authorization);
    if (axios.isAxiosError(error) && error.response?.status === 401 && hadToken) {
      useAuthStore.getState().clear();
      if (window.location.pathname !== '/entrar') {
        window.location.assign('/entrar?expirada=1');
      }
    }
    return Promise.reject(error);
  },
);
