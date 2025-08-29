# 🚀 HyperDX v2 Quick Start Guide

## ⚡ **Get Started in 5 Minutes**

This guide will help you get HyperDX v2 with PostgreSQL and ClickStack up and running quickly.

---

## 📋 **Prerequisites**

- **Docker & Docker Compose**: Installed and running
- **Node.js**: Version 22.16.0 or higher
- **pnpm**: Package manager
- **Memory**: At least 2GB available RAM
- **Storage**: 10GB available disk space

---

## 🐳 **Option 1: Docker Compose (Recommended)**

### **Step 1: Start the Infrastructure**
```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd hyperdx

# Start PostgreSQL and ClickHouse
docker-compose -f docker-compose.test.yml up -d
```

### **Step 2: Verify Services**
```bash
# Check container status
docker-compose -f docker-compose.test.yml ps

# Test PostgreSQL
PGPASSWORD=hyperdx psql -h localhost -p 15432 -U hyperdx -d hyperdx -c "SELECT version();"

# Test ClickHouse
curl -s "http://localhost:18123/?query=SELECT%20version()"
```

### **Step 3: Start the API Server**
```bash
cd packages/api

# Install dependencies
pnpm install

# Start with Docker environment
POSTGRES_HOST=localhost POSTGRES_PORT=15432 CLICKHOUSE_HOST=http://localhost:18123 CLICKHOUSE_USER=default CLICKHOUSE_PASSWORD= FRONTEND_URL=http://localhost:3000 HYPERDX_API_KEY=docker-local-key npx tsx src/index.ts
```

### **Step 4: Start the Frontend**
```bash
cd ../app

# Install dependencies
pnpm install

# Start the frontend
pnpm dev
```

### **Step 5: Access the Application**
- **Frontend**: http://localhost:3000
- **API Health**: http://localhost:3001/health
- **ClickStack**: http://localhost:3000/clickstack

---

## 💻 **Option 2: Local Development**

### **Step 1: Install Dependencies**
```bash
# Install all dependencies
pnpm install

# Build common utilities
pnpm --filter @hyperdx/common-utils run build
```

### **Step 2: Set Up Local Databases**
```bash
# Start PostgreSQL (if not using Docker)
brew install postgresql
brew services start postgresql

# Create database
createdb hyperdx

# Start ClickHouse (if not using Docker)
# Follow ClickHouse installation guide for your OS
```

### **Step 3: Configure Environment**
```bash
# Copy environment template
cp docker.env .env.local

# Edit environment variables
nano .env.local
```

### **Step 4: Start Services**
```bash
# Start API server
cd packages/api
pnpm dev

# Start frontend (in new terminal)
cd packages/app
pnpm dev
```

---

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Required for Docker setup
POSTGRES_HOST=localhost
POSTGRES_PORT=15432
CLICKHOUSE_HOST=http://localhost:18123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
FRONTEND_URL=http://localhost:3000
HYPERDX_API_KEY=your-api-key
```

### **Production Configuration**
```bash
# Production settings
POSTGRES_HOST=your-postgres-host
POSTGRES_PORT=5432
CLICKHOUSE_HOST=http://your-clickhouse-host:8123
CLICKHOUSE_USER=your-user
CLICKHOUSE_PASSWORD=your-password
FRONTEND_URL=https://your-domain.com
HYPERDX_API_KEY=your-production-api-key
NODE_ENV=production
```

---

## 🧪 **Testing**

### **Health Checks**
```bash
# API Health
curl http://localhost:3001/health

# PostgreSQL Health
PGPASSWORD=hyperdx psql -h localhost -p 15432 -U hyperdx -d hyperdx -c "SELECT 1;"

# ClickHouse Health
curl "http://localhost:18123/?query=SELECT%201"
```

### **ClickStack Features**
1. **Dashboard**: Navigate to `/clickstack` in the frontend
2. **Session Replay**: Test with sample session data
3. **Analytics**: View real-time metrics
4. **Pattern Recognition**: Check for automatic pattern detection

---

## 📊 **Monitoring**

### **Container Status**
```bash
# Check container health
docker-compose -f docker-compose.test.yml ps

# View logs
docker-compose -f docker-compose.test.yml logs -f
```

### **Performance Metrics**
```bash
# Container resource usage
docker stats --no-stream

# Database performance
PGPASSWORD=hyperdx psql -h localhost -p 15432 -U hyperdx -d hyperdx -c "SELECT COUNT(*) FROM teams;"
```

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Port Already in Use**
```bash
# Check what's using the port
lsof -i :15432
lsof -i :18123

# Stop conflicting services
docker-compose -f docker-compose.test.yml down
```

#### **Database Connection Issues**
```bash
# Check PostgreSQL
PGPASSWORD=hyperdx psql -h localhost -p 15432 -U hyperdx -d hyperdx

# Check ClickHouse
curl "http://localhost:18123/?query=SHOW%20DATABASES"
```

#### **API Server Won't Start**
```bash
# Check environment variables
echo $POSTGRES_HOST
echo $CLICKHOUSE_HOST

# Check logs
tail -f complete-docker-test.log
```

### **Reset Everything**
```bash
# Stop all services
docker-compose -f docker-compose.test.yml down

# Remove volumes
docker volume rm hdx-oss-test_postgres_test hdx-oss-test_ch_data_test

# Restart
docker-compose -f docker-compose.test.yml up -d
```

---

## 📚 **Next Steps**

### **Production Deployment**
1. **Environment Setup**: Configure production environment variables
2. **API Key Generation**: Create production API keys
3. **Data Migration**: Import existing data
4. **Monitoring**: Set up production monitoring
5. **Scaling**: Configure horizontal scaling

### **Advanced Features**
1. **ClickStack Analytics**: Explore advanced analytics features
2. **Session Replay**: Test session replay functionality
3. **Pattern Recognition**: Configure pattern detection
4. **ML Features**: Enable machine learning capabilities
5. **Custom Dashboards**: Create custom analytics dashboards

### **Documentation**
- **API Documentation**: `/docs/CLICKSTACK_API_DOCUMENTATION.md`
- **User Guides**: `/docs/CLICKSTACK_USER_GUIDES.md`
- **Best Practices**: `/docs/CLICKSTACK_BEST_PRACTICES.md`
- **Training Materials**: `/docs/CLICKSTACK_TRAINING_MATERIALS.md`

---

## 🎉 **Success!**

You now have a fully functional HyperDX v2 system with:
- ✅ **PostgreSQL Database**: ACID-compliant metadata storage
- ✅ **ClickHouse Analytics**: High-performance telemetry processing
- ✅ **ClickStack Integration**: Advanced user behavior analytics
- ✅ **Real-time Monitoring**: Live dashboards and alerts
- ✅ **Production Ready**: Scalable and maintainable architecture

**Happy monitoring! 🚀**

---

*Quick Start Guide v1.0*  
*Last Updated: August 24, 2025*
