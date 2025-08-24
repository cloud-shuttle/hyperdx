// examples/nextjs-app-router.ts
// Complete example of using HyperDX Multi-tenant SDK with Next.js App Router

import { createHyperDXMiddleware } from '@hyperdx/multi-tenant-sdk/nextjs';
import { NextRequest, NextResponse } from 'next/server';

// 1. Configure the SDK
const hyperdxConfig = {
  serviceName: 'my-nextjs-app',
  hyperdxEndpoint: process.env.HYPERDX_ENDPOINT || 'http://localhost:8000',
  authServiceEndpoint: process.env.AUTH_SERVICE_ENDPOINT,
  environment: process.env.NODE_ENV || 'development',
  debug: process.env.NODE_ENV === 'development',
  enableTracing: true,
  enableLogs: true
};

// 2. Create HyperDX middleware
const { middleware: hyperdxMiddleware, withTenant, getServerSideProps, sdk } = 
  createHyperDXMiddleware(hyperdxConfig);

// 3. Export Next.js middleware
export async function middleware(request: NextRequest) {
  return hyperdxMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!api/health|_next/static|_next/image|favicon.ico).*)',
  ],
};

// 4. Example API route with tenant context
// app/api/users/route.ts
export const GET = withTenant(async (req, res, { tenantId, sdk }) => {
  await sdk.log('Fetching users for tenant', { 
    tenantId,
    attributes: { action: 'get_users' } 
  });

  try {
    // Your business logic here
    const users = await getUsersForTenant(tenantId);
    
    await sdk.metric('users.fetched', users.length, { tenantId });
    
    return res.json({ users });
  } catch (error) {
    await sdk.error(error, { tenantId });
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 5. Example Server Component with tenant context
// app/dashboard/page.tsx
import { getHyperDXTenantId } from '@hyperdx/multi-tenant-sdk/nextjs';

export default async function Dashboard() {
  const tenantId = await getHyperDXTenantId();
  
  if (!tenantId) {
    redirect('/auth/login');
  }

  // Fetch tenant-specific data
  const dashboardData = await getDashboardData(tenantId);

  return (
    <div>
      <h1>Dashboard for {tenantId}</h1>
      {/* Your dashboard content */}
    </div>
  );
}

// 6. Example Client Component with React Context
// app/components/UserList.tsx
'use client';

import { useHyperDX } from '@hyperdx/multi-tenant-sdk/react';

export function UserList() {
  const { log, tenantId, isLoading } = useHyperDX();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!tenantId) return;

    const fetchUsers = async () => {
      await log('Fetching users from client', { 
        attributes: { component: 'UserList' }
      });
      
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data.users);
    };

    fetchUsers();
  }, [tenantId, log]);

  if (isLoading) return <div>Loading...</div>;
  if (!tenantId) return <div>No tenant context</div>;

  return (
    <div>
      <h2>Users</h2>
      {users.map(user => <div key={user.id}>{user.name}</div>)}
    </div>
  );
}

// 7. Root layout with HyperDX Provider
// app/layout.tsx
import { HyperDXProvider } from '@hyperdx/multi-tenant-sdk/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <HyperDXProvider 
          config={hyperdxConfig}
          enableAutoInit={true}
        >
          {children}
        </HyperDXProvider>
      </body>
    </html>
  );
}

// Helper functions (would be implemented by you)
async function getUsersForTenant(tenantId: string) {
  // Your database query with tenant filtering
  return [];
}

async function getDashboardData(tenantId: string) {
  // Your tenant-specific data fetching
  return {};
}