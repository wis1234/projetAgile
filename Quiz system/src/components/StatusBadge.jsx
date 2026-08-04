import React from 'react';
import { cn } from '@/lib/utils';

export const StatusBadge = ({ status, text }) => {
  const getStyles = () => {
    switch (status) {
      case 'success':
      case 'good':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border", getStyles())}>
      {text || status}
    </span>
  );
};