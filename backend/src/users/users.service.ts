import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum.js';
import { User } from './entities/user.entity.js';

const BCRYPT_COST = 10;

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

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
}
