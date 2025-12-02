import React from 'react';
import { ShipmentStatus } from '../types';

interface StatusBadgeProps {
  status: ShipmentStatus;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStyles = (s: ShipmentStatus) => {
    switch (s) {
      case ShipmentStatus.DELIVERED:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case ShipmentStatus.OUT_FOR_DELIVERY:
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case ShipmentStatus.IN_TRANSIT:
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case ShipmentStatus.PICKED_UP:
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case ShipmentStatus.CREATED:
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case ShipmentStatus.EXCEPTION:
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyles(status)} ${className}`}>
      {status}
    </span>
  );
};

export default StatusBadge;