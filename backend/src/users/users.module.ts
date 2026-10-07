import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminSeedService } from './admin-seed.service.js';
import { User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, AdminSeedService],
  exports: [UsersService],
})
export class UsersModule {}
