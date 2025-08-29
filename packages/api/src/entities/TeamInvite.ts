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

@Entity('team_invites')
@Index(['teamId'])
@Index(['email'])
@Index(['token'], { unique: true })
@Index(['createdAt'])
export class TeamInvite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'uuid' })
  teamId!: string;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  team!: Team;

  @Column({ type: 'varchar', length: 255, unique: true })
  token!: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: 'pending' | 'accepted' | 'expired' | 'cancelled';

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  invitedById?: string;

  @Column({ type: 'uuid', nullable: true })
  acceptedById?: string;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
