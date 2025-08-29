# 🏢 HyperDX Multi-Tenant Architecture

## 📋 **Overview**

HyperDX v2 implements a **true multi-tenant architecture** with complete data isolation, tenant-specific configurations, and scalable resource management. This document outlines the design, implementation, and best practices for multi-tenancy.

## 🏗️ **Architecture Design**

### **Tenant Isolation Strategy**
```
┌─────────────────────────────────────────────────────────────┐
│                    HyperDX Multi-Tenant                     │
├─────────────────────────────────────────────────────────────┤
│  Tenant A                    │  Tenant B                    │
│  ┌─────────────────────────┐ │  ┌─────────────────────────┐ │
│  │ Users                   │ │  │ Users                   │ │
│  │ Alerts                  │ │  │ Alerts                  │ │
│  │ Dashboards              │ │  │ Dashboards              │ │
│  │ Configs                 │ │  │ Configs                 │ │
│  └─────────────────────────┘ │  └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Shared Infrastructure                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ PostgreSQL (Row-level security)                         │ │
│  │ ClickHouse (Tenant-specific tables)                     │ │
│  │ OTEL Collector (Tenant routing)                         │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **Data Isolation Levels**

#### **1. Database Level**
- **PostgreSQL**: Row-level security with `teamId` foreign keys
- **ClickHouse**: Tenant-specific table prefixes or schemas
- **Complete Isolation**: No cross-tenant data access

#### **2. Application Level**
- **Tenant Context**: Every request includes tenant information
- **Service Layer**: All operations scoped to tenant
- **Validation**: Cross-tenant access prevention

#### **3. Infrastructure Level**
- **API Keys**: Tenant-specific authentication
- **Rate Limiting**: Per-tenant quotas
- **Resource Limits**: Tenant-specific storage and compute

## 🔧 **Implementation Details**

### **Database Schema**

#### **Team Entity (Tenant)**
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tenant_id VARCHAR(255) UNIQUE NOT NULL,  -- External tenant ID
  tenant_name VARCHAR(255),
  api_key VARCHAR(255) UNIQUE,
  hook_id VARCHAR(255) UNIQUE,
  
  -- Tenant Configuration
  data_retention_days INTEGER DEFAULT 30,
  max_users_per_tenant INTEGER DEFAULT 10,
  allowed_ingestion_rate INTEGER DEFAULT 10000,
  storage_quota_gb INTEGER DEFAULT 10,
  
  -- Feature Flags
  features_enabled JSONB DEFAULT '{}',
  clickstack_settings JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  collector_authentication_enforced BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **User Entity (Tenant-Scoped)**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255),
  name VARCHAR(255),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  avatar VARCHAR(255),
  last_login_at TIMESTAMP,
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **Alert Entity (Tenant-Scoped)**
```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  source VARCHAR(50) DEFAULT 'logs',
  type VARCHAR(50) DEFAULT 'count',
  query JSONB NOT NULL,
  operator VARCHAR(10) DEFAULT 'gt',
  threshold DECIMAL(10,2) NOT NULL,
  window_size_in_minutes INTEGER DEFAULT 5,
  is_enabled BOOLEAN DEFAULT TRUE,
  channels JSONB DEFAULT '[]',
  last_triggered_at TIMESTAMP,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Tenant Context Middleware**

#### **Authentication Flow**
```typescript
// 1. Extract tenant from request
const tenantId = getTenantIdFromRequest(req);

// 2. Validate tenant exists
const team = await teamService.findByTenantId(tenantId);

// 3. Set tenant context
req.tenant = {
  id: team.tenantId,
  name: team.tenantName,
  teamId: team.id,
};
```

#### **Tenant Sources**
- **API Key**: `X-API-Key` header → Team lookup
- **JWT Token**: Tenant ID in token payload
- **Subdomain**: `tenant.hyperdx.io` → Tenant extraction
- **Query Parameter**: `?tenantId=xxx` (development only)

### **Service Layer Architecture**

