# Multi-Tenant HyperDX Testing Plan

## Executive Summary

**Document Purpose**: Comprehensive testing strategy for multi-tenant HyperDX implementation  
**Testing Scope**: Data isolation, security, performance, and functional correctness  
**Timeline**: Integrated throughout 8-week implementation cycle  
**Risk Level**: Critical for production deployment  

This testing plan ensures complete validation of multi-tenant functionality with zero data leakage tolerance and enterprise-grade security standards.

## Current Testing Infrastructure Analysis

### Existing Test Framework
- **Backend**: Jest with ts-jest, supertest for API testing
- **Frontend**: Jest with jsdom, React Testing Library
- **Common Utils**: Jest with comprehensive utility function coverage
- **Coverage**: ~30+ test files across packages with good unit test coverage

### Current Test Structure
```
packages/
├── api/src/__tests__/           # 24+ test files
│   ├── controllers/
│   ├── routers/api/
│   ├── tasks/
│   └── utils/
├── app/src/__tests__/           # 16+ test files  
│   ├── components/
│   └── hooks/
└── common-utils/src/__tests__/  # 6+ test files
```

### Test Configuration
- **API**: Node environment, 30s timeout, MongoDB/ClickHouse integration
- **Frontend**: jsdom environment, React component testing
- **Coverage**: Jest coverage reports with inline snapshots

## Multi-Tenant Testing Strategy

### Testing Pyramid Structure

```
                E2E Tests (10%)
              ├─ Multi-tenant workflows
              ├─ Security isolation
              └─ Performance benchmarks
                  
            Integration Tests (30%)
          ├─ API endpoint tenant filtering
          ├─ Database isolation validation
          ├─ OTEL pipeline tenant tagging
          └─ Authentication flow testing
              
        Unit Tests (60%)
      ├─ Tenant middleware validation
      ├─ Query filtering logic
      ├─ SDK functionality
      ├─ Security utilities
      └─ Frontend component isolation
```

## Phase 1: Unit Testing Strategy (Weeks 1-3)

### 1.1 Tenant Middleware Testing
**File**: `packages/api/src/middleware/__tests__/tenant.test.ts`
**Priority**: Critical
**Coverage Target**: 100%

```typescript
describe('Tenant Middleware', () => {
  describe('tenantMiddleware', () => {
    test('should extract tenant from valid JWT', async () => {
      const req = mockRequest({
        headers: { authorization: 'Bearer valid-jwt-token' }
      });
      const res = mockResponse();
      const next = jest.fn();
      
      await tenantMiddleware(req, res, next);
      
      expect(req.tenant).toEqual({ id: 'tenant-123', name: 'Test Tenant' });
      expect(next).toHaveBeenCalled();
    });

    test('should reject request without tenant context', async () => {
      const req = mockRequest({
        headers: { authorization: 'Bearer invalid-token' }
      });
      const res = mockResponse();
      const next = jest.fn();
      
      await tenantMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid tenant context' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle missing authorization header', async () => {
      const req = mockRequest({ headers: {} });
      const res = mockResponse();
      const next = jest.fn();
      
      await tenantMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
```

### 1.2 Query Filtering Testing
**File**: `packages/api/src/utils/__tests__/clickhouse-tenant.test.ts`
**Priority**: Critical
**Coverage Target**: 100%

```typescript
describe('TenantAwareClickHouse', () => {
  let tenantCH: TenantAwareClickHouse;
  
  beforeEach(() => {
    tenantCH = new TenantAwareClickHouse('tenant-123');
  });

  describe('query filtering', () => {
    test('should inject tenant filter into SELECT queries', () => {
      const sql = 'SELECT * FROM logs WHERE level = "ERROR"';
      const filtered = tenantCH.injectTenantFilter(sql);
      
      expect(filtered).toBe(
        'SELECT * FROM logs WHERE tenant_id = {tenant_id:String} AND level = "ERROR"'
      );
    });

    test('should add WHERE clause for queries without conditions', () => {
      const sql = 'SELECT * FROM traces';
      const filtered = tenantCH.injectTenantFilter(sql);
      
      expect(filtered).toBe(
        'SELECT * FROM traces WHERE tenant_id = {tenant_id:String}'
      );
    });

    test('should handle complex nested queries', () => {
      const sql = `
        SELECT t.* FROM (
          SELECT * FROM logs WHERE timestamp > now() - INTERVAL 1 DAY
        ) t WHERE t.service = 'api'
      `;
      
      const filtered = tenantCH.injectTenantFilter(sql);
      
      // Verify both subquery and outer query have tenant filters
      expect(filtered).toContain('tenant_id = {tenant_id:String}');
    });
  });
});
```

