import { useState, useEffect } from 'react';
import { guestbookService } from '../../services/guestbook.service';
import { useAuthStore } from '../../stores/auth.store';
import { canPerformAction } from '../../config/permissions';
import { useRegionScope } from '../../hooks/useRegionScope';
import { BookOpen, Plus, Search, LogIn, LogOut as LogOutIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';
import Swal from 'sweetalert2';

export default function GuestbookPage() {
  const { user } = useAuthStore();
  const scope = useRegionScope();
  const canCreate = user ? canPerformAction(user.role, 'guestbook', 'create') : false;
  const canCheckout = user ? canPerformAction(user.role, 'guestbook', 'checkout') : false;
  const canDeleteEntry = user ? canPerformAction(user.role, 'guestbook', 'delete') : false;
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [form, setForm] = useState({
    namaTamu: '', nik: '', noTelp: '', alamatAsal: '', tujuan: '', yangDitemui: '',
    waktuMasuk: new Date().toISOString().slice(0, 16),
    desa: user?.desa || '', rw: user?.rw || '', rt: user?.rt || '',
  });

  useEffect(() => { loadData(); }, [search, statusFilter, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10, ...scope };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const [entriesRes, statsRes] = await Promise.all([
        guestbookService.getAll(params),
        guestbookService.getStatistics(scope).catch(() => null),
      ]);
      setEntries(entriesRes.data || []);
      setMeta(entriesRes.meta);
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
      await guestbookService.create(form);
      setShowForm(false);
      setForm({ namaTamu: '', nik: '', noTelp: '', alamatAsal: '', tujuan: '', yangDitemui: '', waktuMasuk: new Date().toISOString().slice(0, 16), desa: user?.desa || '', rw: user?.rw || '', rt: user?.rt || '' });
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Tamu berhasil dicatat', timer: 1500, showConfirmButton: false });
      loadData();
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Gagal menyimpan' });
    }
  };

  const handleCheckout = async (id: string, nama: string) => {
    try {
      await guestbookService.checkout(id);
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: `${nama} berhasil checkout`, timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal checkout' });
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    const result = await Swal.fire({
      title: 'Hapus Data Tamu?',
      text: `Data tamu "${nama}" akan dihapus permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    try {
      await guestbookService.delete(id);
      await Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'Data buku tamu berhasil dihapus', timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus' });
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Buku Tamu</h1>
          <p className="text-gray-600 mt-1">Pencatatan tamu yang berkunjung</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Plus className="w-5 h-5 mr-2" />Catat Tamu
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Kunjungan', value: stats.total, color: 'bg-blue-100 text-blue-700', icon: BookOpen },
            { label: 'Masih di Lokasi', value: stats.masuk, color: 'bg-yellow-100 text-yellow-700', icon: LogIn },
            { label: 'Sudah Keluar', value: stats.keluar, color: 'bg-green-100 text-green-700', icon: LogOutIcon },
            { label: 'Hari Ini', value: stats.hariIni, color: 'bg-purple-100 text-purple-700', icon: Clock },
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
          <input type="text" placeholder="Cari tamu..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg">
          <option value="">Semua Status</option>
          <option value="Masuk">Masih di Lokasi</option>
          <option value="Keluar">Sudah Keluar</option>
        </select>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Catat Tamu Baru</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Tamu *</label>
                <input type="text" value={form.namaTamu} onChange={(e) => setForm({ ...form, namaTamu: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIK</label>
                <input type="text" value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} maxLength={16} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. Telp</label>
                <input type="text" value={form.noTelp} onChange={(e) => setForm({ ...form, noTelp: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Asal</label>
                <input type="text" value={form.alamatAsal} onChange={(e) => setForm({ ...form, alamatAsal: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan *</label>
                <input type="text" value={form.tujuan} onChange={(e) => setForm({ ...form, tujuan: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yang Ditemui</label>
                <input type="text" value={form.yangDitemui} onChange={(e) => setForm({ ...form, yangDitemui: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Masuk *</label>
                <input type="datetime-local" value={form.waktuMasuk} onChange={(e) => setForm({ ...form, waktuMasuk: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Tamu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alamat Asal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tujuan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yang Ditemui</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu Masuk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu Keluar</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">Belum ada data buku tamu</td></tr>
              ) : entries.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{e.namaTamu}</div>
                    {e.noTelp && <div className="text-xs text-gray-500">{e.noTelp}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-[150px] truncate">{e.alamatAsal || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-[200px] truncate">{e.tujuan}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{e.yangDitemui || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{e.waktuMasuk ? format(new Date(e.waktuMasuk), 'dd/MM/yy HH:mm') : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{e.waktuKeluar ? format(new Date(e.waktuKeluar), 'dd/MM/yy HH:mm') : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', e.status === 'Masuk' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800')}>
                      {e.status === 'Masuk' ? 'Di Lokasi' : 'Keluar'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-1">
                    {canCheckout && e.status === 'Masuk' && (
                      <button onClick={() => handleCheckout(e.id, e.namaTamu)} className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">Checkout</button>
                    )}
                    {canDeleteEntry && (
                      <button onClick={() => handleDelete(e.id, e.namaTamu)} className="text-red-600 hover:text-red-900 text-xs">Hapus</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination with page numbers */}
        {meta && meta.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-700">Menampilkan {((page - 1) * meta.limit) + 1} - {Math.min(page * meta.limit, meta.total)} dari {meta.total}</p>
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
      </div>
    </div>
  );
}
