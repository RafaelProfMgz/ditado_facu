import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { memoryStorage } from 'multer';
import { audioFileFilter } from './audio-file.js';
import { Transcription } from './entities/transcription.entity.js';
import { GroqService } from './groq.service.js';
import { TranscriptionsController } from './transcriptions.controller.js';
import { TranscriptionsService } from './transcriptions.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transcription]),
    // Áudio fica só em memória durante a requisição; acima do limite, o multer gera 413.
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        storage: memoryStorage(),
        limits: { fileSize: Number(config.get('MAX_UPLOAD_MB', 25)) * 1024 * 1024, files: 1 },
        fileFilter: audioFileFilter,
      }),
    }),
  ],
  controllers: [TranscriptionsController],
  providers: [TranscriptionsService, GroqService],
})
export class TranscriptionsModule {}