#### **Multi-Tenant Service**
```typescript
export class MultiTenantService {
  // All operations automatically scoped to tenant
  async getTenantUsers(req: Request) {
    const tenant = getCurrentTenant(req);
    return userService.findByTeamId(tenant.teamId);
  }

  // Tenant access validation
  async validateTenantAccess(req: Request, resourceType: string, resourceId: string) {
    const resource = await this.getResource(resourceType, resourceId);
    if (resource.teamId !== getCurrentTeamId(req)) {
      throw new Error('Access denied: cross-tenant access');
    }
    return resource;
  }
}
```

## 🚀 **Tenant Management**

### **Tenant Creation**
```typescript
// Create new tenant
const team = await teamService.createTeam({
  name: 'Acme Corp',
  tenantId: 'acme-corp-123',
  tenantName: 'Acme Corporation',
  dataRetentionDays: 90,
  maxUsersPerTenant: 50,
  allowedIngestionRate: 50000,
  storageQuotaGB: 100,
});
```

### **Tenant Configuration**
```typescript
// Tenant-specific settings
const config = {
  dataRetentionDays: 90,        // Log retention period
  maxUsersPerTenant: 50,        // User limit
  allowedIngestionRate: 50000,  // Logs per minute
  storageQuotaGB: 100,          // Storage limit
  featuresEnabled: {
    alerting: true,
    dashboards: true,
    sessionReplay: true,
    customFields: true,
  },
  clickstackSettings: {
    sessionReplay: { enabled: true },
    patternRecognition: { enabled: true },
  },
};
```

### **Tenant Isolation Enforcement**

#### **Repository Level**
```typescript
// All queries include tenant filtering
async findByTenantId(tenantId: string): Promise<User[]> {
  return this.repository
    .createQueryBuilder('user')
    .innerJoin('user.team', 'team')
    .where('team.tenantId = :tenantId', { tenantId })
    .getMany();
}
```

#### **Service Level**
```typescript
// Automatic tenant scoping
async createTenantUser(req: Request, userData: UserData) {
  const tenant = getCurrentTenant(req);
  return userService.createUser({
    ...userData,
    teamId: tenant.teamId, // Always set tenant context
  });
}
```

#### **API Level**
```typescript
// Middleware enforces tenant context
app.use('/api', setTenantContext, requireTenantContext, apiRoutes);
```

## 📊 **Tenant Analytics & Monitoring**

### **Tenant Metrics**
```typescript
async getTenantStats(req: Request) {
  const tenant = getCurrentTenant(req);
  const [users, alerts, team] = await Promise.all([
    userService.findByTeamId(tenant.teamId),
    alertService.findByTeamId(tenant.teamId),
    teamService.findById(tenant.teamId),
  ]);

  return {
    tenant: { id: tenant.id, name: tenant.name },
    stats: {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      totalAlerts: alerts.length,
      enabledAlerts: alerts.filter(a => a.isEnabled).length,
      dataRetentionDays: team.dataRetentionDays,
      maxUsersPerTenant: team.maxUsersPerTenant,
      allowedIngestionRate: team.allowedIngestionRate,
      storageQuotaGB: team.storageQuotaGB,
    },
  };
}
```

### **Resource Usage Tracking**
- **User Count**: Active vs total users
- **Storage Usage**: Current vs allocated storage
- **Ingestion Rate**: Current vs allowed rate
- **Alert Activity**: Trigger frequency and patterns

## 🔒 **Security & Compliance**

### **Data Isolation Guarantees**
1. **Database Level**: Foreign key constraints prevent orphaned data
2. **Application Level**: All queries filtered by tenant
3. **API Level**: Middleware enforces tenant context
4. **Audit Trail**: All operations logged with tenant context

### **Access Control**
```typescript
// Tenant access validation
async validateTenantAccess(req: Request, resourceType: string, resourceId: string) {
  const resource = await this.getResource(resourceType, resourceId);
  
  if (resource.teamId !== getCurrentTeamId(req)) {
    logger.warn('Tenant access violation', {
      tenantId: getCurrentTenant(req).id,
      resourceType,
      resourceId,
      resourceTeamId: resource.teamId,
    });
    throw new Error('Access denied: cross-tenant access');
  }
  
  return resource;
}
```

### **Audit Logging**
```typescript
// All operations logged with tenant context
logger.info('User created', {
  tenantId: req.tenant.id,
  userId: user.id,
  email: user.email,
  createdBy: req.user.id,
  timestamp: new Date(),
});
```