### 1.3 SDK Unit Testing  
**File**: `@yourorg/hyperdx-sdk/src/__tests__/index.test.ts`
**Priority**: High
**Coverage Target**: 95%

```typescript
describe('MultiTenantHyperDXSDK', () => {
  let sdk: MultiTenantHyperDXSDK;
  let mockOTELExporter: jest.Mock;

  beforeEach(() => {
    mockOTELExporter = jest.fn();
    sdk = new MultiTenantHyperDXSDK({
      serviceName: 'test-service',
      hyperdxEndpoint: 'http://localhost:4318',
      authServiceEndpoint: 'http://localhost:3000'
    });
  });

  describe('tenant extraction', () => {
    test('should extract tenant from Next.js request', async () => {
      const mockRequest = {
        headers: { authorization: 'Bearer tenant-jwt' }
      };
      
      fetchMock.mockResponseOnce(JSON.stringify({ tenant_id: 'tenant-123' }));
      
      const tenantId = await sdk.extractTenantId(mockRequest);
      
      expect(tenantId).toBe('tenant-123');
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/validate',
        { headers: { Authorization: 'Bearer tenant-jwt' } }
      );
    });

    test('should fallback to default for invalid auth', async () => {
      const mockRequest = { headers: {} };
      
      const tenantId = await sdk.extractTenantId(mockRequest);
      
      expect(tenantId).toBe('default');
    });
  });

  describe('logging', () => {
    test('should create log record with tenant context', async () => {
      const mockRequest = {
        headers: { authorization: 'Bearer valid-token' }
      };
      
      fetchMock.mockResponseOnce(JSON.stringify({ tenant_id: 'tenant-456' }));
      
      await sdk.log('Test message', { level: 'INFO' }, mockRequest);
      
      expect(mockOTELExporter).toHaveBeenCalledWith(
        expect.objectContaining({
          body: 'Test message',
          attributes: expect.objectContaining({
            tenant_id: 'tenant-456',
            level: 'INFO'
          })
        })
      );
    });
  });
});
```

### 1.4 Frontend Tenant Context Testing
**File**: `packages/app/src/contexts/__tests__/TenantContext.test.tsx`
**Priority**: High
**Coverage Target**: 90%

```typescript
describe('TenantContext', () => {
  test('should provide tenant context to children', async () => {
    const mockTenant = { id: 'tenant-123', name: 'Test Tenant' };
    fetchMock.mockResponseOnce(JSON.stringify(mockTenant));
    
    const TestComponent = () => {
      const { tenant, loading } = useTenant();
      if (loading) return <div>Loading...</div>;
      return <div data-testid="tenant-name">{tenant?.name}</div>;
    };
    
    render(
      <TenantProvider>
        <TestComponent />
      </TenantProvider>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByTestId('tenant-name')).toHaveTextContent('Test Tenant');
    });
  });

  test('should handle tenant switching', async () => {
    const initialTenant = { id: 'tenant-123', name: 'Initial Tenant' };
    const newTenant = { id: 'tenant-456', name: 'New Tenant' };
    
    fetchMock
      .mockResponseOnce(JSON.stringify(initialTenant))
      .mockResponseOnce(JSON.stringify(newTenant));
    
    const TestComponent = () => {
      const { tenant, switchTenant } = useTenant();
      return (
        <div>
          <div data-testid="current-tenant">{tenant?.name}</div>
          <button onClick={() => switchTenant('tenant-456')}>
            Switch Tenant
          </button>
        </div>
      );
    };
    
    render(
      <TenantProvider>
        <TestComponent />
      </TenantProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('current-tenant')).toHaveTextContent('Initial Tenant');
    });
    
    fireEvent.click(screen.getByText('Switch Tenant'));
    
    await waitFor(() => {
      expect(screen.getByTestId('current-tenant')).toHaveTextContent('New Tenant');
    });
  });
});
```

## Phase 2: Integration Testing (Weeks 3-6)

### 2.1 API Endpoint Integration Tests
**File**: `packages/api/src/routers/api/__tests__/multi-tenant-integration.test.ts`
**Priority**: Critical
**Coverage Target**: 100% of tenant-aware endpoints

