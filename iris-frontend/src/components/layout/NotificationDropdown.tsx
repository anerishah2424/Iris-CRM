import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, X, Check, Trash2, Info, AlertTriangle } from 'lucide-react';
import api from '@/config/api';
import { formatDateTime, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data.data),
    refetchInterval: 60_000, // Poll every minute
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unread_count || 0;

  const markRead = useMutation({
    mutationFn: (id?: number) => api.post('/notifications/mark-read', { notification_id: id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteNotification = useMutation({
    mutationFn: (id: number) => api.delete(`/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-matrix-paleBlue transition-colors"
      >
        <Bell size={18} className="text-body" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-health-red text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-border z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border bg-matrix-paleBlue/30">
              <h3 className="font-bold text-matrix-navy">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markRead.mutate(undefined)}
                  className="text-[11px] font-semibold text-matrix-blue hover:underline flex items-center gap-1"
                >
                  <Check size={12} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-matrix-paleBlue rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell size={20} className="text-muted" />
                  </div>
                  <p className="text-sm text-muted">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n: any) => (
                  <div
                    key={n.notification_id}
                    className={cn(
                      'p-4 border-b border-border/50 group transition-colors relative',
                      !n.is_read ? 'bg-matrix-lightBlue/10' : 'hover:bg-gray-50'
                    )}
                  >
                    {!n.is_read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-matrix-blue" />
                    )}
                    <div className="flex gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        n.title.includes('Alert') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                      )}>
                        {n.title.includes('Alert') ? <AlertTriangle size={14} /> : <Info size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-matrix-navy truncate">{n.title}</h4>
                          <span className="text-[10px] text-muted whitespace-nowrap">{formatDateTime(n.created_at)}</span>
                        </div>
                        <p className="text-[12px] text-body mt-1 leading-normal line-clamp-3">{n.message}</p>
                        <div className="flex items-center gap-3 mt-3">
                          {!n.is_read && (
                            <button
                              onClick={() => markRead.mutate(n.notification_id)}
                              className="text-[11px] font-bold text-matrix-blue hover:underline"
                            >
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification.mutate(n.notification_id)}
                            className="text-[11px] font-bold text-muted hover:text-health-red transition-colors opacity-0 group-hover:opacity-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 bg-gray-50 border-t border-border text-center">
                <button className="text-[12px] font-semibold text-muted hover:text-matrix-navy">
                  View all activity
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
