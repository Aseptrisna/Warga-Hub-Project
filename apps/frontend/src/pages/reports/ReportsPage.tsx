import { useState, useEffect } from 'react';
import { reportsService } from '../../services/reports.service';
import { useAuthStore } from '../../stores/auth.store';
import { canPerformAction } from '../../config/permissions';
import { useRegionScope } from '../../hooks/useRegionScope';
import { Role } from '@shared/role.enum';
import { Flag, Plus, MapPin, Clock, CheckCircle, Loader, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';
import Swal from 'sweetalert2';

const categories = ['Jalan Rusak', 'Lampu Mati', 'Sampah', 'Banjir', 'Keamanan', 'Lainnya'];

export default function ReportsPage() {
  const { user } = useAuthStore();
  const scope = useRegionScope();
  const canCreateReport = user ? canPerformAction(user.role, 'reports', 'create') : false;
  const canRespond = user ? canPerformAction(user.role, 'reports', 'respond') : false;
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [form, setForm] = useState({ judul: '', kategori: 'Jalan Rusak', deskripsi: '', lokasi: { alamat: '' } });
  const [respondForm, setRespondForm] = useState<{ id: string; status: string; tanggapan: string } | null>(null);

  useEffect(() => { loadData(); }, [search, statusFilter, page]);

  const isWarga = user?.role === Role.WARGA;

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10, ...scope };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const [reportsRes, statsRes] = await Promise.all([
        isWarga
          ? reportsService.getMy(params)
          : reportsService.getAll(params),
        canRespond ? reportsService.getStatistics(scope).catch(() => null) : Promise.resolve(null),
      ]);
      setReports(reportsRes.data || []);
      setMeta(reportsRes.meta);
      if (statsRes) setStats(statsRes);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await reportsService.create(form);
      setShowForm(false);
      setForm({ judul: '', kategori: 'Jalan Rusak', deskripsi: '', lokasi: { alamat: '' } });
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Laporan berhasil dibuat', timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal membuat laporan' });
    }
  };

  const handleUpdateStatus = async () => {
    if (!respondForm) return;
    try {
      await reportsService.updateStatus(respondForm.id, respondForm.status, respondForm.tanggapan);
      setRespondForm(null);
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Status laporan berhasil diperbarui', timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memperbarui status' });
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Menunggu' },
      in_progress: { color: 'bg-blue-100 text-blue-800', label: 'Diproses' },
      resolved: { color: 'bg-green-100 text-green-800', label: 'Selesai' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Ditolak' },
    };
    const s = map[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <span className={cn('px-2 py-1 rounded-full text-xs font-medium', s.color)}>{s.label}</span>;
  };

  const getPageNumbers = () => {
    if (!meta || meta.totalPages <= 1) return [];
    const totalPages = meta.totalPages;
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan</h1>
          <p className="text-gray-600 mt-1">Kelola laporan warga dan lingkungan</p>
        </div>
        {canCreateReport && (
          <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Plus className="w-5 h-5 mr-2" />Buat Laporan
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'bg-gray-100 text-gray-700', icon: Flag },
            { label: 'Menunggu', value: stats.pending, color: 'bg-yellow-100 text-yellow-700', icon: Clock },
            { label: 'Diproses', value: stats.inProgress, color: 'bg-blue-100 text-blue-700', icon: Loader },
            { label: 'Selesai', value: stats.resolved, color: 'bg-green-100 text-green-700', icon: CheckCircle },
          ].map((s) => (
            <div key={s.label} className={cn('rounded-xl p-4', s.color)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-80">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value || 0}</p>
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
          <input type="text" placeholder="Cari laporan..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg">
          <option value="">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="in_progress">Diproses</option>
          <option value="resolved">Selesai</option>
          <option value="rejected">Ditolak</option>
        </select>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Buat Laporan Baru</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Laporan</label>
                <input type="text" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi/Alamat</label>
                <input type="text" value={form.lokasi.alamat} onChange={(e) => setForm({ ...form, lokasi: { ...form.lokasi, alamat: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} required rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Kirim Laporan</button>
            </div>
          </form>
        </div>
      )}

      {/* Report Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">Loading...</div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">Belum ada laporan</div>
        ) : reports.map((r) => (
          <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">{r.judul}</h3>
                  {getStatusBadge(r.status)}
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">{r.kategori}</span>
                </div>
                <p className="text-sm text-gray-500">Oleh: {r.pelaporName} &middot; {r.createdAt ? format(new Date(r.createdAt), 'dd MMM yyyy HH:mm') : ''}</p>
              </div>
              {canRespond && r.status !== 'resolved' && r.status !== 'rejected' && (
                <button
                  onClick={() => setRespondForm({ id: r.id, status: 'in_progress', tanggapan: '' })}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Tanggapi
                </button>
              )}
            </div>
            <p className="text-gray-700 mb-2">{r.deskripsi}</p>
            {r.lokasi?.alamat && (
              <div className="flex items-center text-sm text-gray-500"><MapPin className="w-4 h-4 mr-1" />{r.lokasi.alamat}</div>
            )}
            {r.tanggapan && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Tanggapan: {r.respondedByName}</p>
                <p className="text-sm text-blue-700">{r.tanggapan}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-700">Halaman {page} dari {meta.totalPages} - Total {meta.total} laporan</p>
          <div className="flex items-center space-x-1">
            <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="p-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {getPageNumbers().map((p, i) =>
              typeof p === 'string' ? (
                <span key={`ellipsis-${i}`} className="px-2 py-1 text-gray-400 text-sm">...</span>
              ) : (
                <button key={p} onClick={() => setPage(p)} className={cn('px-3 py-1 border rounded-lg text-sm', p === page ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50 text-gray-700')}>{p}</button>
              )
            )}
            <button onClick={() => setPage(page + 1)} disabled={page >= meta.totalPages} className="p-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Respond Modal */}
      {respondForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Tanggapi Laporan</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={respondForm.status} onChange={(e) => setRespondForm({ ...respondForm, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="in_progress">Diproses</option>
                  <option value="resolved">Selesai</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggapan</label>
                <textarea value={respondForm.tanggapan} onChange={(e) => setRespondForm({ ...respondForm, tanggapan: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="flex justify-end space-x-3">
                <button onClick={() => setRespondForm(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
                <button onClick={handleUpdateStatus} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
