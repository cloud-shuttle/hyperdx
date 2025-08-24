import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import { MultiTenantHyperDXSDK, SDKConfig } from './index';

export interface NextJSOptions {
  allowedOrigins?: string[];
  tenantCookieName?: string;
  enableAutoTrace?: boolean;
  ignorePaths?: string[];
}

export interface NextJSMiddlewareConfig extends SDKConfig, NextJSOptions {}

/**
 * Next.js Middleware for Multi-tenant HyperDX Integration
 */
export class NextJSHyperDXMiddleware {
  private sdk: MultiTenantHyperDXSDK;
  private options: NextJSOptions;

  constructor(config: NextJSMiddlewareConfig) {
    const { allowedOrigins, tenantCookieName, enableAutoTrace, ignorePaths, ...sdkConfig } = config;
    
    this.sdk = new MultiTenantHyperDXSDK(sdkConfig);
    this.options = {
      allowedOrigins: allowedOrigins || [],
      tenantCookieName: tenantCookieName || 'hyperdx_tenant_id',
      enableAutoTrace: enableAutoTrace ?? true,
      ignorePaths: ignorePaths || ['/api/health', '/_next', '/favicon.ico']
    };
  }

  /**
   * Next.js 13+ App Router Middleware
   */
  async middleware(request: NextRequest): Promise<NextResponse> {
    const { pathname } = request.nextUrl;

    // Skip ignored paths
    if (this.options.ignorePaths?.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    try {
      // Initialize SDK if not ready
      if (!this.sdk.isReady()) {
        await this.sdk.initialize();
      }

      // Extract tenant from request
      const tenantId = await this.extractTenantFromRequest(request);
      
      // Auto-trace if enabled
      if (this.options.enableAutoTrace && tenantId) {
        await this.sdk.trace(`middleware:${pathname}`, async () => {
          // Log the request
          await this.sdk.log(`Middleware processed: ${pathname}`, {
            level: 'INFO',
            attributes: {
              method: request.method,
              pathname,
              user_agent: request.headers.get('user-agent'),
              origin: request.headers.get('origin')
            },
            tenantId
          });
        }, { tenantId });
      }

      // Set tenant in response headers for client-side usage
      const response = NextResponse.next();
      if (tenantId) {
        response.headers.set('x-hyperdx-tenant-id', tenantId);
        response.cookies.set(this.options.tenantCookieName!, tenantId, {
          httpOnly: false, // Allow client-side access
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 // 24 hours
        });
      }

      return response;

    } catch (error) {
      // Log middleware error
      await this.sdk.error(error instanceof Error ? error : new Error(String(error)), {
        attributes: {
          component: 'nextjs-middleware',
          pathname,
          method: request.method
        }
      });

      return NextResponse.next();
    }
  }

  /**
   * API Route wrapper for automatic tenant handling
   */
  withTenant<T = any>(
    handler: (
      req: NextApiRequest, 
      res: NextApiResponse<T>, 
      context: { tenantId: string; sdk: MultiTenantHyperDXSDK }
    ) => Promise<void> | void
  ) {
    return async (req: NextApiRequest, res: NextApiResponse<T>) => {
      try {
        // Initialize SDK if not ready
        if (!this.sdk.isReady()) {
          await this.sdk.initialize();
        }

        // Extract tenant
        const tenantId = await this.sdk.extractTenantId(req);
        
        if (!tenantId) {
          return res.status(403).json({ error: 'Tenant context required' } as any);
        }

        // Trace the API call
        await this.sdk.trace(`api:${req.url}`, async () => {
          await handler(req, res, { tenantId, sdk: this.sdk });
        }, { 
          tenantId,
          attributes: {
            method: req.method,
            url: req.url,
            api_route: true
          }
        });

      } catch (error) {
        await this.sdk.error(error instanceof Error ? error : new Error(String(error)), {
          attributes: {
            component: 'api-wrapper',
            method: req.method,
            url: req.url
          }
        });

        res.status(500).json({ 
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? String(error) : undefined
        } as any);
      }
    };
  }

  /**
   * Server-side props helper for tenant extraction
   */
  async getServerSideProps(
    context: GetServerSidePropsContext,
    handler?: (tenantId: string, sdk: MultiTenantHyperDXSDK) => Promise<any>
  ) {
    try {
      // Initialize SDK if not ready
      if (!this.sdk.isReady()) {
        await this.sdk.initialize();
      }

      // Extract tenant from request
      const tenantId = await this.sdk.extractTenantId(context.req);

      if (!tenantId) {
        return {
          redirect: {
            destination: '/auth/login',
            permanent: false
          }
        };
      }

      // Run custom handler if provided
      let props = {};
      if (handler) {
        props = await handler(tenantId, this.sdk);
      }

      return {
        props: {
          tenantId,
          ...props
        }
      };

    } catch (error) {
      await this.sdk.error(error instanceof Error ? error : new Error(String(error)), {
        attributes: {
          component: 'server-side-props',
          path: context.req.url
        }
      });

      return {
        props: {},
        notFound: true
      };
    }
  }

  /**
   * Extract tenant from Next.js request
   */
  private async extractTenantFromRequest(request: NextRequest): Promise<string | null> {
    // Try authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const tenant = await this.extractTenantFromAuth(authHeader);
      if (tenant) return tenant.id;
    }

    // Try custom tenant header
    const tenantHeader = request.headers.get('x-tenant-id');
    if (tenantHeader) return tenantHeader;

    // Try cookies
    const tenantCookie = request.cookies.get(this.options.tenantCookieName!);
    if (tenantCookie?.value) return tenantCookie.value;

    // Try query parameter
    const tenantQuery = request.nextUrl.searchParams.get('tenant_id');
    if (tenantQuery) return tenantQuery;

    return null;
  }

  /**
   * Extract tenant from auth token (similar to main SDK)
   */
  private async extractTenantFromAuth(authToken: string): Promise<{ id: string; name: string } | null> {
    try {
      if (!authToken.startsWith('Bearer ')) {
        return null;
      }

      const token = authToken.slice(7);
      const parts = token.split('.');
      
      if (parts.length !== 3) {
        return null;
      }

      // Simple JWT payload parsing (for demo - use proper JWT library in production)
      const payload = JSON.parse(atob(parts[1]));
      
      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      // Extract tenant ID
      const tenantId = payload.tenant_id || payload.tenantId;
      if (!tenantId) {
        return null;
      }

      return {
        id: tenantId,
        name: `Tenant ${tenantId}`
      };

    } catch (error) {
      return null;
    }
  }

  /**
   * Get the SDK instance for manual operations
   */
  getSDK(): MultiTenantHyperDXSDK {
    return this.sdk;
  }
}

/**
 * Helper function to create middleware
 */
export function createHyperDXMiddleware(config: NextJSMiddlewareConfig) {
  const middleware = new NextJSHyperDXMiddleware(config);
  return {
    middleware: middleware.middleware.bind(middleware),
    withTenant: middleware.withTenant.bind(middleware),
    getServerSideProps: middleware.getServerSideProps.bind(middleware),
    sdk: middleware.getSDK()
  };
}

/**
 * Hook for App Router Server Components
 */
export async function getHyperDXTenantId(): Promise<string | null> {
  try {
    const cookieStore = cookies();
    const tenantCookie = cookieStore.get('hyperdx_tenant_id');
    return tenantCookie?.value || null;
  } catch {
    return null;
  }
}

// Export types for TypeScript users
export type { NextJSMiddlewareConfig };