```typescript
describe('Multi-Tenant API Integration', () => {
  const server = getServer();
  let tenant1Agent: SuperTest<Test>;
  let tenant2Agent: SuperTest<Test>;
  
  beforeAll(async () => {
    await server.start();
    
    // Create separate agents for different tenants
    tenant1Agent = await getLoggedInAgent(server, 'tenant-123');
    tenant2Agent = await getLoggedInAgent(server, 'tenant-456');
  });

  afterEach(async () => {
    await server.clearDBs();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('Data Isolation', () => {
    test('tenant should only see their own logs', async () => {
      // Insert logs for both tenants
      await insertTestLogs([
        { tenant_id: 'tenant-123', message: 'Tenant 1 log', level: 'INFO' },
        { tenant_id: 'tenant-456', message: 'Tenant 2 log', level: 'INFO' }
      ]);
      
      // Tenant 1 query
      const tenant1Response = await tenant1Agent
        .get('/api/logs')
        .expect(200);
      
      expect(tenant1Response.body.logs).toHaveLength(1);
      expect(tenant1Response.body.logs[0]).toMatchObject({
        tenant_id: 'tenant-123',
        message: 'Tenant 1 log'
      });
      
      // Tenant 2 query
      const tenant2Response = await tenant2Agent
        .get('/api/logs')
        .expect(200);
      
      expect(tenant2Response.body.logs).toHaveLength(1);
      expect(tenant2Response.body.logs[0]).toMatchObject({
        tenant_id: 'tenant-456',
        message: 'Tenant 2 log'
      });
    });

    test('dashboard queries should be tenant-filtered', async () => {
      // Create dashboards for both tenants
      await createTestDashboard('tenant-123', 'Tenant 1 Dashboard');
      await createTestDashboard('tenant-456', 'Tenant 2 Dashboard');
      
      const tenant1Response = await tenant1Agent
        .get('/api/dashboards')
        .expect(200);
      
      expect(tenant1Response.body.dashboards).toHaveLength(1);
      expect(tenant1Response.body.dashboards[0].name).toBe('Tenant 1 Dashboard');
    });

    test('search endpoint should respect tenant boundaries', async () => {
      await insertTestLogs([
        { tenant_id: 'tenant-123', message: 'error occurred in service A' },
        { tenant_id: 'tenant-456', message: 'error occurred in service B' }
      ]);
      
      const searchResponse = await tenant1Agent
        .post('/api/search')
        .send({ query: 'error occurred' })
        .expect(200);
      
      expect(searchResponse.body.results).toHaveLength(1);
      expect(searchResponse.body.results[0].message).toContain('service A');
    });
  });

  describe('Cross-Tenant Access Prevention', () => {
    test('should prevent access to other tenant dashboards', async () => {
      const tenant2Dashboard = await createTestDashboard('tenant-456', 'Secret Dashboard');
      
      await tenant1Agent
        .get(`/api/dashboards/${tenant2Dashboard._id}`)
        .expect(404); // Should not find resource for different tenant
    });

    test('should prevent modification of other tenant resources', async () => {
      const tenant2Alert = await createTestAlert('tenant-456', 'Alert for Tenant 2');
      
      await tenant1Agent
        .put(`/api/alerts/${tenant2Alert._id}`)
        .send({ name: 'Modified Alert' })
        .expect(404);
    });
  });
});
```

### 2.2 Database Layer Integration Tests
**File**: `packages/api/src/__tests__/database-isolation.test.ts`
**Priority**: Critical
**Coverage Target**: 100%

