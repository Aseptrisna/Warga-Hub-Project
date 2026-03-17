import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsService } from '../../services/notifications.service';
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function NotificationBell() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const res = await notificationsService.getUnreadCount();
      setUnreadCount(res.count || 0);
    } catch {}
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationsService.getAll({ limit: 10 });
      setNotifications(res.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  const handleToggle = () => {
    if (!showDropdown) loadNotifications();
    setShowDropdown(!showDropdown);
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications(notifications.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={handleToggle} className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h4 className="font-semibold text-gray-900">Notifikasi</h4>
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-primary-600 hover:underline flex items-center">
                  <Check className="w-3 h-3 mr-1" />Baca semua
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">Belum ada notifikasi</div>
            ) : notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.isRead) handleMarkRead(n.id);
                  if (n.referenceUrl) navigate(n.referenceUrl);
                  setShowDropdown(false);
                }}
                className={cn(
                  'px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors',
                  !n.isRead && 'bg-blue-50',
                )}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">{getTypeIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm', !n.isRead ? 'font-semibold text-gray-900' : 'text-gray-700')}>{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.createdAt ? timeAgo(n.createdAt) : ''}</p>
                  </div>
                  {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />}
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
            <button onClick={() => { navigate('/notifications'); setShowDropdown(false); }} className="text-sm text-primary-600 hover:underline w-full text-center">
              Lihat semua notifikasi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
