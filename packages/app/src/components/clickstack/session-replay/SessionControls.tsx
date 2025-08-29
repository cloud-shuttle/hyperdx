import React, { useState } from 'react';
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
  Volume2,
  VolumeX,
  Settings,
  Clock,
  Zap,
  Target
} from 'lucide-react';

interface SessionControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onRestart: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  currentEventIndex: number;
  totalEvents: number;
}

export const SessionControls: React.FC<SessionControlsProps> = ({
  isPlaying,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onRestart,
  playbackSpeed,
  onSpeedChange,
  currentEventIndex,
  totalEvents,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [showSettings, setShowSettings] = useState(false);

  const progress = totalEvents > 0 ? (currentEventIndex / (totalEvents - 1)) * 100 : 0;

  const speedOptions = [
    { value: 0.25, label: '0.25x' },
    { value: 0.5, label: '0.5x' },
    { value: 1, label: '1x' },
    { value: 1.5, label: '1.5x' },
    { value: 2, label: '2x' },
    { value: 4, label: '4x' },
  ];

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>{currentEventIndex + 1} / {totalEvents}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Event {currentEventIndex + 1}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRestart}
          disabled={currentEventIndex === 0}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onSkipBack}
          disabled={currentEventIndex === 0}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        
        <Button
          variant="primary"
          size="lg"
          onClick={onPlayPause}
          className="w-12 h-12 rounded-full"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onSkipForward}
          disabled={currentEventIndex === totalEvents - 1}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Speed Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Playback Speed</span>
          <Badge variant="outline" className="text-xs">
            {playbackSpeed}x
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {speedOptions.map((option) => (
            <Button
              key={option.value}
              variant={playbackSpeed === option.value ? "primary" : "outline"}
              size="sm"
              onClick={() => onSpeedChange(option.value)}
              className="text-xs"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Playback Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Volume Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Volume</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMuteToggle}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
              <Slider
                value={[isMuted ? 0 : volume]}
                onValueChange={([value]) => handleVolumeChange(value)}
                max={1}
                step={0.1}
                className="w-full"
              />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>{Math.round((isMuted ? 0 : volume) * 100)}%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Auto-play Settings */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Auto-play on Load</span>
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  defaultChecked={false}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Loop Session</span>
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  defaultChecked={false}
                />
              </div>
            </div>

            {/* Display Settings */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Display Options</div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Show Event Indicators</span>
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  defaultChecked={true}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Show Event Details</span>
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  defaultChecked={true}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Show Performance Data</span>
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  defaultChecked={true}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 rounded p-2 text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Clock className="h-3 w-3" />
            <span className="font-medium">Events</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{totalEvents}</div>
        </div>
        <div className="bg-gray-50 rounded p-2 text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Target className="h-3 w-3" />
            <span className="font-medium">Current</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{currentEventIndex + 1}</div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="text-xs text-gray-500 space-y-1">
        <div className="font-medium">Keyboard Shortcuts:</div>
        <div className="grid grid-cols-2 gap-1">
          <div><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Space</kbd> Play/Pause</div>
          <div><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">←</kbd> Previous</div>
          <div><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">→</kbd> Next</div>
          <div><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Home</kbd> Restart</div>
        </div>
      </div>
    </div>
  );
};
