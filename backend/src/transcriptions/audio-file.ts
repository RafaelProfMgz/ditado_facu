import { BadRequestException } from '@nestjs/common';
import { extname } from 'node:path';

const ALLOWED_EXTENSIONS = new Set(['.mp3', '.m4a', '.wav', '.ogg', '.webm', '.flac', '.mp4', '.mpeg', '.mpga']);
// O mimetype vem do cliente (o curl, por exemplo, manda octet-stream): serve só de primeiro filtro.
const ALLOWED_OTHER_MIMES = new Set([
  'video/mp4',
  'video/webm',
  'video/mpeg',
  'application/ogg',
  'application/octet-stream',
]);
const UNSUPPORTED = 'Formato não suportado. Envie mp3, m4a, wav, ogg, webm, flac, mp4 ou mpeg.';

/** fileFilter do multer: extensão de áudio e mimetype compatível. */
export function audioFileFilter(
  _req: unknown,
  file: Express.Multer.File,
  callback: (error: Error | null, accept: boolean) => void,
) {
  const ext = extname(file.originalname).toLowerCase();
  const mimeOk = file.mimetype.startsWith('audio/') || ALLOWED_OTHER_MIMES.has(file.mimetype);
  if (!ALLOWED_EXTENSIONS.has(ext) || !mimeOk) {
    return callback(new BadRequestException(UNSUPPORTED), false);
  }
  callback(null, true);
}

/** Confere a assinatura binária (magic bytes): o conteúdo precisa ser de fato um contêiner de áudio. */
export function assertAudioContent(buffer: Buffer) {
  const ascii = (start: number, end: number) => buffer.subarray(start, end).toString('latin1');
  const isAudio =
    ascii(0, 3) === 'ID3' || // mp3 com tag ID3
    (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) || // quadro MPEG de áudio
    (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE') ||
    ascii(0, 4) === 'OggS' ||
    ascii(0, 4) === 'fLaC' ||
    ascii(4, 8) === 'ftyp' || // mp4 / m4a
    buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) || // webm / matroska
    (buffer[0] === 0 && buffer[1] === 0 && buffer[2] === 1 && (buffer[3] === 0xba || buffer[3] === 0xb3)); // mpeg
  if (!isAudio) throw new BadRequestException(UNSUPPORTED);
}
