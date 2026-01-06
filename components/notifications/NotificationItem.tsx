'use client';

import Link from 'next/link';
import { NotificationData, NotificationType } from '@/lib/workflow/types';

interface NotificationItemProps {
  notification: NotificationData;
  onMarkRead?: (id: string) => void;
}

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
  step_completed: (
    <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  step_failed: (
    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  workflow_completed: (
    <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  step_started: (
    <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationItem({
  notification,
  onMarkRead,
}: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.read && onMarkRead) {
      onMarkRead(notification.id);
    }
  };

  const content = (
    <div
      className={`flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors cursor-pointer ${
        !notification.read ? 'bg-blue-50' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mt-0.5">
        {NOTIFICATION_ICONS[notification.type]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm ${
              !notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'
            }`}
          >
            {notification.title}
          </p>
          <span className="flex-shrink-0 text-xs text-gray-500">
            {formatTimeAgo(new Date(notification.createdAt))}
          </span>
        </div>

        <p className="mt-0.5 text-sm text-gray-600 line-clamp-2">
          {notification.message}
        </p>

        {notification.actionLabel && notification.actionUrl && (
          <Link
            href={notification.actionUrl}
            className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            {notification.actionLabel}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      {!notification.read && (
        <div className="flex-shrink-0">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
        </div>
      )}
    </div>
  );

  if (notification.actionUrl && !notification.actionLabel) {
    return (
      <Link href={notification.actionUrl} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
