'use client';

import { useEffect, useState } from 'react';

interface TimeElapsedProps {
  startTime: string;
  live?: boolean;
  className?: string;
}

function formatElapsedTime(startTime: string): string {
  const start = new Date(startTime);
  
  if (isNaN(start.getTime())) {
    return '-';
  }

  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  
  if (diffMs < 0) {
    return '-';
  }

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    const remainingMinutes = minutes % 60;
    return `${days}d ${remainingHours}h ${remainingMinutes}m`;
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
    return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${seconds}s`;
}

export default function TimeElapsed({
  startTime,
  live = false,
  className = '',
}: TimeElapsedProps) {
  const [elapsed, setElapsed] = useState(() => formatElapsedTime(startTime));

  useEffect(() => {
    if (!live) {
      return;
    }

    // Update every second when live
    const interval = setInterval(() => {
      setElapsed(formatElapsedTime(startTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, live]);

  return (
    <span className={`font-mono text-sm ${className}`}>
      {elapsed}
    </span>
  );
}
