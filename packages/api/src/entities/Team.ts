import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './User';

@Entity('teams')
@Index(['tenantId'], { unique: true })
@Index(['name'])
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  tenantId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tenantName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  apiKey?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  hookId?: string;

  @Column({ type: 'boolean', default: false })
  collectorAuthenticationEnforced: boolean;

  // Tenant-specific settings
  @Column({ type: 'integer', default: 30 })
  dataRetentionDays: number;

  @Column({ type: 'integer', default: 10 })
  maxUsersPerTenant: number;

  @Column({ type: 'integer', default: 10000 })
  allowedIngestionRate: number; // logs per minute

  @Column({ type: 'integer', default: 10 })
  storageQuotaGB: number;

  // Feature flags
  @Column({ type: 'jsonb', default: {} })
  featuresEnabled: {
    alerting?: boolean;
    dashboards?: boolean;
    sessionReplay?: boolean;
    customFields?: boolean;
  };

  // ClickHouse settings
  @Column({ type: 'integer', nullable: true })
  metadataMaxRowsToRead?: number;

  @Column({ type: 'integer', nullable: true })
  searchRowLimit?: number;

  @Column({ type: 'boolean', default: false })
  fieldMetadataDisabled: boolean;

  // ClickStack settings
  @Column({ type: 'jsonb', default: {} })
  clickstackSettings: {
    sessionReplay?: {
      enabled?: boolean;
      version?: string;
      settings?: Record<string, any>;
    };
    patternRecognition?: {
      enabled?: boolean;
      version?: string;
      settings?: Record<string, any>;
    };
    eventDeltaAnalysis?: {
      enabled?: boolean;
      version?: string;
      settings?: Record<string, any>;
    };
    metadata?: Record<string, any>;
  };

  // Relationships
  @OneToMany(() => User, user => user.team)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      tenantId: this.tenantId,
      tenantName: this.tenantName,
      apiKey: this.apiKey,
      hookId: this.hookId,
      collectorAuthenticationEnforced: this.collectorAuthenticationEnforced,
      dataRetentionDays: this.dataRetentionDays,
      maxUsersPerTenant: this.maxUsersPerTenant,
      allowedIngestionRate: this.allowedIngestionRate,
      storageQuotaGB: this.storageQuotaGB,
      featuresEnabled: this.featuresEnabled,
      clickstackSettings: this.clickstackSettings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
