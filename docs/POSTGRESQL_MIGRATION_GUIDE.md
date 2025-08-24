# PostgreSQL Migration Guide

## 🐘 **Overview**

This guide covers the migration from MongoDB to PostgreSQL for HyperDX v2 metadata storage. The migration maintains backward compatibility while providing better performance, ACID compliance, and relational database benefits.

## 🏗️ **Architecture Changes**

### **Before (MongoDB + ClickHouse)**
```
┌─────────────────┐    ┌─────────────────┐
│   MongoDB       │    │   ClickHouse    │
│   (Metadata)    │    │   (Telemetry)   │
│                 │    │                 │
│ • Users         │    │ • Logs          │
│ • Teams         │    │ • Traces        │
│ • Alerts        │    │ • Metrics       │
│ • Dashboards    │    │ • ClickStack    │
│ • Configs       │    │                 │
└─────────────────┘    └─────────────────┘
```

### **After (PostgreSQL + ClickHouse)**
```
┌─────────────────┐    ┌─────────────────┐
│  PostgreSQL     │    │   ClickHouse    │
│  (Metadata)     │    │   (Telemetry)   │
│                 │    │                 │
│ • Users         │    │ • Logs          │
│ • Teams         │    │ • Traces        │
│ • Alerts        │    │ • Metrics       │
│ • Dashboards    │    │ • ClickStack    │
│ • Configs       │    │                 │
└─────────────────┘    └─────────────────┘
```

## 🚀 **Benefits of PostgreSQL Migration**

### **Performance Improvements**
- ✅ **ACID Compliance**: Reliable transactions
- ✅ **Better Indexing**: Advanced indexing strategies
- ✅ **Query Optimization**: Sophisticated query planner
- ✅ **Connection Pooling**: Efficient connection management

### **Developer Experience**
- ✅ **SQL Standard**: Familiar query language
- ✅ **Rich Ecosystem**: Extensive tooling and libraries
- ✅ **Better Monitoring**: Advanced performance monitoring
- ✅ **Schema Validation**: Strong type checking

### **Operational Benefits**
- ✅ **Backup & Recovery**: Robust backup solutions
- ✅ **Replication**: Built-in replication support
- ✅ **Scaling**: Horizontal and vertical scaling options
- ✅ **Security**: Advanced security features

## 📋 **Migration Steps**

### **Step 1: Prerequisites**

1. **Install PostgreSQL Dependencies**
   ```bash
   cd packages/api
   pnpm add pg @types/pg typeorm reflect-metadata
   ```

2. **Set Environment Variables**
   ```bash
   # PostgreSQL Configuration
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_USER=hyperdx
   POSTGRES_PASSWORD=hyperdx
   POSTGRES_DATABASE=hyperdx
   POSTGRES_SSL=false
   
   # Optional: Direct connection string
   POSTGRES_URI=postgresql://hyperdx:hyperdx@localhost:5432/hyperdx
   ```

### **Step 2: Start PostgreSQL**

1. **Using Docker Compose**
   ```bash
   docker-compose -f docker-compose.dev.yml up postgres -d
   ```

2. **Using Local PostgreSQL**
   ```bash
   # Install PostgreSQL locally
   brew install postgresql  # macOS
   sudo apt-get install postgresql  # Ubuntu
   
   # Start PostgreSQL service
   brew services start postgresql  # macOS
   sudo systemctl start postgresql  # Ubuntu
   
   # Create database and user
   createdb hyperdx
   createuser hyperdx
   psql -d hyperdx -c "ALTER USER hyperdx WITH PASSWORD 'hyperdx';"
   ```

### **Step 3: Run Migration**

1. **Execute Migration Script**
   ```bash
   cd packages/api
   pnpm run migrate:mongo-to-postgres
   ```

2. **Verify Migration**
   ```bash
   # Check PostgreSQL tables
   psql -d hyperdx -c "\dt"
   
   # Check data counts
   psql -d hyperdx -c "SELECT 'teams' as table_name, COUNT(*) FROM teams UNION ALL SELECT 'users', COUNT(*) FROM users;"
   ```

### **Step 4: Update Application**

1. **Start Application with PostgreSQL**
   ```bash
   # The application will automatically use PostgreSQL
   pnpm run dev
   ```

2. **Verify Functionality**
   - Check health endpoint: `http://localhost:3001/health`
   - Test user authentication
   - Verify ClickStack features

## 🔧 **Configuration**

### **Environment Variables**

```bash
# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=hyperdx
POSTGRES_PASSWORD=hyperdx
POSTGRES_DATABASE=hyperdx
POSTGRES_SSL=false

# Optional: Direct connection string
POSTGRES_URI=postgresql://hyperdx:hyperdx@localhost:5432/hyperdx

# Keep MongoDB for backward compatibility (optional)
MONGO_URI=mongodb://localhost:27017/hyperdx
```

