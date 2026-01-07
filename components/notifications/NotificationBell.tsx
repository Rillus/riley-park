'use client';

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
  isActive?: boolean;
}

export default function NotificationBell({
  unreadCount,
  onClick,
  isActive = false,
}: NotificationBellProps) {
  const displayCount = unreadCount > 99 ? '99+' : unreadCount.toString();

  return (
    <button
      onClick={onClick}
      aria-label="Notifications"
      data-active={isActive ? 'true' : 'false'}
      className={`
        relative p-2 rounded-lg transition-colors duration-150
        ${isActive
          ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
        }
      `}
    >
      <svg
        className="h-6 w-6"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {/* Badge */}
      {unreadCount > 0 && (
        <span
          data-testid="notification-badge"
          className="
            absolute -top-0.5 -right-0.5
            min-w-[18px] h-[18px]
            px-1.5
            flex items-center justify-center
            text-xs font-bold text-white
            bg-red-500
            rounded-full
            ring-2 ring-white dark:ring-gray-900
          "
        >
          {displayCount}
        </span>
      )}
    </button>
  );
}
