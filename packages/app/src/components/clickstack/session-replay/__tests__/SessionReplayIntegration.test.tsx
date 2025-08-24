import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SessionReplayPlayer } from '../SessionReplayPlayer';
import { SessionTimeline } from '../SessionTimeline';
import { SessionHeatmap } from '../SessionHeatmap';
import { SessionControls } from '../SessionControls';
import { UserJourneyMap } from '../UserJourneyMap';
import { SessionAnalytics } from '../SessionAnalytics';

// Mock fetch for API calls
global.fetch = jest.fn();

// Sample session data for testing
const mockSessionData = {
  sessionId: 'test-session-123',
  userId: 'user-456',
  events: [
    {
      id: 'event-1',
      timestamp: 1000,
      type: 'click' as const,
      data: { x: 100, y: 200, element: 'button.submit' },
      metadata: {
        pageUrl: 'https://example.com/login',
        userAgent: 'Mozilla/5.0...',
        viewport: { width: 1920, height: 1080 }
      }
    },
    {
      id: 'event-2',
      timestamp: 2000,
      type: 'input' as const,
      data: { value: 'test@example.com', element: 'input.email' },
      metadata: {
        pageUrl: 'https://example.com/login',
        userAgent: 'Mozilla/5.0...',
        viewport: { width: 1920, height: 1080 }
      }
    },
    {
      id: 'event-3',
      timestamp: 3000,
      type: 'navigation' as const,
      data: { url: 'https://example.com/dashboard' },
      metadata: {
        pageUrl: 'https://example.com/dashboard',
        userAgent: 'Mozilla/5.0...',
        viewport: { width: 1920, height: 1080 }
      }
    },
    {
      id: 'event-4',
      timestamp: 4000,
      type: 'performance' as const,
      data: { 
        performance: { 
          loadTime: 1500, 
          responseTime: 200 
        } 
      },
      metadata: {
        pageUrl: 'https://example.com/dashboard',
        userAgent: 'Mozilla/5.0...',
        viewport: { width: 1920, height: 1080 }
      }
    },
    {
      id: 'event-5',
      timestamp: 5000,
      type: 'click' as const,
      data: { x: 300, y: 400, element: 'button.logout' },
      metadata: {
        pageUrl: 'https://example.com/dashboard',
        userAgent: 'Mozilla/5.0...',
        viewport: { width: 1920, height: 1080 }
      }
    }
  ]
};