```typescript
describe('Database Isolation Tests', () => {
  beforeEach(async () => {
    await clearClickHouseData();
    await clearMongoData();
  });

  describe('ClickHouse Data Isolation', () => {
    test('should properly tag incoming logs with tenant_id', async () => {
      const logData = {
        timestamp: Date.now(),
        level: 'INFO',
        message: 'Test log message',
        service: 'api'
      };
      
      // Simulate OTEL ingestion with tenant header
      await ingestLogWithTenant(logData, 'tenant-123');
      
      // Query ClickHouse directly to verify tenant_id was added
      const result = await chClient.query({
        query: 'SELECT * FROM default.logs WHERE message = {message:String}',
        query_params: { message: 'Test log message' }
      });
      
      const logs = await result.json();
      expect(logs.data).toHaveLength(1);
      expect(logs.data[0].tenant_id).toBe('tenant-123');
    });

    test('should prevent cross-tenant data retrieval via direct queries', async () => {
      // Insert data for multiple tenants
      await ingestLogWithTenant({ message: 'Tenant 1 data' }, 'tenant-123');
      await ingestLogWithTenant({ message: 'Tenant 2 data' }, 'tenant-456');
      
      // Query with tenant filter should only return tenant's data
      const tenant1Data = await queryLogsForTenant('tenant-123');
      const tenant2Data = await queryLogsForTenant('tenant-456');
      
      expect(tenant1Data).toHaveLength(1);
      expect(tenant1Data[0].message).toBe('Tenant 1 data');
      
      expect(tenant2Data).toHaveLength(1);
      expect(tenant2Data[0].message).toBe('Tenant 2 data');
    });

    test('should maintain query performance with tenant filtering', async () => {
      // Insert large dataset with mixed tenants
      await insertBulkTestData(10000, ['tenant-123', 'tenant-456', 'tenant-789']);
      
      const startTime = Date.now();
      const results = await queryLogsForTenant('tenant-123');
      const queryTime = Date.now() - startTime;
      
      // Query should complete within acceptable time
      expect(queryTime).toBeLessThan(500); // 500ms threshold
      expect(results.length).toBeGreaterThan(0);
      
      // All results should belong to the correct tenant
      results.forEach(log => {
        expect(log.tenant_id).toBe('tenant-123');
      });
    });
  });

  describe('MongoDB Metadata Isolation', () => {
    test('should isolate team-specific metadata', async () => {
      const team1 = await createTestTeam('tenant-123', 'Team 1');
      const team2 = await createTestTeam('tenant-456', 'Team 2');
      
      const team1Dashboards = await createTestDashboard(team1._id, 'Dashboard 1');
      const team2Dashboards = await createTestDashboard(team2._id, 'Dashboard 2');
      
      // Verify isolation
      const team1Query = await Dashboard.find({ teamId: team1._id });
      const team2Query = await Dashboard.find({ teamId: team2._id });
      
      expect(team1Query).toHaveLength(1);
      expect(team1Query[0].name).toBe('Dashboard 1');
      
      expect(team2Query).toHaveLength(1);
      expect(team2Query[0].name).toBe('Dashboard 2');
    });
  });
});
```

### 2.3 OTEL Pipeline Integration Tests
**File**: `packages/api/src/__tests__/otel-tenant-integration.test.ts`
**Priority**: High
**Coverage Target**: 95%

```typescript
describe('OTEL Tenant Pipeline Integration', () => {
  let otelCollector: OTELCollectorInstance;
  
  beforeAll(async () => {
    otelCollector = await startOTELCollector({
      config: './test/otel-tenant-config.yaml'
    });
  });

  afterAll(async () => {
    await otelCollector.stop();
  });

  test('should tag logs with tenant_id from headers', async () => {
    const logPayload = {
      resourceLogs: [{
        resource: {
          attributes: [{ key: 'service.name', value: { stringValue: 'test-service' }}]
        },
        scopeLogs: [{
          logRecords: [{
            timeUnixNano: Date.now() * 1000000,
            body: { stringValue: 'Test log with tenant header' },
            attributes: [{ key: 'level', value: { stringValue: 'INFO' }}]
          }]
        }]
      }]
    };
    
    // Send to OTEL collector with tenant header
    const response = await fetch('http://localhost:4318/v1/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': 'tenant-123'
      },
      body: JSON.stringify(logPayload)
    });
    
    expect(response.status).toBe(200);
    
    // Verify log was stored with tenant_id
    await wait(1000); // Allow for processing
    
    const storedLogs = await queryLogsFromClickHouse({
      query: "SELECT * FROM default.logs WHERE body LIKE '%Test log with tenant header%'"
    });
    
    expect(storedLogs).toHaveLength(1);
    expect(storedLogs[0].tenant_id).toBe('tenant-123');
  });

  test('should apply fallback tenant for missing headers', async () => {
    const logPayload = createTestLogPayload('Log without tenant header');
    
    const response = await fetch('http://localhost:4318/v1/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logPayload)
    });
    
    expect(response.status).toBe(200);
    
    await wait(1000);
    
    const storedLogs = await queryLogsFromClickHouse({
      query: "SELECT * FROM default.logs WHERE body LIKE '%Log without tenant header%'"
    });
    
    expect(storedLogs).toHaveLength(1);
    expect(storedLogs[0].tenant_id).toBe('default');
  });
});
```

## Phase 3: End-to-End Testing (Weeks 7-8)

### 3.1 Complete User Workflow Tests
**File**: `tests/e2e/multi-tenant-workflows.spec.ts`
**Priority**: High  
**Coverage Target**: Critical user journeys

