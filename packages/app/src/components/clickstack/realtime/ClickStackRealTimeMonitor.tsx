import React from 'react';

interface ClickStackRealTimeMonitorProps {
  teamId: string;
  onAlert: (alert: any) => void;
}

export const ClickStackRealTimeMonitor: React.FC<ClickStackRealTimeMonitorProps> = ({ teamId, onAlert }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">ClickStack Real-Time Monitor</h2>
      <p className="text-gray-600">Real-time monitoring dashboard for team: {teamId}</p>
    </div>
  );
};
