import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

@Entity('transcriptions')
export class Transcription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @Column({ length: 255 })
  originalFilename: string;

  @Column({ length: 100 })
  mimeType: string;

  @Column('integer')
  sizeBytes: number;

  @Column({ type: 'float', nullable: true })
  durationSeconds: number | null;

  @Column({ length: 10, default: 'pt' })
  language: string;

  @Column({ length: 100 })
  model: string;

  @Column('text')
  text: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
