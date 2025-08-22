import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const TaskTimer = ({ dueDate }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(dueDate));
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(dueDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [dueDate]);

  function calculateTimeLeft(endDate) {
    const difference = new Date(endDate) - new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        total: difference
      };
    }

    return timeLeft;
  }

  const calculateProgress = () => {
    if (!task?.start_date || !task?.due_date) return 0;
    
    const start = new Date(task.start_date);
    const end = new Date(task.due_date);
    const now = new Date();
    
    if (now >= end) return 100;
    if (now <= start) return 0;
    
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, (elapsed / total) * 100);
  };

  const progress = calculateProgress();
  const isOverdue = timeLeft.total <= 0;
  const isDueSoon = timeLeft.total > 0 && timeLeft.total < 24 * 60 * 60 * 1000; // Moins de 24h

  const getTimerColor = () => {
    if (isOverdue) return 'text-red-500';
    if (isDueSoon) return 'text-yellow-500';
    return 'text-green-500';
  };

  const formatTime = (value) => {
    return value < 10 ? `0${value}` : value;
  };

  if (!timeLeft.days && timeLeft.days !== 0) {
    return <div className="text-gray-400">Date limite non définie</div>;
  }

  return (
    <motion.div 
      className="relative p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Barre de progression */}
      <div className="absolute top-0 left-0 h-1 bg-gray-100 dark:bg-gray-700 w-full">
        <motion.div 
          className={`h-full ${isOverdue ? 'bg-red-500' : isDueSoon ? 'bg-yellow-500' : 'bg-green-500'}`}
          initial={{ width: '0%' }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 1 }}
        />
      </div>

      <div className="flex flex-col items-center">
        <div className={`text-3xl font-bold mb-2 ${getTimerColor()}`}>
          {isOverdue ? (
            <div className="flex items-center">
              <span>Dépassé de </span>
              <span className="ml-2">
                {Math.abs(timeLeft.days)}j {formatTime(Math.abs(timeLeft.hours))}:{formatTime(Math.abs(timeLeft.minutes))}
              </span>
            </div>
          ) : (
            <div className="flex items-center">
              <span>Temps restant: </span>
              <span className="ml-2">
                {timeLeft.days > 0 ? `${timeLeft.days}j ` : ''}
                {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
              </span>
            </div>
          )}
        </div>

        {isHovered && (
          <motion.div 
            className="text-xs text-gray-500 dark:text-gray-400 mt-1"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {isOverdue 
              ? `La date limite était le ${new Date(dueDate).toLocaleDateString()}`
              : `Échéance: ${new Date(dueDate).toLocaleString()}`}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default TaskTimer;