```typescript
describe('Multi-Tenant E2E Workflows', () => {
  let browser: Browser;
  let tenant1Context: BrowserContext;
  let tenant2Context: BrowserContext;

  beforeAll(async () => {
    browser = await chromium.launch();
    
    // Create isolated browser contexts for each tenant
    tenant1Context = await browser.newContext({
      extraHTTPHeaders: {
        'Authorization': 'Bearer tenant-123-jwt',
        'X-Tenant-ID': 'tenant-123'
      }
    });
    
    tenant2Context = await browser.newContext({
      extraHTTPHeaders: {
        'Authorization': 'Bearer tenant-456-jwt',
        'X-Tenant-ID': 'tenant-456'
      }
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  test('Tenant 1 should only see their own data', async () => {
    // Setup: Insert test data for both tenants
    await seedTestData({
      'tenant-123': [
        { level: 'ERROR', message: 'Tenant 1 error', service: 'api' },
        { level: 'INFO', message: 'Tenant 1 info', service: 'web' }
      ],
      'tenant-456': [
        { level: 'ERROR', message: 'Tenant 2 error', service: 'api' },
        { level: 'INFO', message: 'Tenant 2 info', service: 'web' }
      ]
    });

    const tenant1Page = await tenant1Context.newPage();
    await tenant1Page.goto('http://localhost:8080/search');
    
    // Wait for data to load
    await tenant1Page.waitForSelector('[data-testid="log-results"]');
    
    // Verify only tenant 1 data is visible
    const logEntries = await tenant1Page.locator('[data-testid="log-entry"]').all();
    expect(logEntries).toHaveLength(2);
    
    for (const entry of logEntries) {
      const text = await entry.textContent();
      expect(text).not.toContain('Tenant 2');
      expect(text).toMatch(/Tenant 1 (error|info)/);
    }
  });

  test('Dashboard isolation between tenants', async () => {
    // Create dashboards for both tenants
    await createTestDashboard('tenant-123', 'Production Metrics');
    await createTestDashboard('tenant-456', 'Staging Metrics');
    
    const tenant1Page = await tenant1Context.newPage();
    await tenant1Page.goto('http://localhost:8080/dashboards');
    
    await tenant1Page.waitForSelector('[data-testid="dashboard-list"]');
    
    const dashboards = await tenant1Page.locator('[data-testid="dashboard-item"]').all();
    expect(dashboards).toHaveLength(1);
    
    const dashboardName = await dashboards[0].textContent();
    expect(dashboardName).toContain('Production Metrics');
    expect(dashboardName).not.toContain('Staging Metrics');
  });

  test('Alert management isolation', async () => {
    const tenant1Page = await tenant1Context.newPage();
    const tenant2Page = await tenant2Context.newPage();
    
    // Tenant 1 creates an alert
    await tenant1Page.goto('http://localhost:8080/alerts');
    await tenant1Page.click('[data-testid="create-alert"]');
    
    await tenant1Page.fill('[data-testid="alert-name"]', 'High Error Rate');
    await tenant1Page.fill('[data-testid="alert-query"]', 'level:ERROR');
    await tenant1Page.click('[data-testid="save-alert"]');
    
    // Verify tenant 1 can see their alert
    await tenant1Page.waitForSelector('[data-testid="alert-list"]');
    const tenant1Alerts = await tenant1Page.locator('[data-testid="alert-item"]').all();
    expect(tenant1Alerts).toHaveLength(1);
    
    // Verify tenant 2 cannot see tenant 1's alert
    await tenant2Page.goto('http://localhost:8080/alerts');
    await tenant2Page.waitForSelector('[data-testid="alert-list"]');
    
    const tenant2Alerts = await tenant2Page.locator('[data-testid="alert-item"]').all();
    expect(tenant2Alerts).toHaveLength(0);
  });
});
```

### 3.2 SDK Integration E2E Tests
**File**: `tests/e2e/sdk-integration.spec.ts`
**Priority**: High
**Coverage Target**: SDK functionality in real Next.js app