### **Docker Compose Configuration**

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: hyperdx
      POSTGRES_USER: hyperdx
      POSTGRES_PASSWORD: hyperdx
    volumes:
      - .volumes/postgres_dev:/var/lib/postgresql/data
    ports:
      - 5432:5432
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hyperdx -d hyperdx"]
      interval: 5s
      timeout: 5s
      retries: 5
```

## 📊 **Database Schema**

### **Core Tables**

#### **Users Table**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255),
  name VARCHAR(255),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  avatar VARCHAR(255),
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **Teams Table**
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  tenant_id VARCHAR(255) NOT NULL UNIQUE,
  tenant_name VARCHAR(255),
  api_key VARCHAR(255),
  hook_id VARCHAR(255),
  collector_authentication_enforced BOOLEAN DEFAULT FALSE,
  data_retention_days INTEGER DEFAULT 30,
  max_users_per_tenant INTEGER DEFAULT 10,
  allowed_ingestion_rate INTEGER DEFAULT 10000,
  storage_quota_gb INTEGER DEFAULT 10,
  features_enabled JSONB DEFAULT '{}',
  clickstack_settings JSONB DEFAULT '{}',
  metadata_max_rows_to_read INTEGER,
  search_row_limit INTEGER,
  field_metadata_disabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **Alerts Table**
```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  saved_search_id UUID REFERENCES saved_searches(id) ON DELETE SET NULL,
  source VARCHAR(50) DEFAULT 'logs',
  type VARCHAR(50) DEFAULT 'count',
  query JSONB NOT NULL,
  operator VARCHAR(50) DEFAULT 'gt',
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

## 🔄 **Backward Compatibility**

### **Dual Database Support**

The migration maintains backward compatibility by:

1. **Gradual Migration**: MongoDB remains available during transition
2. **Data Synchronization**: Both databases can run simultaneously
3. **Feature Flags**: Easy switching between databases
4. **Rollback Support**: Quick rollback to MongoDB if needed

### **Migration Strategy**

```typescript
// Application can use either database
if (config.USE_POSTGRES) {
  // Use PostgreSQL
  const user = await UserRepository.findOne({ where: { email } });
} else {
  // Use MongoDB (fallback)
  const user = await User.findOne({ email });
}
```

## 🧪 **Testing**

### **Migration Testing**

1. **Data Integrity Tests**
   ```bash
   # Compare record counts
   pnpm run test:migration-integrity
   ```

2. **Functionality Tests**
   ```bash
   # Test with PostgreSQL
   POSTGRES_ENABLED=true pnpm run test
   
   # Test with MongoDB
   POSTGRES_ENABLED=false pnpm run test
   ```

3. **Performance Tests**
   ```bash
   # Benchmark queries
   pnpm run test:performance
   ```

### **Rollback Testing**

1. **Test Rollback Procedure**
   ```bash
   # Simulate rollback
   pnpm run test:rollback
   ```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Connection Issues**
```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432 -U hyperdx

# Check logs
docker logs hyperdx-postgres-1
```

#### **Migration Errors**
```bash
# Check migration logs
tail -f logs/migration.log

# Reset migration
pnpm run migrate:reset
```

#### **Performance Issues**
```bash
# Check PostgreSQL performance
psql -d hyperdx -c "SELECT * FROM pg_stat_activity;"
psql -d hyperdx -c "SELECT * FROM pg_stat_user_tables;"
```

### **Support**

- **Documentation**: [PostgreSQL Docs](https://www.postgresql.org/docs/)
- **TypeORM Docs**: [TypeORM Documentation](https://typeorm.io/)
- **Community**: [HyperDX Discord](https://hyperdx.io/discord)

## 📈 **Performance Monitoring**

### **Key Metrics**

1. **Query Performance**
   ```sql
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC 
   LIMIT 10;
   ```

2. **Connection Usage**
   ```sql
   SELECT state, COUNT(*) 
   FROM pg_stat_activity 
   GROUP BY state;
   ```

3. **Table Performance**
   ```sql
   SELECT schemaname, tablename, 
          seq_scan, seq_tup_read, 
          idx_scan, idx_tup_fetch
   FROM pg_stat_user_tables;
   ```

## 🔮 **Future Enhancements**

### **Planned Improvements**

1. **Advanced Indexing**: Implement composite indexes for better performance
2. **Partitioning**: Add table partitioning for large datasets
3. **Replication**: Set up read replicas for scaling
4. **Backup Strategy**: Implement automated backup and recovery
5. **Monitoring**: Add comprehensive PostgreSQL monitoring

### **Migration Timeline**

- ✅ **Phase 1**: PostgreSQL setup and entity creation
- ✅ **Phase 2**: Migration script development
- 🔄 **Phase 3**: Testing and validation
- ⏳ **Phase 4**: Production deployment
- ⏳ **Phase 5**: MongoDB deprecation

## 📚 **Additional Resources**

- [PostgreSQL Best Practices](https://www.postgresql.org/docs/current/best-practices.html)
- [TypeORM Migration Guide](https://typeorm.io/migrations)
- [Database Performance Tuning](https://www.postgresql.org/docs/current/performance.html)
- [HyperDX Architecture](https://hyperdx.io/docs/architecture)
