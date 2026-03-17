import { useState, useEffect } from 'react';
import { auditService } from '../../services/audit.service';
import { ClipboardList, Search, Activity, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';

const actions = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'UPLOAD'];
const modules = ['citizens', 'families', 'payments', 'expenses', 'letters', 'reports', 'events', 'announcements', 'patrol', 'guestbook', 'settings', 'auth'];

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => { loadData(); }, [search, actionFilter, moduleFilter, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (actionFilter) params.action = actionFilter;
      if (moduleFilter) params.module = moduleFilter;
      const [logsRes, statsRes] = await Promise.all([
        auditService.getAll(params),
        page === 1 ? auditService.getStatistics().catch(() => null) : Promise.resolve(null),
      ]);
      setLogs(logsRes.data || []);
      setMeta(logsRes.meta);
      if (statsRes) setStats(statsRes);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    const map: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      APPROVE: 'bg-emerald-100 text-emerald-800',
      REJECT: 'bg-orange-100 text-orange-800',
      LOGIN: 'bg-purple-100 text-purple-800',
      LOGOUT: 'bg-gray-100 text-gray-800',
      EXPORT: 'bg-cyan-100 text-cyan-800',
      IMPORT: 'bg-indigo-100 text-indigo-800',
      UPLOAD: 'bg-teal-100 text-teal-800',
    };
    return map[action] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-600 mt-1">Riwayat aktivitas sistem</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Log', value: stats.total, color: 'bg-blue-100 text-blue-700', icon: ClipboardList },
            { label: '24 Jam Terakhir', value: stats.last24h, color: 'bg-green-100 text-green-700', icon: Clock },
            { label: 'Top Aksi', value: stats.byAction?.[0]?._id || '-', color: 'bg-yellow-100 text-yellow-700', icon: Activity },
            { label: 'Top Modul', value: stats.byModule?.[0]?._id || '-', color: 'bg-purple-100 text-purple-700', icon: ClipboardList },
          ].map((s) => (
            <div key={s.label} className={cn('rounded-xl p-4', s.color)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-80">{s.label}</p>
                  <p className="text-xl font-bold">{s.value || 0}</p>
                </div>
                <s.icon className="w-8 h-8 opacity-50" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Cari aktivitas..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
        </div>
        <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Semua Aksi</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Semua Modul</option>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modul</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada audit log</td></tr>
              ) : logs.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">{l.createdAt ? format(new Date(l.createdAt), 'dd/MM/yy HH:mm:ss') : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{l.userName || '-'}</div>
                    <div className="text-xs text-gray-500">{l.userRole || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getActionColor(l.action))}>{l.action}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{l.module}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{l.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-700">Halaman {page} dari {meta.totalPages} ({meta.total} total)</p>
            <div className="flex space-x-2">
              <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage(page + 1)} disabled={page >= meta.totalPages} className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
