import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MousePointer, 
  Keyboard, 
  Eye, 
  RotateCw, 
  AlertTriangle, 
  Info,
  Filter,
  Layers,
  EyeOff,
  Download,
  Settings
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

interface SessionHeatmapProps {
  events: SessionEvent[];
  viewport: { width: number; height: number };
}

interface HeatmapPoint {
  x: number;
  y: number;
  count: number;
  type: string;
  intensity: number;
}

export const SessionHeatmap: React.FC<SessionHeatmapProps> = ({
  events,
  viewport,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [intensity, setIntensity] = useState(0.7);
  const [radius, setRadius] = useState(20);

  const heatmapData = useMemo(() => {
    const points: HeatmapPoint[] = [];
    const typeCounts: Record<string, number> = {};

    // Filter events by type
    const filteredEvents = selectedType === 'all' 
      ? events 
      : events.filter(event => event.type === selectedType);

    // Count events by type
    filteredEvents.forEach(event => {
      typeCounts[event.type] = (typeCounts[event.type] || 0) + 1;
    });

    // Group events by position
    const positionGroups: Record<string, HeatmapPoint> = {};

    filteredEvents.forEach(event => {
      if (event.data.x !== undefined && event.data.y !== undefined) {
        const key = `${Math.round(event.data.x / 10) * 10},${Math.round(event.data.y / 10) * 10}`;
        
        if (!positionGroups[key]) {
          positionGroups[key] = {
            x: event.data.x,
            y: event.data.y,
            count: 0,
            type: event.type,
            intensity: 0
          };
        }
        
        positionGroups[key].count++;
      }
    });

    // Calculate intensity and create points
    Object.values(positionGroups).forEach(point => {
      const maxCount = Math.max(...Object.values(typeCounts));
      point.intensity = (point.count / maxCount) * intensity;
      points.push(point);
    });

    return points;
  }, [events, selectedType, intensity]);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'click':
        return 'rgba(59, 130, 246, 0.8)'; // blue
      case 'input':
        return 'rgba(34, 197, 94, 0.8)'; // green
      case 'scroll':
        return 'rgba(147, 51, 234, 0.8)'; // purple
      case 'navigation':
        return 'rgba(249, 115, 22, 0.8)'; // orange
      case 'error':
        return 'rgba(239, 68, 68, 0.8)'; // red
      case 'performance':
        return 'rgba(234, 179, 8, 0.8)'; // yellow
      default:
        return 'rgba(107, 114, 128, 0.8)'; // gray
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
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
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getEventTypeStats = () => {
    const stats: Record<string, number> = {};
    events.forEach(event => {
      stats[event.type] = (stats[event.type] || 0) + 1;
    });
    return stats;
  };

  const eventStats = getEventTypeStats();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Layers className="h-5 w-5" />
          <span>Interaction Heatmap</span>
          <Badge variant="secondary">{heatmapData.length}</Badge>
        </CardTitle>
      </CardHeader>

      {/* Controls */}
      <CardContent className="pb-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="Event type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="click">Clicks</SelectItem>
              <SelectItem value="input">Input</SelectItem>
              <SelectItem value="scroll">Scroll</SelectItem>
              <SelectItem value="navigation">Navigation</SelectItem>
              <SelectItem value="error">Errors</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHeatmap(!showHeatmap)}
          >
            {showHeatmap ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showHeatmap ? 'Hide' : 'Show'}
          </Button>
        </div>

        {/* Intensity Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Intensity</span>
            <span>{Math.round(intensity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={intensity}
            onChange={(e) => setIntensity(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Radius Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Radius</span>
            <span>{radius}px</span>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </CardContent>

      {/* Heatmap Viewport */}
      <div className="flex-1 relative bg-white m-4 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
        {/* Heatmap Overlay */}
        {showHeatmap && (
          <div className="absolute inset-0 pointer-events-none">
            {heatmapData.map((point, index) => (
              <div
                key={index}
                className="absolute rounded-full opacity-60"
                style={{
                  left: `${(point.x / viewport.width) * 100}%`,
                  top: `${(point.y / viewport.height) * 100}%`,
                  width: `${radius}px`,
                  height: `${radius}px`,
                  backgroundColor: getEventTypeColor(point.type),
                  transform: 'translate(-50%, -50%)',
                  boxShadow: `0 0 ${radius}px ${radius}px ${getEventTypeColor(point.type)}`,
                  opacity: point.intensity
                }}
              />
            ))}
          </div>
        )}

        {/* Event Type Legend */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="text-sm font-medium text-gray-900 mb-2">Event Types</div>
          <div className="space-y-1">
            {Object.entries(eventStats).map(([type, count]) => (
              <div key={type} className="flex items-center space-x-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getEventTypeColor(type) }}
                />
                <span className="capitalize">{type}</span>
                <Badge variant="outline" className="text-xs">{count}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap Info */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="text-sm font-medium text-gray-900 mb-2">Heatmap Info</div>
          <div className="space-y-1 text-xs text-gray-600">
            <div>Viewport: {viewport.width} × {viewport.height}</div>
            <div>Points: {heatmapData.length}</div>
            <div>Max Intensity: {Math.max(...heatmapData.map(p => p.intensity)).toFixed(2)}</div>
          </div>
        </div>

        {/* No Data Message */}
        {heatmapData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Layers className="h-12 w-12 mx-auto mb-4" />
              <p>No interaction data available</p>
              <p className="text-sm">Try selecting a different event type</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Total Interactions:</span> {events.length}
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