```typescript
describe('SDK Integration E2E', () => {
  let testApp: TestNextJSApp;

  beforeAll(async () => {
    // Deploy test Next.js app with SDK
    testApp = await deployTestApp({
      sdkConfig: {
        serviceName: 'test-nextjs-app',
        hyperdxEndpoint: 'http://localhost:4318',
        authServiceEndpoint: 'http://localhost:3001'
      }
    });
  });

  afterAll(async () => {
    await testApp.cleanup();
  });

  test('SDK should automatically tag logs with tenant context', async () => {
    // Trigger action in test app that generates logs
    const response = await fetch(`${testApp.url}/api/test-action`, {
      headers: {
        'Authorization': 'Bearer tenant-123-jwt',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ action: 'create_user' })
    });

    expect(response.status).toBe(200);

    // Wait for logs to be ingested
    await wait(2000);

    // Verify logs were tagged with correct tenant_id
    const logs = await queryHyperDXLogs({
      query: 'service_name:"test-nextjs-app" AND action:"create_user"',
      timeRange: { last: '5m' }
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].tenant_id).toBe('tenant-123');
    expect(logs[0].service_name).toBe('test-nextjs-app');
  });

  test('SDK should handle auth service failures gracefully', async () => {
    // Temporarily disable auth service
    await testApp.disableAuthService();

    const response = await fetch(`${testApp.url}/api/test-action`, {
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ action: 'fallback_test' })
    });

    expect(response.status).toBe(200);

    await wait(2000);

    // Verify logs were tagged with fallback tenant
    const logs = await queryHyperDXLogs({
      query: 'action:"fallback_test"',
      timeRange: { last: '5m' }
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].tenant_id).toBe('default');

    await testApp.enableAuthService();
  });
});
```

## Phase 4: Security & Performance Testing

### 4.1 Security Testing Suite
**File**: `tests/security/tenant-isolation.test.ts`
**Priority**: Critical
**Coverage Target**: 100% security scenarios

```typescript
describe('Multi-Tenant Security Tests', () => {
  describe('Data Leakage Prevention', () => {
    test('should prevent SQL injection via tenant_id', async () => {
      const maliciousPayload = {
        headers: {
          'Authorization': `Bearer ${createJWT({ tenant_id: "'; DROP TABLE logs; --" })}`
        }
      };

      const response = await request(app)
        .get('/api/logs')
        .set(maliciousPayload.headers)
        .expect(401); // Should reject malicious token

      // Verify logs table still exists
      const logsExist = await checkClickHouseTable('logs');
      expect(logsExist).toBe(true);
    });

    test('should prevent cross-tenant access via parameter manipulation', async () => {
      const tenant1JWT = createJWT({ tenant_id: 'tenant-123' });
      
      // Try to access tenant-456 dashboard with tenant-123 JWT
      const response = await request(app)
        .get('/api/dashboards')
        .query({ tenant_id: 'tenant-456' }) // Malicious parameter
        .set('Authorization', `Bearer ${tenant1JWT}`)
        .expect(200);

      // Should only return tenant-123 dashboards
      response.body.dashboards.forEach(dashboard => {
        expect(dashboard.tenant_id).toBe('tenant-123');
      });
    });

    test('should sanitize tenant_id in error messages', async () => {
      const maliciousTenantId = '<script>alert("xss")</script>';
      const maliciousJWT = createJWT({ tenant_id: maliciousTenantId });

      const response = await request(app)
        .get('/api/logs')
        .set('Authorization', `Bearer ${maliciousJWT}`)
        .expect(400);

      expect(response.body.error).not.toContain('<script>');
      expect(response.body.error).not.toContain('alert');
    });
  });

  describe('Authentication Security', () => {
    test('should enforce JWT signature validation', async () => {
      const invalidJWT = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.invalid.signature';

      await request(app)
        .get('/api/logs')
        .set('Authorization', `Bearer ${invalidJWT}`)
        .expect(401);
    });

    test('should enforce JWT expiration', async () => {
      const expiredJWT = createJWT(
        { tenant_id: 'tenant-123' },
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      await request(app)
        .get('/api/logs')
        .set('Authorization', `Bearer ${expiredJWT}`)
        .expect(401);
    });

    test('should rate limit requests per tenant', async () => {
      const tenant1JWT = createJWT({ tenant_id: 'tenant-123' });
      const requests = [];

      // Generate 100 concurrent requests
      for (let i = 0; i < 100; i++) {
        requests.push(
          request(app)
            .get('/api/logs')
            .set('Authorization', `Bearer ${tenant1JWT}`)
        );
      }

      const responses = await Promise.allSettled(requests);
      const rateLimitedResponses = responses.filter(
        r => r.status === 'fulfilled' && r.value.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
```

### 4.2 Performance Testing Suite
**File**: `tests/performance/multi-tenant-performance.test.ts`
**Priority**: High
**Coverage Target**: Performance regression detection

