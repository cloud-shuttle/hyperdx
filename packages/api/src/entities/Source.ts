import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Team } from './Team';

@Entity('sources')
@Index(['teamId'])
@Index(['name'])
@Index(['createdAt'])
export class Source {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid' })
  teamId!: string;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  team!: Team;

  @Column({ type: 'varchar', length: 50, default: 'logs' })
  type!: 'logs' | 'traces' | 'metrics';

  @Column({ type: 'jsonb' })
  config!: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isEnabled!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastIngestionAt?: Date;

  @Column({ type: 'integer', default: 0 })
  ingestionCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
