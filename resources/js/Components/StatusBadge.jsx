import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'validated':
        return {
          text: 'Validé',
          bg: 'bg-green-100 dark:bg-green-900',
          textColor: 'text-green-800 dark:text-green-200',
          icon: 'check-circle'
        };
      case 'rejected':
        return {
          text: 'Rejeté',
          bg: 'bg-red-100 dark:bg-red-900',
          textColor: 'text-red-800 dark:text-red-200',
          icon: 'times-circle'
        };
      default:
        return {
          text: 'En attente',
          bg: 'bg-yellow-100 dark:bg-yellow-900',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          icon: 'clock'
        };
    }
  };

  const { text, bg, textColor, icon } = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${bg} ${textColor}`}>
      {text}
    </span>
  );
};

export default StatusBadge;
