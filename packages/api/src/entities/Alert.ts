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
import { SavedSearch } from './SavedSearch';

@Entity('alerts')
@Index(['teamId'])
@Index(['isEnabled'])
@Index(['createdAt'])
export class Alert {
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

  @Column({ type: 'uuid', nullable: true })
  savedSearchId?: string;

  @ManyToOne(() => SavedSearch, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'savedSearchId' })
  savedSearch?: SavedSearch;

  @Column({ type: 'uuid', nullable: true })
  dashboardId?: string;

  @Column({ type: 'varchar', length: 50, default: 'logs' })
  source!: 'logs' | 'traces' | 'metrics';

  @Column({ type: 'varchar', length: 50, default: 'count' })
  type!: 'count' | 'percentile' | 'custom';

  @Column({ type: 'jsonb' })
  query!: Record<string, any>;

  @Column({ type: 'varchar', length: 50, default: 'gt' })
  operator!: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  threshold!: number;

  @Column({ type: 'integer', default: 5 })
  windowSizeInMinutes!: number;

  @Column({ type: 'boolean', default: true })
  isEnabled!: boolean;

  @Column({ type: 'jsonb', default: [] })
  channels!: Array<{
    type: 'webhook' | 'slack' | 'email';
    config: Record<string, any>;
  }>;

  @Column({ type: 'timestamp', nullable: true })
  lastTriggeredAt?: Date;

  @Column({ type: 'integer', default: 0 })
  triggerCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
