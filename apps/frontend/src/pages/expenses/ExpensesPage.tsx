import { useState, useEffect } from 'react';
import { expensesService } from '../../services/expenses.service';
import { useAuthStore } from '../../stores/auth.store';
import { useRegionScope } from '../../hooks/useRegionScope';
import { Role } from '@shared/role.enum';
import { Plus, Search, Clock, CheckCircle, XCircle, DollarSign, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';
import Swal from 'sweetalert2';

const categories = ['Operasional', 'Infrastruktur', 'Kegiatan', 'Sosial', 'Pendidikan', 'Kesehatan', 'Keamanan', 'Lainnya'];
const createRoles = [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KAUR_KEUANGAN, Role.KEPALA_DESA, Role.KETUA_RW, Role.KETUA_RT, Role.ADMIN_RT];
const approveRoles = [Role.SUPER_ADMIN, Role.KAUR_KEUANGAN, Role.KEPALA_DESA, Role.SEKRETARIS_DESA];

export default function ExpensesPage() {
  const { user } = useAuthStore();
  const scope = useRegionScope();
  const canCreate = user && createRoles.includes(user.role);
  const canApprove = user && approveRoles.includes(user.role);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; reason: string } | null>(null);
  const [form, setForm] = useState({
    keterangan: '', kategori: 'Operasional', jumlah: 0, tanggalPengeluaran: new Date().toISOString().split('T')[0],
    penerimaNama: '', desa: user?.desa || 'Desa Sukamaju', rw: user?.rw || '', rt: user?.rt || '',
  });

  useEffect(() => { loadData(); }, [search, statusFilter, kategoriFilter, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10, ...scope };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (kategoriFilter) params.kategori = kategoriFilter;
      const [expensesRes, statsRes] = await Promise.all([
        expensesService.getAll(params),
        expensesService.getStatistics(scope).catch(() => null),
      ]);
      setExpenses(expensesRes.data || []);
      setMeta(expensesRes.meta);
      if (statsRes) setStats(statsRes);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert YYYY-MM-DD to full ISO 8601 string for backend @IsDateString() validation
      const payload = {
        ...form,
        tanggalPengeluaran: form.tanggalPengeluaran + 'T00:00:00.000Z',
      };
      await expensesService.create(payload);
      setShowForm(false);
      setForm({ keterangan: '', kategori: 'Operasional', jumlah: 0, tanggalPengeluaran: new Date().toISOString().split('T')[0], penerimaNama: '', desa: user?.desa || 'Desa Sukamaju', rw: user?.rw || '', rt: user?.rt || '' });
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pengeluaran berhasil ditambahkan', timer: 1500, showConfirmButton: false });
      loadData();
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Gagal menyimpan pengeluaran' });
    }
  };

  const handleApprove = async (id: string) => {
    const result = await Swal.fire({
      title: 'Setujui Pengeluaran?',
      text: 'Pengeluaran ini akan disetujui dan dicatat sebagai approved.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Setujui',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    try {
      await expensesService.approve(id);
      await Swal.fire({ icon: 'success', title: 'Disetujui!', text: 'Pengeluaran berhasil disetujui', timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menyetujui pengeluaran' });
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await expensesService.reject(rejectModal.id, rejectModal.reason);
      setRejectModal(null);
      await Swal.fire({ icon: 'success', title: 'Ditolak!', text: 'Pengeluaran berhasil ditolak', timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menolak pengeluaran' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus Pengeluaran?',
      text: 'Data yang dihapus tidak dapat dikembalikan!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    try {
      await expensesService.delete(id);
      await Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'Pengeluaran berhasil dihapus', timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus pengeluaran' });
    }
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Tidak Ada Data', text: 'Tidak ada data untuk diekspor' });
      return;
    }
    const headers = ['No', 'Tanggal', 'Keterangan', 'Kategori', 'Jumlah', 'Penerima', 'Status', 'Dibuat Oleh'];
    const rows = expenses.map((e, i) => [
      i + 1 + (page - 1) * 10,
      e.tanggalPengeluaran ? format(new Date(e.tanggalPengeluaran), 'dd/MM/yyyy') : '-',
      `"${(e.keterangan || '').replace(/"/g, '""')}"`,
      e.kategori || '-',
      e.jumlah || 0,
      `"${(e.penerimaNama || '-').replace(/"/g, '""')}"`,
      e.status || '-',
      `"${(e.createdByName || '-').replace(/"/g, '""')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pengeluaran_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data berhasil diekspor ke CSV', timer: 1500, showConfirmButton: false });
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      Pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Menunggu' },
      Approved: { color: 'bg-green-100 text-green-800', label: 'Disetujui' },
      Rejected: { color: 'bg-red-100 text-red-800', label: 'Ditolak' },
    };
    const s = map[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <span className={cn('px-2 py-1 rounded-full text-xs font-medium', s.color)}>{s.label}</span>;
  };

  // Generate page numbers with ellipsis
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
          <h1 className="text-3xl font-bold text-gray-900">Pengeluaran</h1>
          <p className="text-gray-600 mt-1">Kelola catatan pengeluaran desa</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={handleExportCSV} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
            <Download className="w-4 h-4 mr-2" />Export CSV
          </button>
          {canCreate && (
            <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              <Plus className="w-5 h-5 mr-2" />Tambah Pengeluaran
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Pengeluaran', value: formatCurrency(stats.totalPengeluaran || 0), color: 'bg-blue-100 text-blue-700', icon: DollarSign },
            { label: 'Disetujui', value: formatCurrency(stats.totalApproved || 0), color: 'bg-green-100 text-green-700', icon: CheckCircle },
            { label: 'Menunggu', value: formatCurrency(stats.totalPending || 0), color: 'bg-yellow-100 text-yellow-700', icon: Clock },
            { label: 'Ditolak', value: formatCurrency(stats.totalRejected || 0), color: 'bg-red-100 text-red-700', icon: XCircle },
          ].map((s) => (
            <div key={s.label} className={cn('rounded-xl p-4', s.color)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-80">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
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
          <input type="text" placeholder="Cari pengeluaran..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg">
          <option value="">Semua Status</option>
          <option value="Pending">Menunggu</option>
          <option value="Approved">Disetujui</option>
          <option value="Rejected">Ditolak</option>
        </select>
        <select value={kategoriFilter} onChange={(e) => { setKategoriFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg">
          <option value="">Semua Kategori</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Tambah Pengeluaran</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                <input type="text" value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
                <input type="number" value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: parseInt(e.target.value) || 0 })} required min={0} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <input type="date" value={form.tanggalPengeluaran} onChange={(e) => setForm({ ...form, tanggalPengeluaran: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Penerima</label>
                <input type="text" value={form.penerimaNama} onChange={(e) => setForm({ ...form, penerimaNama: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Penerima</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Belum ada data pengeluaran</td></tr>
              ) : expenses.map((e, idx) => (
                <tr key={e.id || e._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{(page - 1) * 10 + idx + 1}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{e.tanggalPengeluaran ? format(new Date(e.tanggalPengeluaran), 'dd/MM/yyyy') : '-'}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">{e.keterangan}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{e.kategori}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">{formatCurrency(e.jumlah)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{e.penerimaNama || '-'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">{getStatusBadge(e.status)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm space-x-1">
                    {canApprove && e.status === 'Pending' && (
                      <>
                        <button onClick={() => handleApprove(e.id || e._id)} className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">Setujui</button>
                        <button onClick={() => setRejectModal({ id: e.id || e._id, reason: '' })} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">Tolak</button>
                      </>
                    )}
                    {canCreate && e.status === 'Pending' && (
                      <button onClick={() => handleDelete(e.id || e._id)} className="text-red-600 hover:text-red-900 text-xs">Hapus</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Menampilkan {((page - 1) * 10) + 1} - {Math.min(page * 10, meta.total)} dari {meta.total} data
            </p>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="p-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {getPageNumbers().map((p, i) =>
                typeof p === 'string' ? (
                  <span key={`ellipsis-${i}`} className="px-2 py-1 text-gray-400 text-sm">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'px-3 py-1 border rounded-lg text-sm',
                      p === page
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    )}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= meta.totalPages}
                className="p-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Tolak Pengeluaran</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Penolakan</label>
                <textarea value={rejectModal.reason} onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Masukkan alasan penolakan..." />
              </div>
              <div className="flex justify-end space-x-3">
                <button onClick={() => setRejectModal(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
                <button onClick={handleReject} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Tolak</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