```typescript
describe('Multi-Tenant Performance Tests', () => {
  beforeAll(async () => {
    // Insert large dataset for performance testing
    await insertBulkTestData(100000, [
      'tenant-123', 'tenant-456', 'tenant-789', 'tenant-abc', 'tenant-def'
    ]);
  });

  describe('Query Performance', () => {
    test('tenant-filtered queries should meet performance targets', async () => {
      const tenant1JWT = createJWT({ tenant_id: 'tenant-123' });
      
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/logs')
        .query({
          timeRange: 'last-24h',
          limit: 1000
        })
        .set('Authorization', `Bearer ${tenant1JWT}`)
        .expect(200);
      
      const duration = Date.now() - startTime;
      
      // Should complete within 500ms
      expect(duration).toBeLessThan(500);
      expect(response.body.logs).toHaveLength(1000);
      
      // All results should belong to the correct tenant
      response.body.logs.forEach(log => {
        expect(log.tenant_id).toBe('tenant-123');
      });
    });

    test('aggregation queries should scale with tenant filtering', async () => {
      const tenant1JWT = createJWT({ tenant_id: 'tenant-123' });
      
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/logs/aggregate')
        .send({
          groupBy: ['level', 'service'],
          timeRange: 'last-7d',
          filters: { level: ['ERROR', 'WARN'] }
        })
        .set('Authorization', `Bearer ${tenant1JWT}`)
        .expect(200);
      
      const duration = Date.now() - startTime;
      
      // Aggregation should complete within 1 second
      expect(duration).toBeLessThan(1000);
      expect(response.body.aggregations).toBeDefined();
    });

    test('concurrent tenant queries should not impact performance', async () => {
      const tenantJWTs = [
        createJWT({ tenant_id: 'tenant-123' }),
        createJWT({ tenant_id: 'tenant-456' }),
        createJWT({ tenant_id: 'tenant-789' })
      ];

      const promises = tenantJWTs.map(jwt => {
        const startTime = Date.now();
        
        return request(app)
          .get('/api/logs')
          .query({ limit: 500 })
          .set('Authorization', `Bearer ${jwt}`)
          .then(response => ({
            duration: Date.now() - startTime,
            status: response.status,
            count: response.body.logs?.length || 0
          }));
      });

      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.duration).toBeLessThan(750); // Slightly higher threshold for concurrent requests
        expect(result.count).toBe(500);
      });
    });
  });

  describe('Memory Usage', () => {
    test('tenant context should not cause memory leaks', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Generate 1000 requests with different tenant contexts
      for (let i = 0; i < 1000; i++) {
        const tenantJWT = createJWT({ tenant_id: `tenant-${i}` });
        
        await request(app)
          .get('/api/health')
          .set('Authorization', `Bearer ${tenantJWT}`);
      }
      
      // Force garbage collection if possible
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
      
      // Memory increase should be minimal (< 50MB)
      expect(memoryIncrease).toBeLessThan(50);
    });
  });
});
```

## Test Execution Strategy

### Continuous Integration Pipeline
```yaml
# .github/workflows/multi-tenant-tests.yml
name: Multi-Tenant Test Suite

on:
  pull_request:
    paths:
      - 'packages/api/src/**'
      - 'packages/app/src/**' 
      - 'packages/common-utils/src/**'
      - 'tests/**'
      - 'docs/MULTI_TENANT_DESIGN.md'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: yarn install
      
      - name: Run unit tests
        run: |
          yarn workspace @hyperdx/api test --coverage
          yarn workspace @hyperdx/app test --coverage
          yarn workspace @hyperdx/common-utils test --coverage
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      clickhouse:
        image: clickhouse/clickhouse-server:latest
        ports:
          - 8123:8123
          - 9000:9000
      
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: yarn install
      
      - name: Run integration tests
        run: yarn test:integration
        env:
          CLICKHOUSE_HOST: localhost
          MONGO_URI: mongodb://localhost:27017/test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: yarn install
      
      - name: Start HyperDX stack
        run: docker-compose -f docker-compose.test.yml up -d
      
      - name: Wait for services
        run: ./scripts/wait-for-services.sh
      
      - name: Run E2E tests
        run: yarn test:e2e
      
      - name: Cleanup
        run: docker-compose -f docker-compose.test.yml down
```

### Test Coverage Requirements
| Component | Unit Tests | Integration Tests | E2E Tests | Total Coverage |
|-----------|------------|------------------|-----------|----------------|
| Tenant Middleware | 100% | 100% | N/A | 100% |
| Query Filtering | 100% | 100% | 90% | 95% |
| API Endpoints | 90% | 100% | 80% | 90% |
| Frontend Components | 85% | N/A | 90% | 85% |
| SDK | 95% | 90% | 95% | 95% |
| Security Functions | 100% | 100% | 100% | 100% |

