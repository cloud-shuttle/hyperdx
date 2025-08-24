'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { MultiTenantHyperDXSDK, SDKConfig, LogOptions, TraceOptions, MetricOptions } from './index';

export interface TenantInfo {
  id: string;
  name: string;
  features?: {
    alerting?: boolean;
    dashboards?: boolean;
    sessionReplay?: boolean;
    customFields?: boolean;
  };
}

export interface HyperDXContextValue {
  // Tenant information
  tenantId: string | null;
  tenantInfo: TenantInfo | null;
  isLoading: boolean;
  
  // SDK methods
  log: (message: string, options?: LogOptions) => Promise<void>;
  error: (error: Error | string, options?: LogOptions) => Promise<void>;
  trace: <T>(name: string, fn: (span: any) => Promise<T> | T, options?: TraceOptions) => Promise<T>;
  metric: (name: string, value: number, options?: MetricOptions) => Promise<void>;
  
  // Tenant management
  setTenantId: (tenantId: string | null) => void;
  refreshTenant: () => Promise<void>;
  
  // SDK instance for advanced usage
  sdk: MultiTenantHyperDXSDK | null;
}

const HyperDXContext = createContext<HyperDXContextValue>({
  tenantId: null,
  tenantInfo: null,
  isLoading: true,
  log: async () => {},
  error: async () => {},
  trace: async (name, fn) => fn(null),
  metric: async () => {},
  setTenantId: () => {},
  refreshTenant: async () => {},
  sdk: null
});

export interface HyperDXProviderProps {
  children: ReactNode;
  config: SDKConfig;
  initialTenantId?: string;
  onTenantChange?: (tenantId: string | null) => void;
  enableAutoInit?: boolean;
}

/**
 * React Context Provider for Multi-tenant HyperDX SDK
 */
