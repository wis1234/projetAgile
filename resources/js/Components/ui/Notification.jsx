import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaTimes, FaInfoCircle } from 'react-icons/fa';

const Notification = ({ type = 'info', message, onClose, autoDismiss = 5000 }) => {
  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        onClose();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="h-5 w-5" />;
      case 'error':
        return <FaExclamationCircle className="h-5 w-5" />;
      case 'warning':
        return <FaExclamationCircle className="h-5 w-5" />;
      default:
        return <FaInfoCircle className="h-5 w-5" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div 
      className={`fixed top-4 right-4 z-50 max-w-sm w-full p-4 rounded-lg shadow-lg border ${getBgColor()} ${getTextColor()} flex items-start`}
      role="alert"
    >
      <div className="flex-shrink-0 mr-3">
        {getIcon()}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="ml-4 -mx-1.5 -my-1.5 p-1.5 rounded-full inline-flex items-center justify-center h-8 w-8 hover:bg-opacity-20 hover:bg-current focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current"
        aria-label="Fermer"
      >
        <FaTimes className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Notification;
