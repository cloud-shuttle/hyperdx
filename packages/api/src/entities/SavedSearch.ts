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

@Entity('saved_searches')
@Index(['teamId'])
@Index(['name'])
@Index(['createdAt'])
export class SavedSearch {
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
  source!: 'logs' | 'traces' | 'metrics';

  @Column({ type: 'text' })
  query!: string;

  @Column({ type: 'jsonb', default: {} })
  filters!: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ type: 'boolean', default: true })
  isPublic!: boolean;

  @Column({ type: 'uuid', nullable: true })
  createdById?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
