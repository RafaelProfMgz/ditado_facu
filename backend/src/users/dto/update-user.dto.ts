import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { Role } from '../../common/enums/role.enum.js';

export class UpdateUserDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsEnum(Role, { message: 'role deve ser user ou admin' })
  role?: Role;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
