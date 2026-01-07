'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/lib/notifications/useNotifications';
import NotificationBell from './NotificationBell';
import NotificationDropdown from './NotificationDropdown';

interface NotificationCenterProps {
  /**
   * Polling interval in milliseconds. Default: 5000 (5 seconds)
   */
  pollInterval?: number;
}

export default function NotificationCenter({
  pollInterval = 5000,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    dismiss,
    clearAll,
  } = useNotifications({ pollInterval });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleBellClick = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <NotificationBell
        unreadCount={unreadCount}
        onClick={handleBellClick}
        isActive={isOpen}
      />

      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          loading={loading}
          onMarkAsRead={markAsRead}
          onDismiss={dismiss}
          onClearAll={clearAll}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
