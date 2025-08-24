# HyperDX Multi-Tenant SDK

A comprehensive SDK for integrating multi-tenant observability with HyperDX, designed specifically for Next.js and React applications with enterprise-grade tenant isolation.

## Features

- **🏢 Multi-tenant Architecture**: Complete tenant isolation with automatic data segregation
- **🔐 Flexible Authentication**: Support for JWT, API keys, and external auth services
- **📊 Full Observability**: Logs, traces, metrics, and errors with tenant context
- **⚛️ Next.js Integration**: First-class support for App Router, API routes, and middleware
- **🎯 React Context**: Easy-to-use React hooks and providers
- **🛡️ Type Safety**: Full TypeScript support with comprehensive type definitions
- **⚡ Performance Optimized**: Efficient batching, caching, and resource management

## Installation

```bash
npm install @hyperdx/multi-tenant-sdk
# or
yarn add @hyperdx/multi-tenant-sdk
```

## Quick Start

### Basic Setup

```typescript
import { MultiTenantHyperDXSDK } from '@hyperdx/multi-tenant-sdk';

const sdk = new MultiTenantHyperDXSDK({
  serviceName: 'my-app',
  hyperdxEndpoint: 'http://localhost:8000',
  authServiceEndpoint: 'http://auth.example.com', // Optional
  environment: 'production',
  enableTracing: true,
  enableLogs: true
});

await sdk.initialize();

// Log with tenant context
await sdk.log('User action performed', {
  tenantId: 'tenant-123',
  level: 'INFO',
  attributes: {
    userId: 'user-456',
    action: 'create_post'
  }
});
```

### Next.js App Router Integration

#### 1. Middleware Setup

```typescript
// middleware.ts
import { createHyperDXMiddleware } from '@hyperdx/multi-tenant-sdk/nextjs';

const { middleware } = createHyperDXMiddleware({
  serviceName: 'my-nextjs-app',
  hyperdxEndpoint: process.env.HYPERDX_ENDPOINT!,
  authServiceEndpoint: process.env.AUTH_SERVICE_ENDPOINT,
  environment: process.env.NODE_ENV
});

export { middleware };

export const config = {
  matcher: ['/((?!api/health|_next/static|_next/image|favicon.ico).*)']
};
```

#### 2. API Routes

```typescript
// app/api/users/route.ts
import { createHyperDXMiddleware } from '@hyperdx/multi-tenant-sdk/nextjs';

const { withTenant } = createHyperDXMiddleware({
  serviceName: 'my-app',
  hyperdxEndpoint: process.env.HYPERDX_ENDPOINT!
});

export const GET = withTenant(async (req, res, { tenantId, sdk }) => {
  await sdk.log('Fetching users', { tenantId });
  
  const users = await getUsersForTenant(tenantId);
  await sdk.metric('users.fetched', users.length, { tenantId });
  
  return res.json({ users });
});
```

#### 3. React Provider Setup

```typescript
// app/layout.tsx
import { HyperDXProvider } from '@hyperdx/multi-tenant-sdk/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <HyperDXProvider 
          config={{
            serviceName: 'my-app',
            hyperdxEndpoint: process.env.NEXT_PUBLIC_HYPERDX_ENDPOINT!,
            environment: process.env.NODE_ENV
          }}
        >
          {children}
        </HyperDXProvider>
      </body>
    </html>
  );
}
```

#### 4. Client Components

```typescript
// components/UserDashboard.tsx
'use client';

import { useHyperDX, useTenant } from '@hyperdx/multi-tenant-sdk/react';

export function UserDashboard() {
  const { log, error } = useHyperDX();
  const { tenantId, tenantInfo, isLoading } = useTenant();
  const [data, setData] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      await log('Fetching dashboard data');
      const response = await fetch('/api/dashboard');
      const result = await response.json();
      setData(result);
    } catch (err) {
      await error(err);
    }
  }, [log, error]);

  if (isLoading) return <div>Loading...</div>;
  if (!tenantId) return <div>No tenant access</div>;

  return (
    <div>
      <h1>Dashboard for {tenantInfo?.name}</h1>
      <button onClick={fetchData}>Refresh Data</button>
      {/* Dashboard content */}
    </div>
  );
}
```

## Configuration

### SDK Configuration Options

```typescript
interface SDKConfig {
  serviceName: string;                    // Your service name
  hyperdxEndpoint: string;               // HyperDX ingestion endpoint
  authServiceEndpoint?: string;          // External auth validation endpoint
  environment?: string;                  // Environment (dev/staging/prod)
  debug?: boolean;                       // Enable debug logging
  enableTracing?: boolean;               // Enable distributed tracing
  enableLogs?: boolean;                  // Enable structured logging
}
```

### Next.js Middleware Options

```typescript
interface NextJSOptions {
  allowedOrigins?: string[];             // CORS allowed origins
  tenantCookieName?: string;            // Tenant cookie name (default: 'hyperdx_tenant_id')
  enableAutoTrace?: boolean;            // Auto-trace all requests
  ignorePaths?: string[];               // Paths to ignore
}
```

## Tenant Extraction

The SDK supports multiple methods for tenant identification:

1. **JWT Token**: Extracts from `tenant_id` claim in JWT
2. **HTTP Headers**: `x-tenant-id` or `authorization` headers
3. **Cookies**: `hyperdx_tenant_id` cookie
4. **Query Parameters**: `tenant_id` query parameter
5. **External Auth Service**: Validates tokens via external service

### Custom Tenant Extraction

