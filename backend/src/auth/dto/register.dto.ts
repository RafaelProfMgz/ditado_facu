import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// Sem campo `role`: com whitelist + forbidNonWhitelisted, enviá-lo resulta em 400.
export class RegisterDto {
  @Transform(trim)
  @IsString()
  @Length(2, 100)
  name: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'email inválido' })
  @MaxLength(255)
  email: string;

  @IsString()
  @Length(8, 72, { message: 'password deve ter entre 8 e 72 caracteres' })
  password: string;
}
