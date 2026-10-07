import { IsOptional, Matches } from 'class-validator';

// O arquivo chega pelo multer (campo `file`); aqui só os demais campos do formulário.
export class CreateTranscriptionDto {
  @IsOptional()
  @Matches(/^[a-z]{2}$/, { message: 'language deve ser um código ISO 639-1, como pt' })
  language?: string;
}
