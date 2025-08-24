import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock ClickStack components
jest.mock('@/components/clickstack/dashboard/ClickStackDashboard', () => {
  return function MockClickStackDashboard({ teamId }: { teamId: string }) {
    return <div data-testid="clickstack-dashboard">Dashboard for team: {teamId}</div>;
  };
});

jest.mock('@/components/clickstack/analytics/ClickStackAnalyticsDashboard', () => {
  return function MockClickStackAnalyticsDashboard({ teamId }: { teamId: string }) {
    return <div data-testid="clickstack-analytics">Analytics for team: {teamId}</div>;
  };
});

jest.mock('@/components/clickstack/realtime/ClickStackRealTimeMonitor', () => {
  return function MockClickStackRealTimeMonitor({ teamId }: { teamId: string }) {
    return <div data-testid="clickstack-realtime">Real-time for team: {teamId}</div>;
  };
});

jest.mock('@/components/clickstack/advanced/ClickStackAdvancedDashboard', () => {
  return function MockClickStackAdvancedDashboard({ teamId }: { teamId: string }) {
    return <div data-testid="clickstack-advanced">Advanced for team: {teamId}</div>;
  };
});

jest.mock('@/components/clickstack/performance/ClickStackPerformanceMonitor', () => {
  return function MockClickStackPerformanceMonitor({ teamId }: { teamId: string }) {
    return <div data-testid="clickstack-performance">Performance for team: {teamId}</div>;
  };
});

jest.mock('@/components/clickstack/production/ClickStackProductionDashboard', () => {
  return function MockClickStackProductionDashboard({ teamId }: { teamId: string }) {
    return <div data-testid="clickstack-production">Production for team: {teamId}</div>;
  };
});

jest.mock('@/components/clickstack/export/ClickStackExportManager', () => {
  return function MockClickStackExportManager({ teamId }: { teamId: string }) {
    return <div data-testid="clickstack-export">Export for team: {teamId}</div>;
  };
});

// Import the main ClickStack page
import ClickStackPage from '../../pages/clickstack/index';

