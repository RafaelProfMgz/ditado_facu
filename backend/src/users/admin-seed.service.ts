import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '../common/enums/role.enum.js';
import { UsersService } from './users.service.js';

/** Cria o admin inicial a partir do .env, se ainda não existir. Não altera um existente. */
@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async onApplicationBootstrap() {
    const email = this.config.get<string>('ADMIN_EMAIL')?.trim();
    const password = this.config.get<string>('ADMIN_PASSWORD') ?? '';
    if (!email || !password) return;
    if (password.length < 8) {
      this.logger.warn('ADMIN_PASSWORD com menos de 8 caracteres; admin inicial não criado');
      return;
    }
    if (await this.usersService.findByEmail(email)) return;
    await this.usersService.create({
      name: this.config.get<string>('ADMIN_NAME') || 'Administrador',
      email,
      password,
      role: Role.Admin,
    });
    this.logger.log(`Admin inicial criado: ${email}`);
  }
}
