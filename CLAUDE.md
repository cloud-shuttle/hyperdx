# HyperDX - Observability Platform

## Project Overview

**HyperDX** is an observability platform that helps engineers debug production issues by providing unified search and visualization of logs, traces, metrics, and session replays on ClickHouse. Part of ClickStack, it serves as a modern alternative to tools like Kibana, optimized for ClickHouse's columnar database architecture.

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Mantine UI
- **Backend**: Node.js 22+, Express, MongoDB, ClickHouse
- **Infrastructure**: Docker, OpenTelemetry, Nginx
- **Build System**: Nx monorepo, Yarn workspaces

### Monorepo Structure
```
hyperdx/
├── packages/
│   ├── api/              # Backend API service
│   ├── app/              # Frontend Next.js application  
│   ├── common-utils/     # Shared utilities
│   └── go-parser/        # Go-based log parser
├── docker/               # Container configurations
├── smoke-tests/          # Integration test suites
└── docker-compose.*.yml  # Development environments
```

## 🎯 Core Capabilities

### Observability Features
- **Unified Search**: Correlate logs, metrics, traces, and session replays
- **Schema Agnostic**: Works with existing ClickHouse schemas
- **High Performance**: Blazing fast searches optimized for ClickHouse
- **Native Querying**: Intuitive search syntax with optional SQL
- **Real-time Monitoring**: Live tail functionality for logs and traces
- **APM Integration**: Monitor HTTP requests to database queries

### Search & Visualization
- Full-text and property search (`level:err`)
- Native JSON string querying
- Anomaly trend analysis with event deltas
- High cardinality event dashboards
- Custom alerting in few clicks

## 📦 Package Details

### @hyperdx/api (Backend)
- **Express.js** REST API with TypeScript
- **Authentication**: Passport.js with local strategy
- **Database**: MongoDB for metadata, ClickHouse for telemetry
- **Real-time**: WebSocket support for live tailing
- **Alerting**: Cron-based alert checking system
- **OpenTelemetry**: Native OTLP support

**Key Dependencies:**
- `@clickhouse/client` - ClickHouse database connectivity
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `passport` - Authentication middleware
- `winston` - Logging framework
- `@opentelemetry/*` - Observability instrumentation

### @hyperdx/app (Frontend)
- **Next.js 14** with TypeScript and SCSS
- **UI Framework**: Mantine 7.x component library
- **State Management**: Jotai for global state
- **Data Fetching**: TanStack Query for server state
- **Visualization**: Recharts, UPlot for high-performance charting
- **Code Editors**: CodeMirror for SQL/JSON editing

**Key Dependencies:**
- `next` - React framework
- `@mantine/core` - UI component library
- `@tanstack/react-query` - Server state management
- `recharts` - Charting library
- `@clickhouse/client-web` - Browser ClickHouse client

### @hyperdx/common-utils
- Shared TypeScript utilities between frontend and backend
- ClickHouse query builders and formatters
- SQL parsing and validation
- Date/time utilities with timezone support

## 🚀 Development Workflow

### Environment Setup
```bash
# Install dependencies
yarn setup

# Start full development environment
yarn dev

# Start local app mode (without Docker services)
yarn dev:local

# Individual package development
yarn app:dev        # Frontend only
yarn app:dev:local  # Frontend in local mode
```

### Build & Deployment
```bash
# Build all packages
nx run-many -t build

# Lint all packages  
yarn lint

# Run tests
nx run-many -t test
```

### Docker Development
```bash
# Development environment with services
docker compose -f docker-compose.dev.yml up -d
yarn dev:compose  # Manage dev containers

# Production-like environment
docker compose up -d

# All-in-one deployment
docker run -p 8080:8080 -p 4317:4317 -p 4318:4318 \
  docker.hyperdx.io/hyperdx/hyperdx-all-in-one
```

## 🔧 Configuration

### Environment Variables
- `DOTENV_CONFIG_PATH` - Environment file path
- `IS_LOCAL_APP_MODE` - Local development mode flag
- `USAGE_STATS_ENABLED` - Telemetry collection toggle
- `NODE_ENV` - Runtime environment

### Key Ports
- **8080**: Web UI
- **8000**: API server  
- **4317**: OTLP gRPC endpoint
- **4318**: OTLP HTTP endpoint
- **9000**: ClickHouse native protocol

### OpenTelemetry Integration
HyperDX accepts telemetry data via:
- OpenTelemetry Collector (built-in)
- Direct OTLP endpoints
- HyperDX SDKs (Browser, Node.js, Python)
- Standard OTLP-compatible agents

## 🧪 Testing Strategy

### Test Structure
- **Unit Tests**: Jest with ts-jest for TypeScript
- **Integration Tests**: Supertest for API testing  
- **Smoke Tests**: BATS for end-to-end validation
- **Frontend Tests**: React Testing Library + Jest

### Test Commands
```bash
# API tests
cd packages/api && yarn ci:int

# Frontend tests  
cd packages/app && yarn ci:unit

# Smoke tests
cd smoke-tests && bats *.bats
```

## 🔒 Security & Best Practices

### Authentication & Authorization
- Session-based authentication with MongoDB storage
- Passport.js local strategy
- Express rate limiting
- CORS configuration
- Helmet.js security headers

### Data Privacy
- Anonymized usage statistics (opt-out available)
- Secure session management
- Environment-based configuration
- No sensitive data in logs

### Code Quality
- **ESLint**: TypeScript and security rules
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit validation
- **Lint-staged**: Incremental linting

## 📊 Performance Considerations

### ClickHouse Optimization
- Columnar storage for fast aggregations
- Materialized views for pre-computed queries
- Efficient indexing strategies
- Batch insertions for high throughput

### Frontend Performance
- Next.js optimizations (SSG, ISR)
- Code splitting and lazy loading
- Memoization with React.memo
- Virtual scrolling for large datasets
- UPlot for high-performance charting

### Caching Strategy
- Browser caching for static assets
- Query result caching in backend
- Connection pooling for databases
- CDN-ready build output

## 🚨 Monitoring & Alerts

### Built-in Observability
- Self-monitoring with OpenTelemetry
- Structured logging with Winston
- Health check endpoints
- Performance metrics collection

### Alert System
- Cron-based alert evaluation
- Slack webhook integration  
- Email notifications via Handlebars templates
- Custom alert templates

## 🤝 Contributing

### Development Guidelines
- TypeScript strict mode
- Comprehensive test coverage
- Documentation for new features
- Security-first approach

### Code Review Process
1. Feature branch from `main`
2. Implement with tests
3. Run full linting and test suite
4. Submit PR with clear description
5. Address review feedback
6. Merge after approval

### Release Process
- Changesets for version management
- Automated changelog generation
- Docker image building
- Staged deployment strategy

## 📚 Additional Resources

- **Documentation**: [ClickStack Docs](https://clickhouse.com/docs/use-cases/observability/clickstack)
- **Live Demo**: [play.hyperdx.io](https://play.hyperdx.io/search)
- **Community**: [Discord](https://discord.gg/FErRRKU78j)
- **Support**: [GitHub Issues](https://github.com/hyperdxio/hyperdx/issues)

## 📄 License

MIT License - See [LICENSE](/LICENSE) file for details.

---

*This project represents a production-ready observability platform with enterprise-grade performance, security, and scalability features built on modern web technologies and ClickHouse's columnar database architecture.*