describe('ClickStack Integration Tests', () => {
  const mockRouter = {
    push: jest.fn(),
    pathname: '/clickstack',
    query: {},
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Page Loading and Initial State', () => {
    test('should render loading state initially', () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(() => {}) // Never resolves to simulate loading
      );

      render(<ClickStackPage />);
      
      expect(screen.getByText('Loading ClickStack...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('should render error state when API fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack Unavailable')).toBeInTheDocument();
        expect(screen.getByText('Failed to load ClickStack status')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
      });
    });

    test('should render main page when API succeeds', async () => {
      const mockHealthData = {
        data: {
          status: 'healthy',
          version: '1.0.0',
          uptime: 3600,
          services: {
            anomalyDetection: 'active',
            predictiveAnalytics: 'active',
            securityAnalysis: 'active',
            sessionReplay: 'active',
            patternRecognition: 'active',
          },
          lastCheck: new Date().toISOString(),
        },
      };

      const mockFeaturesData = {
        data: {
          features: {
            anomalyDetection: { enabled: true, version: '1.0.0', status: 'active' },
            predictiveAnalytics: { enabled: true, version: '1.0.0', status: 'active' },
            sessionReplay: { enabled: true, version: '1.0.0', status: 'active' },
            patternRecognition: { enabled: true, version: '1.0.0', status: 'active' },
            securityAnalysis: { enabled: true, version: '1.0.0', status: 'active' },
          },
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHealthData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFeaturesData,
        });

      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
        expect(screen.getByText('Advanced Observability Platform')).toBeInTheDocument();
      });
    });
  });

  describe('Header and Navigation', () => {
    beforeEach(async () => {
      const mockHealthData = {
        data: {
          status: 'healthy',
          version: '1.0.0',
          uptime: 3600,
          services: {},
          lastCheck: new Date().toISOString(),
        },
      };

      const mockFeaturesData = {
        data: {
          features: {
            anomalyDetection: { enabled: true, version: '1.0.0', status: 'active' },
            predictiveAnalytics: { enabled: true, version: '1.0.0', status: 'active' },
            sessionReplay: { enabled: true, version: '1.0.0', status: 'active' },
            patternRecognition: { enabled: true, version: '1.0.0', status: 'active' },
            securityAnalysis: { enabled: true, version: '1.0.0', status: 'active' },
          },
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHealthData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFeaturesData,
        });

      render(<ClickStackPage />);
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });
    });

    test('should display health status badge', () => {
      expect(screen.getByText('healthy')).toBeInTheDocument();
    });

    test('should display action buttons in header', () => {
      expect(screen.getByRole('button', { name: /Documentation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Training/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Support/i })).toBeInTheDocument();
    });

    test('should display quick stats cards', () => {
      expect(screen.getByText('Active Users')).toBeInTheDocument();
      expect(screen.getByText('Sessions Today')).toBeInTheDocument();
      expect(screen.getByText('Active Alerts')).toBeInTheDocument();
      expect(screen.getByText('ML Insights')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(async () => {
      const mockHealthData = {
        data: {
          status: 'healthy',
          version: '1.0.0',
          uptime: 3600,
          services: {},
          lastCheck: new Date().toISOString(),
        },
      };

      const mockFeaturesData = {
        data: {
          features: {
            anomalyDetection: { enabled: true, version: '1.0.0', status: 'active' },
            predictiveAnalytics: { enabled: true, version: '1.0.0', status: 'active' },
            sessionReplay: { enabled: true, version: '1.0.0', status: 'active' },
            patternRecognition: { enabled: true, version: '1.0.0', status: 'active' },
            securityAnalysis: { enabled: true, version: '1.0.0', status: 'active' },
          },
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHealthData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFeaturesData,
        });

      render(<ClickStackPage />);
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });
    });

    test('should display all tab buttons', () => {
      expect(screen.getByRole('tab', { name: /Overview/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Analytics/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Real-time/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Advanced/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Performance/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Production/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Export/i })).toBeInTheDocument();
    });

    test('should show overview tab by default', () => {
      expect(screen.getByTestId('clickstack-dashboard')).toBeInTheDocument();
    });

    test('should switch to analytics tab when clicked', async () => {
      const analyticsTab = screen.getByRole('tab', { name: /Analytics/i });
      fireEvent.click(analyticsTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('clickstack-analytics')).toBeInTheDocument();
      });
    });

    test('should switch to real-time tab when clicked', async () => {
      const realtimeTab = screen.getByRole('tab', { name: /Real-time/i });
      fireEvent.click(realtimeTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('clickstack-realtime')).toBeInTheDocument();
      });
    });

    test('should switch to advanced tab when clicked', async () => {
      const advancedTab = screen.getByRole('tab', { name: /Advanced/i });
      fireEvent.click(advancedTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('clickstack-advanced')).toBeInTheDocument();
      });
    });

    test('should switch to performance tab when clicked', async () => {
      const performanceTab = screen.getByRole('tab', { name: /Performance/i });
      fireEvent.click(performanceTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('clickstack-performance')).toBeInTheDocument();
      });
    });

    test('should switch to production tab when clicked', async () => {
      const productionTab = screen.getByRole('tab', { name: /Production/i });
      fireEvent.click(productionTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('clickstack-production')).toBeInTheDocument();
      });
    });

    test('should switch to export tab when clicked', async () => {
      const exportTab = screen.getByRole('tab', { name: /Export/i });
      fireEvent.click(exportTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('clickstack-export')).toBeInTheDocument();
      });
    });
  });

  describe('Feature Status Display', () => {
    beforeEach(async () => {
      const mockHealthData = {
        data: {
          status: 'healthy',
          version: '1.0.0',
          uptime: 3600,
          services: {},
          lastCheck: new Date().toISOString(),
        },
      };

      const mockFeaturesData = {
        data: {
          features: {
            anomalyDetection: { enabled: true, version: '1.0.0', status: 'active' },
            predictiveAnalytics: { enabled: true, version: '1.0.0', status: 'active' },
            sessionReplay: { enabled: true, version: '1.0.0', status: 'active' },
            patternRecognition: { enabled: true, version: '1.0.0', status: 'active' },
            securityAnalysis: { enabled: true, version: '1.0.0', status: 'active' },
          },
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHealthData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFeaturesData,
        });

      render(<ClickStackPage />);
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });
    });

    test('should display feature status section', () => {
      expect(screen.getByText('Feature Status')).toBeInTheDocument();
    });

    test('should display all feature status indicators', () => {
      expect(screen.getByText('Anomaly Detection')).toBeInTheDocument();
      expect(screen.getByText('Predictive Analytics')).toBeInTheDocument();
      expect(screen.getByText('Session Replay')).toBeInTheDocument();
      expect(screen.getByText('Pattern Recognition')).toBeInTheDocument();
      expect(screen.getByText('Security Analysis')).toBeInTheDocument();
    });

    test('should display feature versions', () => {
      const versionElements = screen.getAllByText('v1.0.0');
      expect(versionElements).toHaveLength(5);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));

      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack Unavailable')).toBeInTheDocument();
        expect(screen.getByText('Failed to load ClickStack status')).toBeInTheDocument();
      });
    });

    test('should handle API error responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      });

      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack Unavailable')).toBeInTheDocument();
        expect(screen.getByText('Failed to load ClickStack status')).toBeInTheDocument();
      });
    });

    test('should retry loading when retry button is clicked', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack Unavailable')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: 'Try Again' });
      fireEvent.click(retryButton);

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Responsive Design', () => {
    beforeEach(async () => {
      const mockHealthData = {
        data: {
          status: 'healthy',
          version: '1.0.0',
          uptime: 3600,
          services: {},
          lastCheck: new Date().toISOString(),
        },
      };

      const mockFeaturesData = {
        data: {
          features: {
            anomalyDetection: { enabled: true, version: '1.0.0', status: 'active' },
            predictiveAnalytics: { enabled: true, version: '1.0.0', status: 'active' },
            sessionReplay: { enabled: true, version: '1.0.0', status: 'active' },
            patternRecognition: { enabled: true, version: '1.0.0', status: 'active' },
            securityAnalysis: { enabled: true, version: '1.0.0', status: 'active' },
          },
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHealthData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFeaturesData,
        });
    });

    test('should render on mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Verify mobile-friendly elements are present
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    test('should render on tablet viewport', async () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Verify tablet-friendly elements are present
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    test('should render on desktop viewport', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Verify desktop-friendly elements are present
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      const mockHealthData = {
        data: {
          status: 'healthy',
          version: '1.0.0',
          uptime: 3600,
          services: {},
          lastCheck: new Date().toISOString(),
        },
      };

      const mockFeaturesData = {
        data: {
          features: {
            anomalyDetection: { enabled: true, version: '1.0.0', status: 'active' },
            predictiveAnalytics: { enabled: true, version: '1.0.0', status: 'active' },
            sessionReplay: { enabled: true, version: '1.0.0', status: 'active' },
            patternRecognition: { enabled: true, version: '1.0.0', status: 'active' },
            securityAnalysis: { enabled: true, version: '1.0.0', status: 'active' },
          },
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHealthData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFeaturesData,
        });

      render(<ClickStackPage />);
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });
    });

    test('should have proper heading structure', () => {
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    test('should have proper tab roles', () => {
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
      
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected');
      });
    });

    test('should have proper tabpanel roles', () => {
      const tabpanels = screen.getAllByRole('tabpanel');
      expect(tabpanels.length).toBeGreaterThan(0);
    });

    test('should have proper button roles', () => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type');
      });
    });

    test('should have proper landmark roles', () => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('should load within acceptable time', async () => {
      const startTime = performance.now();
      
      const mockHealthData = {
        data: {
          status: 'healthy',
          version: '1.0.0',
          uptime: 3600,
          services: {},
          lastCheck: new Date().toISOString(),
        },
      };

      const mockFeaturesData = {
        data: {
          features: {
            anomalyDetection: { enabled: true, version: '1.0.0', status: 'active' },
            predictiveAnalytics: { enabled: true, version: '1.0.0', status: 'active' },
            sessionReplay: { enabled: true, version: '1.0.0', status: 'active' },
            patternRecognition: { enabled: true, version: '1.0.0', status: 'active' },
            securityAnalysis: { enabled: true, version: '1.0.0', status: 'active' },
          },
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockHealthData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFeaturesData,
        });

      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Should load within 2 seconds
      expect(loadTime).toBeLessThan(2000);
    });
  });
});
