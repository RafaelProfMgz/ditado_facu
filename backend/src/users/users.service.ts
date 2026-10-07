import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { ILike, In, Repository } from 'typeorm';
import type { Paginated } from '../common/dto/pagination.dto.js';
import { Role } from '../common/enums/role.enum.js';
import { Transcription } from '../transcriptions/entities/transcription.entity.js';
import type { ListUsersDto } from './dto/list-users.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entities/user.entity.js';
import { toUserResponse, type UserResponse } from './user-response.js';

const BCRYPT_COST = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Transcription) private readonly transcriptions: Repository<Transcription>,
  ) {}

  findById(id: string) {
    return this.users.findOne({ where: { id } });
  }

  findByEmail(email: string) {
    return this.users.findOne({ where: { email: email.toLowerCase() } });
  }

  /** Inclui passwordHash; uso exclusivo da autenticação. */
  findByEmailWithPassword(email: string) {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  async create(data: { name: string; email: string; password: string; role?: Role }) {
    const email = data.email.toLowerCase();
    if (await this.users.existsBy({ email })) {
      throw new ConflictException('E-mail já cadastrado');
    }
    const user = this.users.create({
      name: data.name,
      email,
      passwordHash: await bcrypt.hash(data.password, BCRYPT_COST),
      role: data.role ?? Role.User,
    });
    try {
      return await this.users.save(user);
    } catch (err) {
      // Corrida entre duas requisições com o mesmo e-mail: viola o índice único.
      if ((err as { code?: string }).code === '23505') {
        throw new ConflictException('E-mail já cadastrado');
      }
      throw err;
    }
  }

  verifyPassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }

  async list({
    page,
    limit,
    search,
  }: ListUsersDto): Promise<Paginated<UserResponse & { transcriptionCount: number }>> {
    const where = search
      ? [{ name: ILike(`%${search}%`) }, { email: ILike(`%${search}%`) }]
      : undefined;
    const [rows, total] = await this.users.findAndCount({
      where,
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const counts = rows.length
      ? await this.transcriptions
          .createQueryBuilder('t')
          .select('t.userId', 'userId')
          .addSelect('COUNT(*)::int', 'count')
          .where({ userId: In(rows.map((u) => u.id)) })
          .groupBy('t.userId')
          .getRawMany<{ userId: string; count: number }>()
      : [];
    const countByUser = new Map(counts.map((c) => [c.userId, c.count]));
    return {
      items: rows.map((u) => ({ ...toUserResponse(u), transcriptionCount: countByUser.get(u.id) ?? 0 })),
      total,
      page,
      limit,
    };
  }

  async update(actingUserId: string, id: string, dto: UpdateUserDto) {
    const user = await this.getOrFail(id);
    if (id === actingUserId && (dto.role === Role.User || dto.active === false)) {
      throw new BadRequestException('Você não pode rebaixar nem desativar a própria conta');
    }
    Object.assign(user, dto);
    return toUserResponse(await this.users.save(user));
  }

  async remove(actingUserId: string, id: string) {
    if (id === actingUserId) {
      throw new BadRequestException('Você não pode excluir a própria conta');
    }
    // As transcrições saem junto (FK com ON DELETE CASCADE).
    await this.users.remove(await this.getOrFail(id));
  }

  private async getOrFail(id: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }
}
