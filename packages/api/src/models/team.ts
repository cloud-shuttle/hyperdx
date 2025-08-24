import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

type ObjectId = mongoose.Types.ObjectId;

export type TeamCHSettings = {
  metadataMaxRowsToRead?: number;
  searchRowLimit?: number;
  fieldMetadataDisabled?: boolean;
};

export type TeamTenantSettings = {
  // Multi-tenant configuration
  tenantId: string; // External tenant ID from auth service
  tenantName?: string;
  
  // Tenant-specific limits and quotas
  dataRetentionDays?: number;
  maxUsersPerTenant?: number;
  allowedIngestionRate?: number; // logs per minute
  storageQuotaGB?: number;
  
  // Feature flags per tenant
  featuresEnabled?: {
    alerting?: boolean;
    dashboards?: boolean;
    sessionReplay?: boolean;
    customFields?: boolean;
  };
  
  // ClickStack settings
  clickstackSettings?: {
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
};

export type ITeam = {
  _id: ObjectId;
  name: string;
  allowedAuthMethods?: 'password'[];
  apiKey: string;
  hookId: string;
  collectorAuthenticationEnforced: boolean;
} & TeamCHSettings & TeamTenantSettings;
export type TeamDocument = mongoose.HydratedDocument<ITeam>;

export default mongoose.model<ITeam>(
  'Team',
  new Schema<ITeam>(
    {
      name: String,
      allowedAuthMethods: [String],
      hookId: {
        type: String,
        default: function genUUID() {
          return uuidv4();
        },
      },
      apiKey: {
        type: String,
        default: function genUUID() {
          return uuidv4();
        },
      },
      collectorAuthenticationEnforced: {
        type: Boolean,
        default: false,
      },
      
      // Multi-tenant fields
      tenantId: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },
      tenantName: String,
      
      // Tenant-specific settings
      dataRetentionDays: {
        type: Number,
        default: 30,
        min: 1,
        max: 365,
      },
      maxUsersPerTenant: {
        type: Number,
        default: 10,
        min: 1,
      },
      allowedIngestionRate: {
        type: Number,
        default: 10000, // logs per minute
        min: 100,
      },
      storageQuotaGB: {
        type: Number,
        default: 10,
        min: 1,
      },
      
      // Feature flags
      featuresEnabled: {
        alerting: { type: Boolean, default: true },
        dashboards: { type: Boolean, default: true },
        sessionReplay: { type: Boolean, default: true },
        customFields: { type: Boolean, default: false },
      },
      
      // ClickHouse client settings
      metadataMaxRowsToRead: Number,
      searchRowLimit: Number,
      fieldMetadataDisabled: Boolean,
      
      // ClickStack settings
      clickstackSettings: {
        sessionReplay: {
          enabled: { type: Boolean, default: true },
          version: { type: String, default: '1.0' },
          settings: { type: Schema.Types.Mixed, default: {} },
        },
        patternRecognition: {
          enabled: { type: Boolean, default: true },
          version: { type: String, default: '1.0' },
          settings: { type: Schema.Types.Mixed, default: {} },
        },
        eventDeltaAnalysis: {
          enabled: { type: Boolean, default: true },
          version: { type: String, default: '1.0' },
          settings: { type: Schema.Types.Mixed, default: {} },
        },
        metadata: { type: Schema.Types.Mixed, default: {} },
      },
    },
    {
      timestamps: true,
    },
  ),
);
