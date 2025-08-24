import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  MousePointer, 
  Keyboard, 
  Eye, 
  RotateCw, 
  AlertTriangle, 
  Info,
  Search,
  Filter,
  Play,
  Pause,
  SkipBack,
  SkipForward
} from 'lucide-react';

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

interface SessionTimelineProps {
  events: SessionEvent[];
  currentEventIndex: number;
  onEventSelect: (index: number) => void;
  onEventHover?: (index: number) => void;
}

export const SessionTimeline: React.FC<SessionTimelineProps> = ({
  events,
  currentEventIndex,
  onEventSelect,
  onEventHover,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showDetails, setShowDetails] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<number | null>(null);

  const filteredEvents = useMemo(() => {
    return events.filter((event, index) => {
      const matchesSearch = searchTerm === '' || 
        event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.data.element?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.data.value?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.metadata.pageUrl.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'all' || event.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [events, searchTerm, typeFilter]);

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

  const formatTimestamp = (timestamp: number) => {
    const seconds = Math.floor(timestamp / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEventDescription = (event: SessionEvent) => {
    switch (event.type) {
      case 'click':
        return `Clicked on ${event.data.element || 'element'} at (${event.data.x}, ${event.data.y})`;
      case 'input':
        return `Typed "${event.data.value}" in ${event.data.element || 'input field'}`;
      case 'scroll':
        return `Scrolled to position (${event.data.x}, ${event.data.y})`;
      case 'navigation':
        return `Navigated to ${event.data.url || 'new page'}`;
      case 'error':
        return `Error: ${event.data.error}`;
      case 'performance':
        return `Load: ${event.data.performance?.loadTime}ms, Response: ${event.data.performance?.responseTime}ms`;
      default:
        return 'Unknown event';
    }
  };

  const handleEventClick = (index: number) => {
    onEventSelect(index);
  };

  const handleEventHover = (index: number) => {
    setHoveredEvent(index);
    onEventHover?.(index);
  };

  const handleEventLeave = () => {
    setHoveredEvent(null);
  };

  const jumpToEvent = (direction: 'prev' | 'next') => {
    const currentEvent = events[currentEventIndex];
    if (!currentEvent) return;

    let targetIndex = -1;
    if (direction === 'prev') {
      for (let i = currentEventIndex - 1; i >= 0; i--) {
        if (filteredEvents.includes(events[i])) {
          targetIndex = i;
          break;
        }
      }
    } else {
      for (let i = currentEventIndex + 1; i < events.length; i++) {
        if (filteredEvents.includes(events[i])) {
          targetIndex = i;
          break;
        }
      }
    }

    if (targetIndex !== -1) {
      onEventSelect(targetIndex);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Event Timeline</span>
          <Badge variant="secondary">{filteredEvents.length}</Badge>
        </CardTitle>
      </CardHeader>

      {/* Filters */}
      <CardContent className="pb-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="click">Clicks</SelectItem>
              <SelectItem value="input">Input</SelectItem>
              <SelectItem value="scroll">Scroll</SelectItem>
              <SelectItem value="navigation">Navigation</SelectItem>
              <SelectItem value="error">Errors</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => jumpToEvent('prev')}
              disabled={currentEventIndex === 0}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => jumpToEvent('next')}
              disabled={currentEventIndex === events.length - 1}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
        </div>
      </CardContent>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-2">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4" />
              <p>No events match your filters</p>
            </div>
          ) : (
            filteredEvents.map((event, index) => {
              const originalIndex = events.indexOf(event);
              const isCurrent = originalIndex === currentEventIndex;
              const isHovered = hoveredEvent === originalIndex;

              return (
                <div
                  key={event.id}
                  className={`relative p-3 rounded-lg border cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                      : isHovered
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleEventClick(originalIndex)}
                  onMouseEnter={() => handleEventHover(originalIndex)}
                  onMouseLeave={handleEventLeave}
                >
                  {/* Event Indicator */}
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full ${getEventColor(event.type)} text-white flex items-center justify-center`}>
                      {getEventIcon(event.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {event.type}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {formatTimestamp(event.timestamp)}
                          </Badge>
                          {isCurrent && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          #{originalIndex + 1}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        {getEventDescription(event)}
                      </p>

                      {/* Event Details */}
                      {showDetails && (
                        <div className="space-y-2 text-xs text-gray-500">
                          {event.data.element && (
                            <div>
                              <span className="font-medium">Element:</span> {event.data.element}
                            </div>
                          )}
                          {event.data.x !== undefined && event.data.y !== undefined && (
                            <div>
                              <span className="font-medium">Position:</span> ({event.data.x}, {event.data.y})
                            </div>
                          )}
                          {event.data.url && (
                            <div>
                              <span className="font-medium">URL:</span> {event.data.url}
                            </div>
                          )}
                          {event.data.error && (
                            <div className="text-red-600">
                              <span className="font-medium">Error:</span> {event.data.error}
                            </div>
                          )}
                          {event.data.performance && (
                            <div>
                              <span className="font-medium">Performance:</span> Load: {event.data.performance.loadTime}ms, Response: {event.data.performance.responseTime}ms
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Page:</span> {event.metadata.pageUrl}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline Connector */}
                  {index < filteredEvents.length - 1 && (
                    <div className="absolute left-4 top-8 w-0.5 h-6 bg-gray-200" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 border-t bg-gray-50">
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
          <div>
            <span className="font-medium">Total Events:</span> {events.length}
          </div>
          <div>
            <span className="font-medium">Filtered:</span> {filteredEvents.length}
          </div>
          <div>
            <span className="font-medium">Current:</span> {currentEventIndex + 1}
          </div>
          <div>
            <span className="font-medium">Duration:</span> {events.length > 0 ? formatTimestamp(events[events.length - 1].timestamp) : '0:00'}
          </div>
        </div>
      </div>
    </div>
  );
};
