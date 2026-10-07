import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Role } from '../../common/enums/role.enum.js';
import type { AuthUser } from '../../common/types/auth-user.js';
import { UsersService } from '../../users/users.service.js';

interface JwtPayload {
  sub: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Recarrega o usuário: conta excluída ou desativada perde o acesso na hora,
  // e o papel vale o do banco, não o gravado no token.
  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.active) throw new UnauthorizedException();
    return { id: user.id, role: user.role };
  }
}
