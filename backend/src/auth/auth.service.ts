import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '../users/entities/user.entity.js';
import { toUserResponse } from '../users/user-response.js';
import { UsersService } from '../users/users.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    // Mesma resposta para e-mail inexistente, senha errada e conta inativa.
    const valid =
      !!user && user.active && (await this.usersService.verifyPassword(dto.password, user.passwordHash));
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');
    return this.buildAuthResponse(user);
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException();
    return toUserResponse(user);
  }

  private async buildAuthResponse(user: User) {
    const accessToken = await this.jwtService.signAsync({ sub: user.id, role: user.role });
    return { user: toUserResponse(user), accessToken };
  }
}
