import type { Transcription } from './entities/transcription.entity.js';

const PREVIEW_LENGTH = 120;

export function toTranscriptionResponse(t: Transcription) {
  return {
    id: t.id,
    originalFilename: t.originalFilename,
    mimeType: t.mimeType,
    sizeBytes: t.sizeBytes,
    durationSeconds: t.durationSeconds,
    language: t.language,
    model: t.model,
    text: t.text,
    createdAt: t.createdAt,
  };
}

export function toTranscriptionSummary(t: Transcription) {
  const { text, ...rest } = toTranscriptionResponse(t);
  return { ...rest, preview: text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH)}…` : text };
}