```typescript
// Override tenant extraction logic
const customTenantId = await sdk.extractTenantId(request);

// Manual tenant override
await sdk.log('Custom message', {
  tenantId: 'specific-tenant-123',
  level: 'INFO'
});
```

## API Reference

### Core SDK Methods

#### `log(message, options, request?)`
Log structured messages with tenant context.

```typescript
await sdk.log('User performed action', {
  level: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR' | 'FATAL',
  tenantId: 'tenant-123',
  attributes: {
    userId: 'user-456',
    action: 'create_post'
  },
  timestamp: new Date()
});
```

#### `error(error, options, request?)`
Log errors with full context and stack traces.

```typescript
try {
  // Some operation
} catch (err) {
  await sdk.error(err, {
    tenantId: 'tenant-123',
    attributes: {
      operation: 'user_creation',
      userId: 'user-456'
    }
  });
}
```

#### `trace(name, fn, options, request?)`
Create distributed traces with tenant context.

```typescript
const result = await sdk.trace('user-registration', async (span) => {
  span.setAttributes({ 'user.email': 'user@example.com' });
  
  await sdk.trace('validate-user', async () => {
    // Validation logic
  });
  
  await sdk.trace('save-user', async () => {
    // Save logic
  });
  
  return { success: true };
}, {
  tenantId: 'tenant-123',
  attributes: {
    component: 'auth-service'
  }
});
```

#### `metric(name, value, options, request?)`
Record custom metrics with tenant context.

```typescript
// Counter
await sdk.metric('api.requests', 1, {
  tenantId: 'tenant-123',
  attributes: {
    endpoint: '/api/users',
    method: 'GET',
    status: 200
  }
});

// Gauge
await sdk.metric('active.users', 150, {
  tenantId: 'tenant-123'
});
```

### React Hooks

#### `useHyperDX()`
Access the full SDK context.

```typescript
const { 
  tenantId, 
  tenantInfo, 
  isLoading, 
  log, 
  error, 
  trace, 
  metric, 
  sdk 
} = useHyperDX();
```

#### `useTenant()`
Access tenant information only.

```typescript
const { tenantId, tenantInfo, isLoading } = useTenant();
```

#### `useHyperDXLogger()`
Access logging methods only.

```typescript
const { log, error, trace, metric } = useHyperDXLogger();
```

## Advanced Usage

### Custom Authentication Integration

```typescript
const sdk = new MultiTenantHyperDXSDK({
  serviceName: 'my-app',
  hyperdxEndpoint: 'http://localhost:8000',
  authServiceEndpoint: 'http://auth.example.com/validate'
});

// The SDK will automatically validate JWT tokens against your auth service
// POST /validate with Authorization header
// Expected response: { tenant_id: 'tenant-123', user_id: 'user-456' }
```

### Error Boundaries

```typescript
import { HyperDXErrorBoundary } from '@hyperdx/multi-tenant-sdk/react';

function App() {
  return (
    <HyperDXErrorBoundary
      fallback={(error) => <div>Something went wrong: {error.message}</div>}
      onError={(error) => console.log('Error caught by boundary:', error)}
    >
      <MyComponent />
    </HyperDXErrorBoundary>
  );
}
```

### Performance Monitoring

```typescript
// Automatic performance tracking
await sdk.trace('api-call', async (span) => {
  const start = Date.now();
  
  try {
    const result = await fetch('/api/data');
    span.setAttributes({
      'http.status_code': result.status,
      'http.duration': Date.now() - start
    });
    return result;
  } catch (error) {
    span.recordException(error);
    throw error;
  }
});
```

## OTEL Collector Configuration

The SDK works with OpenTelemetry Collector for data ingestion. See `otel-collector-multi-tenant.yaml` for a complete configuration that includes:

- Tenant extraction and validation
- Data enrichment and tagging  
- ClickHouse export configuration
- Performance optimization
- Security and compliance features

## Development

```bash
# Install dependencies
npm install

# Build the SDK
npm run build

# Run tests
npm run test

# Watch mode for development
npm run dev

# Lint code
npm run lint
```

## Testing

The SDK includes comprehensive test coverage:

- Unit tests for core functionality
- Integration tests with mock auth services
- Next.js middleware testing
- React component testing
- Performance and security testing

```bash
npm run test
npm run test:watch
npm run test:coverage
```

## Examples

Check the `examples/` directory for complete implementation examples:

- **nextjs-app-router.ts**: Complete Next.js App Router integration
- **manual-sdk-usage.ts**: Manual SDK usage patterns

## Security

- **Data Isolation**: Complete tenant data separation at the database level
- **Input Validation**: All tenant IDs and user inputs are validated and sanitized
- **SQL Injection Protection**: Parameterized queries and input sanitization
- **Authentication**: Multiple auth methods with token validation
- **HTTPS**: All communications use HTTPS in production
- **Rate Limiting**: Built-in rate limiting and resource protection

## Performance

- **Batching**: Automatic batching of logs, metrics, and traces
- **Caching**: Intelligent caching of tenant information and auth tokens
- **Compression**: Automatic data compression for network efficiency
- **Resource Management**: Memory and CPU usage optimization
- **Connection Pooling**: Efficient database connection management

## Support

- **Documentation**: Comprehensive API documentation and examples
- **TypeScript**: Full type definitions for better developer experience
- **Error Handling**: Detailed error messages and debugging information
- **Monitoring**: Built-in health checks and performance metrics

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

Please ensure all tests pass and follow the existing code style.