## 🚀 **Deployment & Scaling**

### **Database Scaling**
- **PostgreSQL**: Connection pooling per tenant
- **ClickHouse**: Tenant-specific table partitioning
- **Read Replicas**: Tenant-aware routing

### **Application Scaling**
- **Horizontal Scaling**: Stateless application instances
- **Load Balancing**: Tenant-aware routing
- **Caching**: Tenant-scoped cache keys

### **Infrastructure**
- **Kubernetes**: Tenant-specific namespaces (optional)
- **Monitoring**: Per-tenant metrics and alerts
- **Backup**: Tenant-specific backup strategies

## 📈 **Performance Optimization**

### **Query Optimization**
```sql
-- Indexes for tenant queries
CREATE INDEX idx_users_team_id ON users(team_id);
CREATE INDEX idx_alerts_team_id ON alerts(team_id);
CREATE INDEX idx_teams_tenant_id ON teams(tenant_id);

-- Composite indexes for common queries
CREATE INDEX idx_users_team_active ON users(team_id, is_active);
CREATE INDEX idx_alerts_team_enabled ON alerts(team_id, is_enabled);
```

### **Connection Pooling**
```typescript
// Tenant-specific connection pools
const tenantPools = new Map<string, Pool>();

function getTenantPool(tenantId: string): Pool {
  if (!tenantPools.has(tenantId)) {
    tenantPools.set(tenantId, new Pool({
      // Tenant-specific configuration
    }));
  }
  return tenantPools.get(tenantId)!;
}
```

## 🔄 **Migration Strategy**

### **From Single-Tenant to Multi-Tenant**
1. **Database Migration**: Add tenant columns and constraints
2. **Application Update**: Implement tenant context
3. **Data Migration**: Assign existing data to default tenant
4. **Testing**: Validate tenant isolation
5. **Deployment**: Gradual rollout with feature flags

### **Tenant Data Migration**
```typescript
// Migrate existing data to tenant structure
async function migrateToMultiTenant() {
  const defaultTenant = await teamService.createTeam({
    name: 'Default Tenant',
    tenantId: 'default-tenant',
  });

  // Migrate existing users
  const users = await User.find({});
  for (const user of users) {
    await userService.updateUser(user.id, {
      teamId: defaultTenant.id,
    });
  }

  // Migrate existing alerts
  const alerts = await Alert.find({});
  for (const alert of alerts) {
    await alertService.updateAlert(alert.id, {
      teamId: defaultTenant.id,
    });
  }
}
```

## 🎯 **Best Practices**

### **Development**
1. **Always include tenant context** in all operations
2. **Validate tenant access** before resource operations
3. **Use tenant-scoped services** for all business logic
4. **Test cross-tenant isolation** thoroughly

### **Production**
1. **Monitor tenant resource usage** continuously
2. **Implement tenant-specific rate limiting**
3. **Use tenant-aware logging** for debugging
4. **Regular security audits** for tenant isolation

### **Compliance**
1. **Data residency** compliance per tenant
2. **Audit trails** for all tenant operations
3. **Data retention** policies per tenant
4. **Privacy controls** for tenant data

## 📚 **API Examples**

### **Tenant-Aware Endpoints**
```typescript
// Get tenant users
GET /api/tenant/users
Authorization: Bearer <tenant-token>

// Create tenant user
POST /api/tenant/users
Authorization: Bearer <tenant-token>
{
  "email": "user@tenant.com",
  "name": "John Doe",
  "isAdmin": false
}

// Get tenant stats
GET /api/tenant/stats
Authorization: Bearer <tenant-token>
```

### **Tenant Configuration**
```typescript
// Update tenant config
PUT /api/tenant/config
Authorization: Bearer <tenant-token>
{
  "dataRetentionDays": 90,
  "maxUsersPerTenant": 50,
  "allowedIngestionRate": 50000,
  "featuresEnabled": {
    "alerting": true,
    "sessionReplay": true
  }
}
```

---

**This multi-tenant architecture ensures complete data isolation, scalable resource management, and enterprise-grade security for HyperDX v2.**