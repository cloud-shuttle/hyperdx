import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Eye,
  Clock,
  MousePointer,
  Keyboard,
  Hand,
  AlertTriangle,
  Info,
  Settings,
  Download
} from 'lucide-react';

import { SessionTimeline } from './SessionTimeline';
import { SessionHeatmap } from './SessionHeatmap';
import { SessionControls } from './SessionControls';

interface SessionReplayPlayerProps {
  teamId: string;
  sessionId: string;
  onClose?: () => void;
}

interface SessionEvent {
  id: string;
  timestamp: number;
  type: 'click' | 'scroll' | 'input' | 'navigation' | 'error' | 'performance';
  data: {
    x?: number;
    y?: number;
    element?: string;
    value?: string;
    url?: string;
    error?: string;
    performance?: {
      loadTime: number;
      responseTime: number;
    };
  };
  metadata: {
    pageUrl: string;
    userAgent: string;
    viewport: { width: number; height: number };
  };
}

interface SessionData {
  id: string;
  userId: string;
  startTime: string;
  endTime: string;
  duration: number;
  events: SessionEvent[];
  metadata: {
    device: string;
    browser: string;
    os: string;
    country: string;
    city: string;
    ip: string;
  };
  performance: {
    avgLoadTime: number;
    avgResponseTime: number;
    errors: number;
    conversions: boolean;
  };
}

