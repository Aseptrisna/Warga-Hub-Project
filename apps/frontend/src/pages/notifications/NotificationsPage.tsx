import { useState, useEffect } from 'react';
import { notificationsService } from '../../services/notifications.service';
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => { loadData(); }, [page, filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (filter) params.isRead = filter;
      const res = await notificationsService.getAll(params);
      setNotifications(res.data || []);
      setMeta(res.meta);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications(notifications.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifikasi</h1>
          <p className="text-gray-600 mt-1">Semua notifikasi Anda</p>
        </div>
        <div className="flex space-x-3">
          <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">Semua</option>
            <option value="false">Belum Dibaca</option>
            <option value="true">Sudah Dibaca</option>
          </select>
          <button onClick={handleMarkAllRead} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
            <Check className="w-4 h-4 mr-2" />Baca Semua
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada notifikasi</p>
          </div>
        ) : notifications.map((n) => (
          <div
            key={n.id}
            className={cn(
              'bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow',
              !n.isRead && 'border-l-4 border-l-blue-500 bg-blue-50/30',
            )}
          >
            <div className="flex items-start space-x-4">
              <div className="mt-0.5">{getTypeIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className={cn('text-sm', !n.isRead ? 'font-semibold text-gray-900' : 'text-gray-700')}>{n.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                    <div className="flex items-center space-x-3 mt-2">
                      {n.module && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{n.module}</span>}
                      <span className="text-xs text-gray-400">{n.createdAt ? format(new Date(n.createdAt), 'dd MMM yyyy HH:mm') : ''}</span>
                    </div>
                  </div>
                  {!n.isRead && (
                    <button onClick={() => handleMarkRead(n.id)} className="text-xs text-primary-600 hover:underline whitespace-nowrap ml-2">
                      Tandai dibaca
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-700">Halaman {page} dari {meta.totalPages}</p>
          <div className="flex space-x-2">
            <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50">Prev</button>
            <button onClick={() => setPage(page + 1)} disabled={page >= meta.totalPages} className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