export function HyperDXProvider({ 
  children, 
  config, 
  initialTenantId,
  onTenantChange,
  enableAutoInit = true 
}: HyperDXProviderProps) {
  const [sdk, setSdk] = useState<MultiTenantHyperDXSDK | null>(null);
  const [tenantId, setTenantIdState] = useState<string | null>(initialTenantId || null);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize SDK
  useEffect(() => {
    const initSDK = async () => {
      try {
        const newSdk = new MultiTenantHyperDXSDK(config);
        if (enableAutoInit) {
          await newSdk.initialize();
        }
        setSdk(newSdk);
        setIsLoading(false);
      } catch (error) {
        console.error('[HyperDX Provider] Failed to initialize SDK:', error);
        setIsLoading(false);
      }
    };

    initSDK();
  }, [config, enableAutoInit]);

  // Auto-detect tenant from cookies/headers on client side
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detectTenant = () => {
      // Try cookie first
      const cookies = document.cookie.split(';');
      const tenantCookie = cookies.find(cookie => 
        cookie.trim().startsWith('hyperdx_tenant_id=')
      );
      
      if (tenantCookie) {
        const cookieTenantId = tenantCookie.split('=')[1];
        if (cookieTenantId && cookieTenantId !== tenantId) {
          setTenantIdState(cookieTenantId);
          return;
        }
      }

      // Try session storage
      const sessionTenantId = sessionStorage.getItem('hyperdx_tenant_id');
      if (sessionTenantId && sessionTenantId !== tenantId) {
        setTenantIdState(sessionTenantId);
        return;
      }
    };

    if (!initialTenantId) {
      detectTenant();
    }
  }, [initialTenantId, tenantId]);

  // Fetch tenant info when tenant ID changes
  useEffect(() => {
    if (!tenantId || !sdk) return;

    const fetchTenantInfo = async () => {
      try {
        // This would typically call an API to get tenant details
        // For now, we'll create basic tenant info
        const info: TenantInfo = {
          id: tenantId,
          name: `Tenant ${tenantId}`,
          features: {
            alerting: true,
            dashboards: true,
            sessionReplay: true,
            customFields: true
          }
        };
        
        setTenantInfo(info);
        
        // Log tenant context change
        await sdk.log('Tenant context initialized', {
          level: 'INFO',
          tenantId,
          attributes: {
            component: 'react-provider',
            tenant_name: info.name
          }
        });

      } catch (error) {
        console.error('[HyperDX Provider] Failed to fetch tenant info:', error);
        if (sdk) {
          await sdk.error(error instanceof Error ? error : new Error(String(error)), {
            tenantId,
            attributes: {
              component: 'react-provider',
              action: 'fetch_tenant_info'
            }
          });
        }
      }
    };

    fetchTenantInfo();
  }, [tenantId, sdk]);

  // Notify parent of tenant changes
  useEffect(() => {
    if (onTenantChange) {
      onTenantChange(tenantId);
    }
  }, [tenantId, onTenantChange]);

  // SDK wrapper methods with automatic tenant context
  const log = useCallback(async (message: string, options: LogOptions = {}) => {
    if (!sdk) return;
    
    await sdk.log(message, {
      ...options,
      tenantId: options.tenantId || tenantId || undefined
    });
  }, [sdk, tenantId]);

  const error = useCallback(async (error: Error | string, options: LogOptions = {}) => {
    if (!sdk) return;
    
    await sdk.error(error, {
      ...options,
      tenantId: options.tenantId || tenantId || undefined
    });
  }, [sdk, tenantId]);

  const trace = useCallback(async <T>(
    name: string, 
    fn: (span: any) => Promise<T> | T, 
    options: TraceOptions = {}
  ): Promise<T> => {
    if (!sdk) return fn(null);
    
    return sdk.trace(name, fn, {
      ...options,
      tenantId: options.tenantId || tenantId || undefined
    });
  }, [sdk, tenantId]);

  const metric = useCallback(async (
    name: string, 
    value: number, 
    options: MetricOptions = {}
  ) => {
    if (!sdk) return;
    
    await sdk.metric(name, value, {
      ...options,
      tenantId: options.tenantId || tenantId || undefined
    });
  }, [sdk, tenantId]);

  const setTenantId = useCallback((newTenantId: string | null) => {
    setTenantIdState(newTenantId);
    
    // Persist to storage
    if (typeof window !== 'undefined') {
      if (newTenantId) {
        sessionStorage.setItem('hyperdx_tenant_id', newTenantId);
        // Set cookie for server-side access
        document.cookie = `hyperdx_tenant_id=${newTenantId}; path=/; max-age=${60 * 60 * 24}; samesite=strict`;
      } else {
        sessionStorage.removeItem('hyperdx_tenant_id');
        // Clear cookie
        document.cookie = 'hyperdx_tenant_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }
    }
  }, []);

  const refreshTenant = useCallback(async () => {
    if (!tenantId || !sdk) return;
    
    try {
      // Re-fetch tenant information
      // This would typically make an API call
      const info: TenantInfo = {
        id: tenantId,
        name: `Tenant ${tenantId}`,
        features: {
          alerting: true,
          dashboards: true,
          sessionReplay: true,
          customFields: true
        }
      };
      
      setTenantInfo(info);
      
      await sdk.log('Tenant context refreshed', {
        level: 'INFO',
        tenantId,
        attributes: {
          component: 'react-provider',
          action: 'refresh_tenant'
        }
      });

    } catch (error) {
      console.error('[HyperDX Provider] Failed to refresh tenant:', error);
      if (sdk) {
        await sdk.error(error instanceof Error ? error : new Error(String(error)), {
          tenantId,
          attributes: {
            component: 'react-provider',
            action: 'refresh_tenant'
          }
        });
      }
    }
  }, [tenantId, sdk]);

  const contextValue: HyperDXContextValue = {
    tenantId,
    tenantInfo,
    isLoading: isLoading || !sdk,
    log,
    error,
    trace,
    metric,
    setTenantId,
    refreshTenant,
    sdk
  };

  return (
    <HyperDXContext.Provider value={contextValue}>
      {children}
    </HyperDXContext.Provider>
  );
}

/**
 * Hook to access HyperDX context
 */
export function useHyperDX(): HyperDXContextValue {
  const context = useContext(HyperDXContext);
  
  if (!context) {
    throw new Error('useHyperDX must be used within a HyperDXProvider');
  }
  
  return context;
}

/**
 * Hook to access tenant information
 */
export function useTenant(): { tenantId: string | null; tenantInfo: TenantInfo | null; isLoading: boolean } {
  const { tenantId, tenantInfo, isLoading } = useHyperDX();
  return { tenantId, tenantInfo, isLoading };
}

/**
 * Hook for tenant-aware logging
 */
export function useHyperDXLogger() {
  const { log, error, trace, metric } = useHyperDX();
  return { log, error, trace, metric };
}

/**
 * Higher-Order Component for automatic error boundary with HyperDX logging
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface HyperDXErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
  onError?: (error: Error) => void;
}

export class HyperDXErrorBoundary extends React.Component<
  HyperDXErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: HyperDXErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to HyperDX if SDK is available
    const { onError } = this.props;
    
    if (onError) {
      onError(error);
    }

    // Attempt to log to HyperDX
    // Note: This is a simplified version - in practice, you'd need access to the context
    console.error('[HyperDX Error Boundary] React error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error);
      }
      
      return (
        <div style={{ padding: '20px', border: '1px solid red', borderRadius: '4px' }}>
          <h3>Something went wrong</h3>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error.message}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}