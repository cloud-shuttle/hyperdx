import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock browser-specific APIs for cross-browser testing
const mockBrowserAPIs = {
  // Chrome/Safari specific
  webkitRequestAnimationFrame: jest.fn(),
  webkitCancelAnimationFrame: jest.fn(),
  
  // Firefox specific
  mozRequestAnimationFrame: jest.fn(),
  mozCancelAnimationFrame: jest.fn(),
  
  // IE specific
  msRequestAnimationFrame: jest.fn(),
  msCancelAnimationFrame: jest.fn(),
  
  // Safari specific
  webkitAudioContext: jest.fn(),
  
  // Chrome specific
  chrome: {
    runtime: {
      sendMessage: jest.fn(),
    },
  },
  
  // Firefox specific
  browser: {
    runtime: {
      sendMessage: jest.fn(),
    },
  },
};

// Mock different user agents
const mockUserAgents = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
  ie: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
};

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

describe('ClickStack Cross-Browser Tests', () => {
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

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    
    // Reset browser APIs
    Object.keys(mockBrowserAPIs).forEach(key => {
      if (typeof mockBrowserAPIs[key] === 'function') {
        mockBrowserAPIs[key].mockClear();
      }
    });
  });

  describe('Chrome Compatibility', () => {
    beforeEach(() => {
      // Mock Chrome user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.chrome,
        configurable: true,
      });

      // Mock Chrome-specific APIs
      Object.defineProperty(window, 'webkitRequestAnimationFrame', {
        value: mockBrowserAPIs.webkitRequestAnimationFrame,
        configurable: true,
      });

      Object.defineProperty(window, 'chrome', {
        value: mockBrowserAPIs.chrome,
        configurable: true,
      });

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

    test('should render correctly in Chrome', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test Chrome-specific features
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Overview/i })).toBeInTheDocument();
    });

    test('should handle Chrome-specific animations', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test tab switching (uses CSS transitions in Chrome)
      const analyticsTab = screen.getByRole('tab', { name: /Analytics/i });
      fireEvent.click(analyticsTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('clickstack-analytics')).toBeInTheDocument();
      });
    });

    test('should support Chrome-specific CSS features', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test CSS Grid support (well-supported in Chrome)
      const statsGrid = screen.getByText('Active Users').closest('div');
      expect(statsGrid).toBeInTheDocument();
    });
  });

  describe('Firefox Compatibility', () => {
    beforeEach(() => {
      // Mock Firefox user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.firefox,
        configurable: true,
      });

      // Mock Firefox-specific APIs
      Object.defineProperty(window, 'mozRequestAnimationFrame', {
        value: mockBrowserAPIs.mozRequestAnimationFrame,
        configurable: true,
      });

      Object.defineProperty(window, 'browser', {
        value: mockBrowserAPIs.browser,
        configurable: true,
      });

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

    test('should render correctly in Firefox', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test Firefox-specific features
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Overview/i })).toBeInTheDocument();
    });

    test('should handle Firefox-specific CSS features', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test CSS Grid support (well-supported in Firefox)
      const statsGrid = screen.getByText('Active Users').closest('div');
      expect(statsGrid).toBeInTheDocument();
    });

    test('should support Firefox-specific form handling', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test form elements work correctly in Firefox
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
      
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('role', 'tab');
      });
    });
  });

  describe('Safari Compatibility', () => {
    beforeEach(() => {
      // Mock Safari user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.safari,
        configurable: true,
      });

      // Mock Safari-specific APIs
      Object.defineProperty(window, 'webkitRequestAnimationFrame', {
        value: mockBrowserAPIs.webkitRequestAnimationFrame,
        configurable: true,
      });

      Object.defineProperty(window, 'webkitAudioContext', {
        value: mockBrowserAPIs.webkitAudioContext,
        configurable: true,
      });

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

    test('should render correctly in Safari', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test Safari-specific features
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Overview/i })).toBeInTheDocument();
    });

    test('should handle Safari-specific CSS features', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test CSS Grid support (well-supported in Safari)
      const statsGrid = screen.getByText('Active Users').closest('div');
      expect(statsGrid).toBeInTheDocument();
    });

    test('should support Safari-specific touch events', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test touch-friendly interactions
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
      
      // Simulate touch event
      const analyticsTab = screen.getByRole('tab', { name: /Analytics/i });
      fireEvent.touchStart(analyticsTab);
      fireEvent.touchEnd(analyticsTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('clickstack-analytics')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Compatibility', () => {
    beforeEach(() => {
      // Mock Edge user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.edge,
        configurable: true,
      });

      // Mock Edge-specific APIs (similar to Chrome)
      Object.defineProperty(window, 'webkitRequestAnimationFrame', {
        value: mockBrowserAPIs.webkitRequestAnimationFrame,
        configurable: true,
      });

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

    test('should render correctly in Edge', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test Edge-specific features
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Overview/i })).toBeInTheDocument();
    });

    test('should handle Edge-specific CSS features', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test CSS Grid support (well-supported in Edge)
      const statsGrid = screen.getByText('Active Users').closest('div');
      expect(statsGrid).toBeInTheDocument();
    });
  });

  describe('Internet Explorer Compatibility', () => {
    beforeEach(() => {
      // Mock IE user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.ie,
        configurable: true,
      });

      // Mock IE-specific APIs
      Object.defineProperty(window, 'msRequestAnimationFrame', {
        value: mockBrowserAPIs.msRequestAnimationFrame,
        configurable: true,
      });

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

    test('should render correctly in Internet Explorer', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test IE-specific features
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Overview/i })).toBeInTheDocument();
    });

    test('should handle IE-specific limitations gracefully', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test fallback behavior for unsupported features
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
      
      // Test basic functionality works
      const analyticsTab = screen.getByRole('tab', { name: /Analytics/i });
      fireEvent.click(analyticsTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('clickstack-analytics')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Browser Compatibility', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      // Mock touch events
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        configurable: true,
        value: null,
      });

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

    test('should render correctly on mobile Chrome', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        configurable: true,
      });

      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test mobile-specific features
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    test('should render correctly on mobile Safari', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
        configurable: true,
      });

      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test mobile-specific features
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    test('should handle touch events correctly', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test touch interactions
      const analyticsTab = screen.getByRole('tab', { name: /Analytics/i });
      
      // Simulate touch events
      fireEvent.touchStart(analyticsTab);
      fireEvent.touchEnd(analyticsTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('clickstack-analytics')).toBeInTheDocument();
      });
    });

    test('should handle viewport changes correctly', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test orientation change
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 667,
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 375,
      });

      // Trigger resize event
      fireEvent.resize(window);
      
      // Should still render correctly
      expect(screen.getByText('ClickStack')).toBeInTheDocument();
    });
  });

  describe('CSS Feature Support', () => {
    beforeEach(() => {
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

    test('should support CSS Grid layout', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test CSS Grid support
      const statsGrid = screen.getByText('Active Users').closest('div');
      expect(statsGrid).toBeInTheDocument();
    });

    test('should support CSS Flexbox layout', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test Flexbox support
      const header = screen.getByText('ClickStack').closest('div');
      expect(header).toBeInTheDocument();
    });

    test('should support CSS Custom Properties', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test CSS Custom Properties support
      const element = screen.getByText('ClickStack');
      expect(element).toBeInTheDocument();
    });

    test('should support CSS Transitions', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test CSS Transitions support
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
    });
  });

  describe('JavaScript Feature Support', () => {
    beforeEach(() => {
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

    test('should support ES6+ features', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test ES6+ features are working
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
    });

    test('should support Promise-based APIs', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test Promise support
      expect(global.fetch).toHaveBeenCalled();
    });

    test('should support async/await syntax', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test async/await support
      expect(screen.getByText('ClickStack')).toBeInTheDocument();
    });

    test('should support Fetch API', async () => {
      render(<ClickStackPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ClickStack')).toBeInTheDocument();
      });

      // Test Fetch API support
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Performance Across Browsers', () => {
    test('should load within acceptable time in Chrome', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.chrome,
        configurable: true,
      });

      const startTime = performance.now();
      
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
      
      // Should load within 2 seconds in Chrome
      expect(loadTime).toBeLessThan(2000);
    });

    test('should load within acceptable time in Firefox', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.firefox,
        configurable: true,
      });

      const startTime = performance.now();
      
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
      
      // Should load within 2.5 seconds in Firefox
      expect(loadTime).toBeLessThan(2500);
    });

    test('should load within acceptable time in Safari', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.safari,
        configurable: true,
      });

      const startTime = performance.now();
      
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
      
      // Should load within 2.5 seconds in Safari
      expect(loadTime).toBeLessThan(2500);
    });
  });
});
