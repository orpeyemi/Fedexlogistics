import React from 'react';
import { TrackingEvent, ShipmentStatus } from '../types';
import { CheckCircle, Truck, Package, AlertCircle } from './Icons';

interface TimelineProps {
  events: TrackingEvent[];
}

const Timeline: React.FC<TimelineProps> = ({ events }) => {
  // Sort events newest first for display
  const sortedEvents = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getIcon = (status: ShipmentStatus) => {
    switch (status) {
      case ShipmentStatus.DELIVERED: return <CheckCircle className="w-5 h-5 text-white" />;
      case ShipmentStatus.EXCEPTION: return <AlertCircle className="w-5 h-5 text-white" />;
      case ShipmentStatus.IN_TRANSIT: return <Truck className="w-5 h-5 text-white" />;
      default: return <Package className="w-5 h-5 text-white" />;
    }
  };

  const getBgColor = (status: ShipmentStatus) => {
    switch (status) {
      case ShipmentStatus.DELIVERED: return 'bg-emerald-500';
      case ShipmentStatus.EXCEPTION: return 'bg-red-500';
      case ShipmentStatus.IN_TRANSIT: return 'bg-blue-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="relative pl-4 space-y-8">
      {/* Vertical Line */}
      <div className="absolute left-[1.35rem] top-2 bottom-4 w-0.5 bg-gray-200" />

      {sortedEvents.map((event, idx) => (
        <div key={event.id} className="relative flex items-start gap-4">
          <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full shadow-sm ring-4 ring-white ${getBgColor(event.status)}`}>
            {getIcon(event.status)}
          </div>
          <div className="flex-1 pt-1.5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">{event.status}</h4>
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                <p className="text-xs text-gray-500 mt-1">{event.location}</p>
              </div>
              <time className="text-xs text-gray-400 whitespace-nowrap mt-1 sm:mt-0">
                {new Date(event.timestamp).toLocaleString(undefined, {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </time>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;