export const SessionReplayPlayer: React.FC<SessionReplayPlayerProps> = ({
  teamId,
  sessionId,
  onClose,
}) => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const playbackRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/clickstack/sessions/${sessionId}/replay`);
        
        if (response.ok) {
          const data = await response.json();
          setSessionData(data);
        } else {
          throw new Error('Failed to fetch session data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session data');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId]);

  useEffect(() => {
    if (isPlaying && sessionData) {
      const playNextEvent = () => {
        if (currentEventIndex < sessionData.events.length - 1) {
          setCurrentEventIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      };

      const currentEvent = sessionData.events[currentEventIndex];
      const nextEvent = sessionData.events[currentEventIndex + 1];
      
      if (currentEvent && nextEvent) {
        const timeDiff = nextEvent.timestamp - currentEvent.timestamp;
        const playbackDelay = timeDiff / playbackSpeed;

        playbackRef.current = setTimeout(playNextEvent, playbackDelay);
      }

      return () => {
        if (playbackRef.current) {
          clearTimeout(playbackRef.current);
        }
      };
    }
  }, [isPlaying, currentEventIndex, sessionData, playbackSpeed]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkipBack = () => {
    setCurrentEventIndex(Math.max(0, currentEventIndex - 10));
  };

  const handleSkipForward = () => {
    if (sessionData) {
      setCurrentEventIndex(Math.min(sessionData.events.length - 1, currentEventIndex + 10));
    }
  };

  const handleRestart = () => {
    setCurrentEventIndex(0);
    setIsPlaying(false);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
  };

  const handleTimelineSeek = (index: number) => {
    setCurrentEventIndex(index);
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        containerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'click':
        return <MousePointer className="h-4 w-4" />;
      case 'input':
        return <Keyboard className="h-4 w-4" />;
      case 'scroll':
        return <Eye className="h-4 w-4" />;
      case 'navigation':
        return <RotateCw className="h-4 w-4" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'performance':
        return <Clock className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'click':
        return 'bg-blue-500';
      case 'input':
        return 'bg-green-500';
      case 'scroll':
        return 'bg-purple-500';
      case 'navigation':
        return 'bg-orange-500';
      case 'error':
        return 'bg-red-500';
      case 'performance':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return formatDuration(timestamp / 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Session</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Session Not Found</h3>
          <p className="text-gray-600">The requested session could not be found.</p>
        </div>
      </div>
    );
  }

  const currentEvent = sessionData.events[currentEventIndex];
  const progress = sessionData.events.length > 0 ? (currentEventIndex / (sessionData.events.length - 1)) * 100 : 0;

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <Card className="rounded-none border-b">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Session Replay</span>
                  <Badge variant="outline">{sessionId.substring(0, 8)}...</Badge>
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  User: {sessionData.userId} • Duration: {formatDuration(sessionData.duration)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHeatmap(!showHeatmap)}
              >
                {showHeatmap ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                Heatmap
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTimeline(!showTimeline)}
              >
                {showTimeline ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                Timeline
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFullscreen}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Session Viewport */}
        <div className="flex-1 flex flex-col">
          {/* Viewport Header */}
          <div className="bg-white border-b p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Current Event:</span> {currentEventIndex + 1} of {sessionData.events.length}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Time:</span> {currentEvent ? formatTimestamp(currentEvent.timestamp) : '0:00'}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Page:</span> {currentEvent?.metadata.pageUrl || 'N/A'}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {sessionData.metadata.device}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {sessionData.metadata.browser}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {sessionData.metadata.country}
                </Badge>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          {/* Session Viewport */}
          <div className="flex-1 bg-white m-4 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden">
            {currentEvent ? (
              <div className="text-center">
                <div className="mb-4">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getEventColor(currentEvent.type)} text-white mb-2`}>
                    {getEventIcon(currentEvent.type)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">
                    {currentEvent.type} Event
                  </h3>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  {currentEvent.data.x !== undefined && currentEvent.data.y !== undefined && (
                    <div>Position: ({currentEvent.data.x}, {currentEvent.data.y})</div>
                  )}
                  {currentEvent.data.element && (
                    <div>Element: {currentEvent.data.element}</div>
                  )}
                  {currentEvent.data.value && (
                    <div>Value: {currentEvent.data.value}</div>
                  )}
                  {currentEvent.data.url && (
                    <div>URL: {currentEvent.data.url}</div>
                  )}
                  {currentEvent.data.error && (
                    <div className="text-red-600">Error: {currentEvent.data.error}</div>
                  )}
                  {currentEvent.data.performance && (
                    <div>
                      Load: {currentEvent.data.performance.loadTime}ms, 
                      Response: {currentEvent.data.performance.responseTime}ms
                    </div>
                  )}
                </div>

                {/* Event Indicator */}
                {currentEvent.data.x !== undefined && currentEvent.data.y !== undefined && (
                  <div 
                    className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse"
                    style={{
                      left: `${(currentEvent.data.x / currentEvent.metadata.viewport.width) * 100}%`,
                      top: `${(currentEvent.data.y / currentEvent.metadata.viewport.height) * 100}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <Eye className="h-12 w-12 mx-auto mb-4" />
                <p>No events to replay</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white border-l flex flex-col">
          {/* Controls */}
          <div className="p-4 border-b">
            <SessionControls
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onSkipBack={handleSkipBack}
              onSkipForward={handleSkipForward}
              onRestart={handleRestart}
              playbackSpeed={playbackSpeed}
              onSpeedChange={handleSpeedChange}
              currentEventIndex={currentEventIndex}
              totalEvents={sessionData.events.length}
            />
          </div>

          {/* Timeline */}
          {showTimeline && (
            <div className="flex-1 overflow-hidden">
              <SessionTimeline
                events={sessionData.events}
                currentEventIndex={currentEventIndex}
                onEventSelect={handleTimelineSeek}
                onEventHover={(index) => {
                  // Handle event hover for preview
                }}
              />
            </div>
          )}

          {/* Heatmap */}
          {showHeatmap && (
            <div className="flex-1 overflow-hidden">
              <SessionHeatmap
                events={sessionData.events}
                viewport={currentEvent?.metadata.viewport || { width: 1920, height: 1080 }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Performance:</span> 
              Avg Load: {sessionData.performance.avgLoadTime}ms, 
              Avg Response: {sessionData.performance.avgResponseTime}ms
            </div>
            <div>
              <span className="font-medium">Errors:</span> {sessionData.performance.errors}
            </div>
            <div>
              <span className="font-medium">Conversion:</span> 
              {sessionData.performance.conversions ? (
                <Badge className="bg-green-100 text-green-800">Yes</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">No</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