### Test Environment Setup
```typescript
// test/setup.ts
export const setupTestEnvironment = async () => {
  // Setup test databases
  await setupClickHouseTestDB();
  await setupMongoTestDB();
  
  // Setup test auth service
  await startTestAuthService();
  
  // Setup OTEL collector
  await startTestOTELCollector();
  
  // Setup test data
  await seedTestTenants();
  await seedTestUsers();
};

export const cleanupTestEnvironment = async () => {
  await clearAllTestData();
  await stopAllTestServices();
};
```

## Testing Tools & Infrastructure

### Required Testing Tools
- **Jest**: Unit and integration testing framework
- **Supertest**: HTTP assertion library for API testing  
- **Playwright**: E2E browser testing
- **Docker**: Test environment containerization
- **TestContainers**: Integration test database management
- **Artillery**: Load testing and performance benchmarking

### Test Data Management
```typescript
// test/fixtures/tenant-data.ts
export const createTestTenants = () => [
  { id: 'tenant-123', name: 'Acme Corp', plan: 'enterprise' },
  { id: 'tenant-456', name: 'Beta Inc', plan: 'professional' },
  { id: 'tenant-789', name: 'Gamma LLC', plan: 'starter' }
];

export const createTestLogs = (tenantId: string, count: number = 100) => {
  return Array.from({ length: count }, (_, i) => ({
    tenant_id: tenantId,
    timestamp: Date.now() - (i * 1000),
    level: ['INFO', 'ERROR', 'WARN'][i % 3],
    message: `Test log ${i} for ${tenantId}`,
    service: ['api', 'web', 'worker'][i % 3]
  }));
};
```

## Success Metrics & Acceptance Criteria

### Testing Metrics
| Metric | Target | Validation Method |
|--------|--------|------------------|
| **Data Isolation** | 100% tenant separation | Security test suite |
| **Performance Impact** | <5% degradation | Performance benchmarks |
| **Test Coverage** | >90% overall | Coverage reports |
| **Security Tests** | 100% pass rate | Security test suite |
| **E2E Test Reliability** | >95% pass rate | CI pipeline metrics |

### Acceptance Criteria
✅ **Zero Data Leakage**: No tenant can access another tenant's data  
✅ **Performance Maintained**: Query performance degradation <5%  
✅ **Authentication Security**: All auth flows properly validated  
✅ **Error Handling**: Graceful failure modes for all edge cases  
✅ **Cross-Browser Support**: E2E tests pass on Chrome, Firefox, Safari  
✅ **Mobile Compatibility**: Responsive design validated on mobile devices  

## Risk Mitigation

### High-Risk Test Scenarios
1. **Data Migration Testing**: Validate schema changes don't corrupt existing data
2. **Performance Regression**: Continuous benchmarking to catch performance issues  
3. **Security Vulnerabilities**: Comprehensive penetration testing
4. **Error Boundary Testing**: Validate system behavior under failure conditions

### Test Environment Risks
- **Resource Constraints**: Use lightweight containers and parallel execution
- **Test Data Privacy**: Synthetic data only, no production data in tests
- **Environment Drift**: Infrastructure as Code for consistent test environments
- **Flaky Tests**: Implement retry mechanisms and proper wait strategies

## Implementation Timeline

### Testing Phase Integration
- **Weeks 1-2**: Unit test implementation alongside development
- **Weeks 3-4**: Integration test development and execution  
- **Weeks 5-6**: E2E test creation and security validation
- **Weeks 7-8**: Performance testing and final validation
- **Ongoing**: Continuous integration and monitoring

## Conclusion

This comprehensive testing plan ensures the multi-tenant HyperDX implementation meets enterprise security, performance, and reliability standards. The layered testing approach provides confidence in data isolation while maintaining system performance and user experience quality.

**Key Success Factors**:
- **Zero tolerance for data leakage** through comprehensive security testing
- **Performance benchmarking** to prevent regression  
- **Automated testing pipeline** for continuous validation
- **Real-world scenario coverage** through E2E testing

The testing strategy integrates seamlessly with the development timeline, providing continuous feedback and validation throughout the implementation process.

---

*Last Updated: December 2024*  
*Document Version: 1.0*  
*Total Test Cases: 150+ across all test types*