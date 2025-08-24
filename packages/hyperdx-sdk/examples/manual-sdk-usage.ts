// examples/manual-sdk-usage.ts
// Manual usage examples of the HyperDX Multi-tenant SDK

import { MultiTenantHyperDXSDK } from '@hyperdx/multi-tenant-sdk';

// 1. Basic SDK setup
const sdk = new MultiTenantHyperDXSDK({
  serviceName: 'my-service',
  hyperdxEndpoint: 'http://localhost:8000',
  authServiceEndpoint: 'http://localhost:3001', // Optional external auth
  environment: 'production',
  debug: false,
  enableTracing: true,
  enableLogs: true
});

// 2. Initialize the SDK
async function initializeHyperDX() {
  try {
    await sdk.initialize();
    console.log('HyperDX SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize HyperDX SDK:', error);
  }
}

// 3. Basic logging with tenant context
async function basicLogging() {
  const tenantId = 'tenant-123';
  
  // Simple log
  await sdk.log('User logged in', {
    level: 'INFO',
    tenantId,
    attributes: {
      userId: 'user-456',
      action: 'login',
      ip: '192.168.1.100'
    }
  });

  // Error logging
  try {
    throw new Error('Something went wrong');
  } catch (error) {
    await sdk.error(error, {
      tenantId,
      attributes: {
        component: 'user-service',
        operation: 'login'
      }
    });
  }
}

// 4. Distributed tracing with tenant context
async function distributedTracing() {
  const tenantId = 'tenant-123';

  await sdk.trace('user-registration-flow', async (span) => {
    span.setAttributes({
      'user.email': 'user@example.com',
      'tenant.id': tenantId
    });

    // Simulate user validation
    await sdk.trace('validate-user', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await sdk.log('User validation completed', { tenantId });
    }, { tenantId });

    // Simulate database save
    await sdk.trace('save-user', async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      await sdk.metric('user.created', 1, { tenantId });
    }, { tenantId });

    return { userId: 'user-456', success: true };
  }, { tenantId });
}

// 5. Custom metrics with tenant context
async function customMetrics() {
  const tenantId = 'tenant-123';

  // Counter metric
  await sdk.metric('api.requests', 1, {
    tenantId,
    attributes: {
      endpoint: '/api/users',
      method: 'GET',
      status_code: 200
    }
  });

  // Gauge metric
  await sdk.metric('active.connections', 42, {
    tenantId,
    attributes: {
      service: 'websocket-service'
    }
  });

  // Histogram metric (simulated as gauge)
  await sdk.metric('request.duration', 150, {
    tenantId,
    attributes: {
      endpoint: '/api/users',
      unit: 'milliseconds'
    }
  });
}

// 6. Express.js middleware integration
import express from 'express';

function createExpressApp() {
  const app = express();

  // Custom middleware to extract tenant and add to request
  app.use(async (req: any, res, next) => {
    try {
      const tenantId = await sdk.extractTenantId(req);
      req.tenantId = tenantId;
      req.hyperdxSdk = sdk;
      
      if (tenantId) {
        await sdk.log(`Request received: ${req.method} ${req.path}`, {
          tenantId,
          attributes: {
            method: req.method,
            path: req.path,
            ip: req.ip
          }
        });
      }
      
      next();
    } catch (error) {
      console.error('Tenant extraction failed:', error);
      next();
    }
  });

  // Example API endpoint
  app.get('/api/users', async (req: any, res) => {
    const { tenantId, hyperdxSdk } = req;

    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant context required' });
    }

    await hyperdxSdk.trace('get-users', async () => {
      // Your business logic
      const users = await getUsersForTenant(tenantId);
      
      await hyperdxSdk.metric('users.fetched', users.length, { tenantId });
      
      res.json({ users, tenantId });
    }, { tenantId });
  });

  return app;
}

// 7. Background job processing with tenant context
async function backgroundJobProcessor() {
  const jobs = [
    { id: 'job-1', tenantId: 'tenant-123', type: 'email-notification' },
    { id: 'job-2', tenantId: 'tenant-456', type: 'data-export' },
    { id: 'job-3', tenantId: 'tenant-123', type: 'report-generation' }
  ];

  for (const job of jobs) {
    await sdk.trace(`background-job:${job.type}`, async (span) => {
      span.setAttributes({
        'job.id': job.id,
        'job.type': job.type,
        'tenant.id': job.tenantId
      });

      await sdk.log(`Processing job: ${job.id}`, {
        level: 'INFO',
        tenantId: job.tenantId,
        attributes: {
          jobId: job.id,
          jobType: job.type,
          component: 'job-processor'
        }
      });

      try {
        // Simulate job processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await sdk.metric('job.completed', 1, {
          tenantId: job.tenantId,
          attributes: {
            jobType: job.type,
            status: 'success'
          }
        });

        await sdk.log(`Job completed: ${job.id}`, {
          level: 'INFO',
          tenantId: job.tenantId,
          attributes: {
            jobId: job.id,
            duration: 1000,
            status: 'success'
          }
        });

      } catch (error) {
        await sdk.error(error, {
          tenantId: job.tenantId,
          attributes: {
            jobId: job.id,
            jobType: job.type,
            component: 'job-processor'
          }
        });

        await sdk.metric('job.failed', 1, {
          tenantId: job.tenantId,
          attributes: {
            jobType: job.type,
            error: error.message
          }
        });
      }
    }, { tenantId: job.tenantId });
  }
}

// 8. Graceful shutdown
async function gracefulShutdown() {
  try {
    // Flush any pending data
    await sdk.flush();
    
    // Shutdown the SDK
    await sdk.shutdown();
    
    console.log('HyperDX SDK shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// 9. Main application flow
async function main() {
  await initializeHyperDX();
  
  // Example usage
  await basicLogging();
  await distributedTracing();
  await customMetrics();
  await backgroundJobProcessor();
  
  // In a real app, your server would keep running
  // For this example, we'll shutdown after a delay
  setTimeout(gracefulShutdown, 5000);
}

// Helper function (would be implemented by you)
async function getUsersForTenant(tenantId: string) {
  // Your database query with tenant filtering
  return [
    { id: 'user-1', name: 'John Doe', tenantId },
    { id: 'user-2', name: 'Jane Smith', tenantId }
  ];
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}