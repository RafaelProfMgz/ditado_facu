import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Paginated, PaginationDto } from '../common/dto/pagination.dto.js';
import { Transcription } from './entities/transcription.entity.js';
import { GroqService } from './groq.service.js';
import { toTranscriptionResponse, toTranscriptionSummary } from './transcription-response.js';

@Injectable()
export class TranscriptionsService {
  constructor(
    @InjectRepository(Transcription) private readonly transcriptions: Repository<Transcription>,
    private readonly groq: GroqService,
  ) {}

  async create(userId: string, file: Express.Multer.File, language = 'pt') {
    // Se a Groq falhar, a exceção sobe antes do save: nada é gravado.
    const result = await this.groq.transcribe(file, language);
    const saved = await this.transcriptions.save(
      this.transcriptions.create({
        userId,
        originalFilename: file.originalname.slice(0, 255),
        mimeType: file.mimetype.slice(0, 100),
        sizeBytes: file.size,
        durationSeconds: result.durationSeconds,
        language,
        model: result.model,
        text: result.text,
      }),
    );
    return toTranscriptionResponse(saved);
  }

  async findAllForUser(
    userId: string,
    { page, limit }: PaginationDto,
  ): Promise<Paginated<ReturnType<typeof toTranscriptionSummary>>> {
    const [rows, total] = await this.transcriptions.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items: rows.map(toTranscriptionSummary), total, page, limit };
  }

  async findOneForUser(userId: string, id: string) {
    return toTranscriptionResponse(await this.getOwned(userId, id));
  }

  async removeForUser(userId: string, id: string) {
    await this.transcriptions.remove(await this.getOwned(userId, id));
  }

  // Filtra sempre por dono. De outro usuário → 404, sem revelar que existe.
  private async getOwned(userId: string, id: string) {
    const t = await this.transcriptions.findOne({ where: { id, userId } });
    if (!t) throw new NotFoundException('Transcrição não encontrada');
    return t;
  }
}
