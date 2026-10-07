// Espelho do contrato da API (docs/ESPECIFICACAO.md, seção 5.1).

export type Role = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface AdminUser extends User {
  transcriptionCount: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface Transcription {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
  language: string;
  model: string;
  text: string;
  createdAt: string;
}

export type TranscriptionSummary = Omit<Transcription, 'text'> & { preview: string };

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}
