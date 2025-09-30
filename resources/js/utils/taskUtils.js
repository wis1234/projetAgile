import { useTranslation } from 'react-i18next';
import { FaClock, FaPlay, FaCheckCircle, FaPause, FaQuestionCircle } from 'react-icons/fa';
import { FaArrowUp, FaArrowDown, FaEquals } from 'react-icons/fa';

export const getStatusInfo = (status, t) => {
  const statusMap = {
    // English statuses
    'todo': { 
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      icon: <FaClock className="mr-1.5" />,
      text: t('status_todo')
    },
    'in_progress': { 
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      icon: <FaPlay className="mr-1.5" />,
      text: t('status_in_progress')
    },
    'done': { 
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      icon: <FaCheckCircle className="mr-1.5" />,
      text: t('status_done')
    },
    'pending': { 
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      icon: <FaPause className="mr-1.5" />,
      text: t('status_pending')
    },
    // French statuses
    'nouveau': { 
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      icon: <FaClock className="mr-1.5" />,
      text: t('status_new')
    },
    'en_cours': { 
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      icon: <FaPlay className="mr-1.5" />,
      text: t('status_in_progress')
    },
    'termine': { 
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      icon: <FaCheckCircle className="mr-1.5" />,
      text: t('status_done')
    },
    'en_attente': { 
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      icon: <FaPause className="mr-1.5" />,
      text: t('status_pending')
    },
  };

  return statusMap[status] || { 
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    icon: <FaQuestionCircle className="mr-1.5" />,
    text: status
  };
};

export const getPriorityInfo = (priority, t) => {
  const priorityMap = {
    'high': {
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      icon: <FaArrowUp className="mr-1.5" />,
      text: t('priority_high')
    },
    'medium': {
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      icon: <FaEquals className="mr-1.5" />,
      text: t('priority_medium')
    },
    'low': {
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      icon: <FaArrowDown className="mr-1.5" />,
      text: t('priority_low')
    },
    'haute': {
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      icon: <FaArrowUp className="mr-1.5" />,
      text: t('priority_high')
    },
    'moyenne': {
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      icon: <FaEquals className="mr-1.5" />,
      text: t('priority_medium')
    },
    'basse': {
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      icon: <FaArrowDown className="mr-1.5" />,
      text: t('priority_low')
    }
  };

  return priorityMap[priority] || {
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    icon: <FaQuestionCircle className="mr-1.5" />,
    text: priority
  };
};
