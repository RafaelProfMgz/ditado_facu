import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const TIMEOUT_MS = 60_000;

export interface GroqTranscription {
  text: string;
  durationSeconds: number | null;
  model: string;
}

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);

  constructor(private readonly config: ConfigService) {}

  async transcribe(file: Express.Multer.File, language: string): Promise<GroqTranscription> {
    const model = this.config.get<string>('GROQ_MODEL', 'whisper-large-v3-turbo');
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), file.originalname);
    form.append('model', model);
    form.append('language', language);
    form.append('response_format', 'verbose_json');

    let response: Response;
    try {
      response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.config.getOrThrow<string>('GROQ_API_KEY')}` },
        body: form,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      this.logger.error(`Falha ao contatar a Groq: ${(err as Error).message}`);
      throw this.unavailable();
    }

    if (!response.ok) {
      // O detalhe fica no log; o cliente recebe só a mensagem genérica.
      const body = (await response.text()).slice(0, 500);
      this.logger.error(`Groq respondeu ${response.status}: ${body}`);
      throw this.unavailable();
    }

    const data = (await response.json()) as { text?: string; duration?: number };
    return {
      text: (data.text ?? '').trim(),
      durationSeconds: typeof data.duration === 'number' ? data.duration : null,
      model,
    };
  }

  private unavailable() {
    return new BadGatewayException('Serviço de transcrição indisponível, tente novamente');
  }
}