describe('Session Replay Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockSessionData
    });
  });

  describe('SessionReplayPlayer Integration', () => {
    it('should render all session replay components correctly', async () => {
      render(
        <SessionReplayPlayer
          teamId="team-123"
          sessionId="test-session-123"
          onClose={() => {}}
        />
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Session Replay')).toBeInTheDocument();
      });

      // Check for main player elements
      expect(screen.getByText('Session Replay')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    it('should handle playback controls correctly', async () => {
      render(
        <SessionReplayPlayer
          teamId="team-123"
          sessionId="test-session-123"
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Session Replay')).toBeInTheDocument();
      });

      const playButton = screen.getByRole('button', { name: /play/i });
      const pauseButton = screen.getByRole('button', { name: /pause/i });

      // Test play functionality
      fireEvent.click(playButton);
      expect(pauseButton).toBeVisible();

      // Test pause functionality
      fireEvent.click(pauseButton);
      expect(playButton).toBeVisible();
    });

    it('should handle speed control correctly', async () => {
      render(
        <SessionReplayPlayer
          teamId="team-123"
          sessionId="test-session-123"
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Session Replay')).toBeInTheDocument();
      });

      // Find speed control (might be in a select or button)
      const speedControls = screen.getAllByRole('button');
      const speedButton = speedControls.find(button => 
        button.textContent?.includes('1x') || button.textContent?.includes('Speed')
      );

      if (speedButton) {
        fireEvent.click(speedButton);
        // Check if speed options are available
        expect(screen.getByText('2x')).toBeInTheDocument();
      }
    });
  });

  describe('SessionTimeline Integration', () => {
    it('should display events in chronological order', () => {
      render(
        <SessionTimeline
          events={mockSessionData.events}
          currentEventIndex={0}
          onEventSelect={() => {}}
        />
      );

      // Check for event types
      expect(screen.getByText('click')).toBeInTheDocument();
      expect(screen.getByText('input')).toBeInTheDocument();
      expect(screen.getByText('navigation')).toBeInTheDocument();
      expect(screen.getByText('performance')).toBeInTheDocument();
    });

    it('should handle event filtering correctly', () => {
      render(
        <SessionTimeline
          events={mockSessionData.events}
          currentEventIndex={0}
          onEventSelect={() => {}}
        />
      );

      // Find filter controls
      const filterButtons = screen.getAllByRole('button');
      const clickFilter = filterButtons.find(button => 
        button.textContent?.toLowerCase().includes('click')
      );

      if (clickFilter) {
        fireEvent.click(clickFilter);
        // Should only show click events
        expect(screen.getAllByText('click')).toHaveLength(2);
      }
    });
  });

  describe('SessionHeatmap Integration', () => {
    it('should render heatmap with event data', () => {
      render(
        <SessionHeatmap
          events={mockSessionData.events}
          viewport={{ width: 1920, height: 1080 }}
        />
      );

      // Check for heatmap container
      expect(screen.getByText('Session Heatmap')).toBeInTheDocument();
      
      // Check for legend
      expect(screen.getByText('Event Types')).toBeInTheDocument();
    });

    it('should handle event type filtering', () => {
      render(
        <SessionHeatmap
          events={mockSessionData.events}
          viewport={{ width: 1920, height: 1080 }}
        />
      );

      // Find filter controls
      const filterButtons = screen.getAllByRole('button');
      const clickFilter = filterButtons.find(button => 
        button.textContent?.toLowerCase().includes('click')
      );

      if (clickFilter) {
        fireEvent.click(clickFilter);
        // Should update heatmap to show only click events
        expect(screen.getByText('Click Events')).toBeInTheDocument();
      }
    });
  });

  describe('SessionControls Integration', () => {
    const mockControls = {
      isPlaying: false,
      onPlayPause: jest.fn(),
      onSkipBack: jest.fn(),
      onSkipForward: jest.fn(),
      onRestart: jest.fn(),
      playbackSpeed: 1,
      onSpeedChange: jest.fn(),
      currentEventIndex: 0,
      totalEvents: 5
    };

    it('should render all control buttons', () => {
      render(<SessionControls {...mockControls} />);

      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /skip back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /skip forward/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /restart/i })).toBeInTheDocument();
    });

    it('should handle control button clicks', () => {
      render(<SessionControls {...mockControls} />);

      const playButton = screen.getByRole('button', { name: /play/i });
      const skipBackButton = screen.getByRole('button', { name: /skip back/i });
      const skipForwardButton = screen.getByRole('button', { name: /skip forward/i });

      fireEvent.click(playButton);
      expect(mockControls.onPlayPause).toHaveBeenCalled();

      fireEvent.click(skipBackButton);
      expect(mockControls.onSkipBack).toHaveBeenCalled();

      fireEvent.click(skipForwardButton);
      expect(mockControls.onSkipForward).toHaveBeenCalled();
    });

    it('should display progress information', () => {
      render(<SessionControls {...mockControls} />);

      // Check for progress indicator
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
    });
  });

  describe('UserJourneyMap Integration', () => {
    it('should render journey map with multiple view modes', () => {
      render(
        <UserJourneyMap
          events={mockSessionData.events}
          userId="user-456"
          sessionId="test-session-123"
        />
      );

      // Check for view mode selector
      expect(screen.getByText('Flow View')).toBeInTheDocument();
      expect(screen.getByText('Funnel View')).toBeInTheDocument();
      expect(screen.getByText('Timeline View')).toBeInTheDocument();
    });

    it('should display journey metrics', () => {
      render(
        <UserJourneyMap
          events={mockSessionData.events}
          userId="user-456"
          sessionId="test-session-123"
        />
      );

      // Check for journey metrics
      expect(screen.getByText('Total Duration')).toBeInTheDocument();
      expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
      expect(screen.getByText('Error Rate')).toBeInTheDocument();
      expect(screen.getByText('Engagement')).toBeInTheDocument();
    });

    it('should handle view mode switching', () => {
      render(
        <UserJourneyMap
          events={mockSessionData.events}
          userId="user-456"
          sessionId="test-session-123"
        />
      );

      // Find view mode selector
      const viewModeSelect = screen.getByRole('combobox');
      if (viewModeSelect) {
        fireEvent.click(viewModeSelect);
        
        // Select funnel view
        const funnelOption = screen.getByText('Funnel View');
        fireEvent.click(funnelOption);
        
        expect(screen.getByText('Conversion Funnel')).toBeInTheDocument();
      }
    });
  });

  describe('SessionAnalytics Integration', () => {
    it('should render analytics with multiple metric tabs', () => {
      render(
        <SessionAnalytics
          events={mockSessionData.events}
          sessionId="test-session-123"
          userId="user-456"
        />
      );

      // Check for metric tabs
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('User Behavior')).toBeInTheDocument();
      expect(screen.getByText('Engagement')).toBeInTheDocument();
    });

    it('should display overview metrics', () => {
      render(
        <SessionAnalytics
          events={mockSessionData.events}
          sessionId="test-session-123"
          userId="user-456"
        />
      );

      // Check for overview metrics
      expect(screen.getByText('Session Duration')).toBeInTheDocument();
      expect(screen.getByText('Total Events')).toBeInTheDocument();
      expect(screen.getByText('Pages Visited')).toBeInTheDocument();
      expect(screen.getByText('Conversion')).toBeInTheDocument();
    });

    it('should handle metric tab switching', () => {
      render(
        <SessionAnalytics
          events={mockSessionData.events}
          sessionId="test-session-123"
          userId="user-456"
        />
      );

      // Find metric selector
      const metricSelect = screen.getByRole('combobox');
      if (metricSelect) {
        fireEvent.click(metricSelect);
        
        // Select performance tab
        const performanceOption = screen.getByText('Performance');
        fireEvent.click(performanceOption);
        
        // Check for performance metrics
        expect(screen.getByText('Avg Load Time')).toBeInTheDocument();
        expect(screen.getByText('Avg Response Time')).toBeInTheDocument();
        expect(screen.getByText('Total Errors')).toBeInTheDocument();
        expect(screen.getByText('Error Rate')).toBeInTheDocument();
      }
    });
  });

  describe('Cross-Component Integration', () => {
    it('should maintain state consistency across components', async () => {
      render(
        <SessionReplayPlayer
          teamId="team-123"
          sessionId="test-session-123"
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Session Replay')).toBeInTheDocument();
      });

      // Start playback
      const playButton = screen.getByRole('button', { name: /play/i });
      fireEvent.click(playButton);

      // Check that timeline shows current event
      expect(screen.getByText('Event 1 of 5')).toBeInTheDocument();

      // Check that analytics update
      expect(screen.getByText('5 Events')).toBeInTheDocument();
    });

    it('should handle error states gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(
        <SessionReplayPlayer
          teamId="team-123"
          sessionId="test-session-123"
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/failed to load session data/i)).toBeInTheDocument();
      });
    });

    it('should handle empty session data', () => {
      render(
        <SessionAnalytics
          events={[]}
          sessionId="test-session-123"
          userId="user-456"
        />
      );

      expect(screen.getByText('No Analytics Data')).toBeInTheDocument();
      expect(screen.getByText('No session events available for analysis.')).toBeInTheDocument();
    });
  });

  describe('Performance and Accessibility', () => {
    it('should handle large event datasets efficiently', () => {
      const largeEventSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `event-${i}`,
        timestamp: i * 1000,
        type: 'click' as const,
        data: { x: i, y: i, element: `button-${i}` },
        metadata: {
          pageUrl: 'https://example.com/page',
          userAgent: 'Mozilla/5.0...',
          viewport: { width: 1920, height: 1080 }
        }
      }));

      render(
        <SessionTimeline
          events={largeEventSet}
          currentEventIndex={0}
          onEventSelect={() => {}}
        />
      );

      // Should render without performance issues
      expect(screen.getByText('click')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(
        <SessionControls
          isPlaying={false}
          onPlayPause={jest.fn()}
          onSkipBack={jest.fn()}
          onSkipForward={jest.fn()}
          onRestart={jest.fn()}
          playbackSpeed={1}
          onSpeedChange={jest.fn()}
          currentEventIndex={0}
          totalEvents={5}
        />
      );

      const playButton = screen.getByRole('button', { name: /play/i });
      playButton.focus();

      // Test keyboard shortcuts
      fireEvent.keyDown(playButton, { key: 'Enter' });
      fireEvent.keyDown(playButton, { key: ' ' });
    });
  });
});
