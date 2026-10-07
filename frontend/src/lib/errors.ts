import axios from 'axios';
import type { ApiError } from '../types/api';

const BY_STATUS: Record<number, string> = {
  409: 'E-mail já cadastrado',
  413: 'Arquivo maior que 25 MB',
  502: 'Serviço de transcrição indisponível, tente novamente',
};

export function getErrorMessage(error: unknown, fallback = 'Algo deu errado. Tente novamente.') {
  if (!axios.isAxiosError<ApiError>(error)) return fallback;
  if (!error.response) return 'Sem conexão com o servidor.';
  const { status, data } = error.response;
  if (BY_STATUS[status]) return BY_STATUS[status];
  const message = data?.message;
  if (Array.isArray(message)) return message.join('. ');
  return message || fallback;
}
