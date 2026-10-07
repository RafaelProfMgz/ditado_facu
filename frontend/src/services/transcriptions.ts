import type { Paginated, Transcription, TranscriptionSummary } from '../types/api';
import { api } from './api';

export async function createTranscription(file: File, language: string) {
  const form = new FormData();
  form.append('file', file);
  form.append('language', language);
  return (await api.post<Transcription>('/transcriptions', form)).data;
}

export async function listTranscriptions(page: number, limit = 10) {
  return (
    await api.get<Paginated<TranscriptionSummary>>('/transcriptions', { params: { page, limit } })
  ).data;
}

export async function getTranscription(id: string) {
  return (await api.get<Transcription>(`/transcriptions/${id}`)).data;
}

export async function deleteTranscription(id: string) {
  await api.delete(`/transcriptions/${id}`);
}
