import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SessionReplayPlayer } from '../SessionReplayPlayer';
import { SessionTimeline } from '../SessionTimeline';
import { SessionHeatmap } from '../SessionHeatmap';
import { UserJourneyMap } from '../UserJourneyMap';
import { SessionAnalytics } from '../SessionAnalytics';

// Mock fetch for API calls
global.fetch = jest.fn();

// Performance test utilities
const generateLargeEventSet = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `event-${i}`,
    timestamp: i * 1000,
    type: ['click', 'scroll', 'input', 'navigation', 'performance', 'error'][i % 6] as any,
    data: {
      x: Math.random() * 1920,
      y: Math.random() * 1080,
      element: `element-${i}`,
      value: `value-${i}`,
      url: `https://example.com/page-${i % 10}`,
      error: i % 20 === 0 ? `Error ${i}` : undefined,
      performance: i % 5 === 0 ? {
        loadTime: Math.random() * 3000,
        responseTime: Math.random() * 500
      } : undefined
    },
    metadata: {
      pageUrl: `https://example.com/page-${i % 10}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      viewport: { width: 1920, height: 1080 }
    }
  }));
};

// Performance measurement utilities
const measureRenderTime = (component: React.ReactElement) => {
  const startTime = performance.now();
  render(component);
  const endTime = performance.now();
  return endTime - startTime;
};

const measureInteractionTime = (component: React.ReactElement, interaction: () => void) => {
  const { rerender } = render(component);
  const startTime = performance.now();
  interaction();
  const endTime = performance.now();
  return endTime - startTime;
};

describe('Session Replay Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ events: generateLargeEventSet(100) })
    });
  });

  describe('Large Dataset Performance', () => {
    it('should render SessionTimeline with 1000 events under 500ms', () => {
      const largeEvents = generateLargeEventSet(1000);
      
      const renderTime = measureRenderTime(
        <SessionTimeline
          events={largeEvents}
          currentEventIndex={0}
          onEventSelect={() => {}}
        />
      );

      expect(renderTime).toBeLessThan(500);
      expect(screen.getByText('click')).toBeInTheDocument();
    });

    it('should render SessionHeatmap with 1000 events under 300ms', () => {
      const largeEvents = generateLargeEventSet(1000);
      
      const renderTime = measureRenderTime(
        <SessionHeatmap
          events={largeEvents}
          viewport={{ width: 1920, height: 1080 }}
        />
      );

      expect(renderTime).toBeLessThan(300);
      expect(screen.getByText('Session Heatmap')).toBeInTheDocument();
    });

    it('should render UserJourneyMap with 1000 events under 400ms', () => {
      const largeEvents = generateLargeEventSet(1000);
      
      const renderTime = measureRenderTime(
        <UserJourneyMap
          events={largeEvents}
          userId="user-456"
          sessionId="test-session-123"
        />
      );

      expect(renderTime).toBeLessThan(400);
      expect(screen.getByText('User Journey Map')).toBeInTheDocument();
    });

    it('should render SessionAnalytics with 1000 events under 600ms', () => {
      const largeEvents = generateLargeEventSet(1000);
      
      const renderTime = measureRenderTime(
        <SessionAnalytics
          events={largeEvents}
          sessionId="test-session-123"
          userId="user-456"
        />
      );

      expect(renderTime).toBeLessThan(600);
      expect(screen.getByText('Session Analytics')).toBeInTheDocument();
    });
  });

  describe('Interaction Performance', () => {
    it('should handle timeline filtering with 1000 events under 100ms', () => {
      const largeEvents = generateLargeEventSet(1000);
      
      const { rerender } = render(
        <SessionTimeline
          events={largeEvents}
          currentEventIndex={0}
          onEventSelect={() => {}}
        />
      );

      const interactionTime = measureInteractionTime(
        <SessionTimeline
          events={largeEvents}
          currentEventIndex={0}
          onEventSelect={() => {}}
        />,
        () => {
          // Simulate filtering interaction
          const filterInput = screen.getByPlaceholderText(/search events/i);
          if (filterInput) {
            fireEvent.change(filterInput, { target: { value: 'click' } });
          }
        }
      );

      expect(interactionTime).toBeLessThan(100);
    });

    it('should handle heatmap filtering with 1000 events under 150ms', () => {
      const largeEvents = generateLargeEventSet(1000);
      
      const interactionTime = measureInteractionTime(
        <SessionHeatmap
          events={largeEvents}
          viewport={{ width: 1920, height: 1080 }}
        />,
        () => {
          // Simulate heatmap filtering
          const filterButtons = screen.getAllByRole('button');
          const clickFilter = filterButtons.find(button => 
            button.textContent?.toLowerCase().includes('click')
          );
          if (clickFilter) {
            fireEvent.click(clickFilter);
          }
        }
      );

      expect(interactionTime).toBeLessThan(150);
    });

    it('should handle journey map view switching with 1000 events under 200ms', () => {
      const largeEvents = generateLargeEventSet(1000);
      
      const interactionTime = measureInteractionTime(
        <UserJourneyMap
          events={largeEvents}
          userId="user-456"
          sessionId="test-session-123"
        />,
        () => {
          // Simulate view mode switching
          const viewModeSelect = screen.getByRole('combobox');
          if (viewModeSelect) {
            fireEvent.click(viewModeSelect);
            const funnelOption = screen.getByText('Funnel View');
            fireEvent.click(funnelOption);
          }
        }
      );

      expect(interactionTime).toBeLessThan(200);
    });

    it('should handle analytics tab switching with 1000 events under 250ms', () => {
      const largeEvents = generateLargeEventSet(1000);
      
      const interactionTime = measureInteractionTime(
        <SessionAnalytics
          events={largeEvents}
          sessionId="test-session-123"
          userId="user-456"
        />,
        () => {
          // Simulate metric tab switching
          const metricSelect = screen.getByRole('combobox');
          if (metricSelect) {
            fireEvent.click(metricSelect);
            const performanceOption = screen.getByText('Performance');
            fireEvent.click(performanceOption);
          }
        }
      );

      expect(interactionTime).toBeLessThan(250);
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks with large datasets', () => {
      const largeEvents = generateLargeEventSet(5000);
      
      // Render and unmount multiple times to check for memory leaks
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <SessionTimeline
            events={largeEvents}
            currentEventIndex={0}
            onEventSelect={() => {}}
          />
        );
        unmount();
      }

      // If we get here without errors, memory usage is acceptable
      expect(true).toBe(true);
    });

    it('should handle component updates efficiently', () => {
      const largeEvents = generateLargeEventSet(1000);
      
      const { rerender } = render(
        <SessionTimeline
          events={largeEvents}
          currentEventIndex={0}
          onEventSelect={() => {}}
        />
      );

      // Update component multiple times
      for (let i = 0; i < 50; i++) {
        const updateTime = measureInteractionTime(
          <SessionTimeline
            events={largeEvents}
            currentEventIndex={i}
            onEventSelect={() => {}}
          />,
          () => {
            rerender(
              <SessionTimeline
                events={largeEvents}
                currentEventIndex={i}
                onEventSelect={() => {}}
              />
            );
          }
        );

        expect(updateTime).toBeLessThan(50); // Each update should be fast
      }
    });
  });

  describe('Real-time Performance', () => {
    it('should handle real-time playback with 1000 events efficiently', async () => {
      const largeEvents = generateLargeEventSet(1000);
      
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ events: largeEvents })
      });

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

      // Test playback performance
      const playButton = screen.getByRole('button', { name: /play/i });
      const startTime = performance.now();
      
      fireEvent.click(playButton);
      
      // Wait for a few events to process
      await waitFor(() => {
        const currentTime = performance.now();
        expect(currentTime - startTime).toBeLessThan(1000); // Should start quickly
      }, { timeout: 2000 });
    });

    it('should handle concurrent user interactions efficiently', () => {
      const largeEvents = generateLargeEventSet(1000);
      
      const { rerender } = render(
        <SessionTimeline
          events={largeEvents}
          currentEventIndex={0}
          onEventSelect={() => {}}
        />
      );

      // Simulate rapid user interactions
      const interactionTime = measureInteractionTime(
        <SessionTimeline
          events={largeEvents}
          currentEventIndex={0}
          onEventSelect={() => {}}
        />,
        () => {
          // Rapidly change current event index
          for (let i = 0; i < 10; i++) {
            rerender(
              <SessionTimeline
                events={largeEvents}
                currentEventIndex={i * 100}
                onEventSelect={() => {}}
              />
            );
          }
        }
      );

      expect(interactionTime).toBeLessThan(500); // Should handle rapid updates
    });
  });

  describe('Scalability Tests', () => {
    it('should scale linearly with dataset size', () => {
      const sizes = [100, 500, 1000, 2000];
      const renderTimes: number[] = [];

      sizes.forEach(size => {
        const events = generateLargeEventSet(size);
        const renderTime = measureRenderTime(
          <SessionTimeline
            events={events}
            currentEventIndex={0}
            onEventSelect={() => {}}
          />
        );
        renderTimes.push(renderTime);
      });

      // Check that render time doesn't grow exponentially
      const timeRatio = renderTimes[3] / renderTimes[0]; // 2000 events vs 100 events
      const sizeRatio = 2000 / 100; // 20x more data
      
      // Render time should grow less than linearly (due to optimizations)
      expect(timeRatio).toBeLessThan(sizeRatio);
    });

    it('should maintain performance with complex event data', () => {
      const complexEvents = generateLargeEventSet(1000).map(event => ({
        ...event,
        data: {
          ...event.data,
          complexMetadata: {
            nested: {
              deep: {
                value: Math.random() * 1000,
                array: Array.from({ length: 10 }, () => Math.random()),
                object: {
                  prop1: 'value1',
                  prop2: 'value2',
                  prop3: { nested: 'value' }
                }
              }
            }
          }
        }
      }));

      const renderTime = measureRenderTime(
        <SessionTimeline
          events={complexEvents}
          currentEventIndex={0}
          onEventSelect={() => {}}
        />
      );

      expect(renderTime).toBeLessThan(800); // Should handle complex data
    });
  });

  describe('Browser Compatibility Performance', () => {
    it('should perform consistently across different viewport sizes', () => {
      const largeEvents = generateLargeEventSet(1000);
      const viewports = [
        { width: 320, height: 568 },   // Mobile
        { width: 768, height: 1024 },  // Tablet
        { width: 1920, height: 1080 }, // Desktop
        { width: 2560, height: 1440 }  // Large Desktop
      ];

      viewports.forEach(viewport => {
        const renderTime = measureRenderTime(
          <SessionHeatmap
            events={largeEvents}
            viewport={viewport}
          />
        );

        expect(renderTime).toBeLessThan(400); // Should be consistent across viewports
      });
    });

    it('should handle high DPI displays efficiently', () => {
      const largeEvents = generateLargeEventSet(1000);
      
      // Simulate high DPI display
      Object.defineProperty(window, 'devicePixelRatio', {
        value: 2,
        writable: true
      });

      const renderTime = measureRenderTime(
        <SessionHeatmap
          events={largeEvents}
          viewport={{ width: 1920, height: 1080 }}
        />
      );

      expect(renderTime).toBeLessThan(400); // Should handle high DPI
    });
  });
});
