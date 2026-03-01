'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link?: string | null;
  createdAt: string;
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=5');
      const data = await response.json();

      if (response.ok) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };


  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-11 w-11 rounded-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5 text-[#1D1D1F]/60" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#007AFF] rounded-full"></span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute -right-2 sm:right-0 top-14 w-[calc(100vw-1rem)] sm:w-96 max-w-[380px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-apple-lg z-50">
          <div className="p-4 sm:p-6 border-b border-black/5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-sm font-medium"
                >
                  Tout marquer comme lu
                </Button>
              )}
            </div>
            <p className="text-sm text-[#1D1D1F]/60">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-12 text-center">
                <p className="text-base text-[#1D1D1F]/60">Chargement...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-base text-[#1D1D1F]/60">
                  Aucune notification
                </p>
              </div>
            ) : (
              <div className="divide-y divide-black/5">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-6 transition-colors cursor-pointer hover:bg-black/5 ${!notification.read ? 'bg-black/2' : ''
                      }`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      if (notification.link) {
                        window.location.href = notification.link;
                      }
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p
                              className={`text-base font-semibold mb-2 ${notification.read ? 'text-[#1D1D1F]/50' : 'text-[#1D1D1F]'
                                }`}
                            >
                              {notification.title}
                            </p>
                            <p
                              className={`text-sm mb-2 line-clamp-2 ${notification.read ? 'text-[#1D1D1F]/50' : 'text-[#1D1D1F]/70'
                                }`}
                            >
                              {notification.message}
                            </p>
                            <p className="text-xs text-[#1D1D1F]/50">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-[#007AFF] rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-black/5">
            <Link
              href="/notifications"
              className="block text-center text-base font-medium text-[#007AFF] hover:text-[#0056CC] transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Voir toutes les notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
