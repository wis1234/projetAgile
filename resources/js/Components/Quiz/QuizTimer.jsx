import React, { useState, useEffect } from 'react';
import { FaClock } from 'react-icons/fa';

export default function QuizTimer({ startedAt, durationMinutes, onExpire }) {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    let hasExpired = false;

    const calculateTime = () => {
      const start = new Date(startedAt).getTime();
      const durationMs = durationMinutes * 60 * 1000;
      const end = start + durationMs;
      const now = new Date().getTime();
      const remainingMs = end - now;

      if (remainingMs <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, isExpired: true });
        if (!hasExpired && onExpire) {
          hasExpired = true;
          onExpire();
        }
        return;
      }

      const totalSecs = Math.floor(remainingMs / 1000);
      const minutes = Math.floor(totalSecs / 60);
      const seconds = totalSecs % 60;

      setTimeLeft({ minutes, seconds, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [startedAt, durationMinutes, onExpire]);

  const isLowTime = timeLeft.minutes < 2;

  const formatted = `${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`;

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold text-lg border transition ${
        isLowTime
          ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 border-red-300 dark:border-red-700 animate-pulse'
          : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700'
      }`}
    >
      <FaClock />
      <span>{formatted}</span>
    </div>
  );
}
