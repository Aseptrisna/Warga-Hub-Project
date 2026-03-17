import { useState, useEffect } from 'react';
import { iuranTypesService } from '../../../services/iuran-types.service';
import { useRegionScope } from '../../../hooks/useRegionScope';
import { useAuthStore } from '../../../stores/auth.store';
import { Plus, Pencil, Trash2, X, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import Swal from 'sweetalert2';

const PERIODE_OPTIONS = ['Bulanan', 'Tahunan', 'Insidental'];
const SCOPE_OPTIONS = [
  { value: 'desa', label: 'Desa' },
  { value: 'rw', label: 'RW' },
  { value: 'rt', label: 'RT' },
];
const PER_PAGE = 10;

const emptyForm = {
  nama: '',
  jumlah: '',
  periode: 'Bulanan',
  keterangan: '',
  scopeLevel: 'desa',
  rw: '',
  rt: '',
};

export default function IuranSetupTab() {
  const scope = useRegionScope();
  const user = useAuthStore((s) => s.user);
  const [iuranTypes, setIuranTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Search
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [page, search]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await iuranTypesService.getAll({ ...scope, limit: PER_PAGE, page, search: search || undefined });
      setIuranTypes(res.data || []);
      setTotal(res.meta?.total || 0);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (error) {
      console.error('Error loading iuran types:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      nama: item.nama,
      jumlah: String(item.jumlah),
      periode: item.periode,
      keterangan: item.keterangan || '',
      scopeLevel: item.scopeLevel,
      rw: item.rw || '',
      rt: item.rt || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload: any = {
        nama: form.nama,
        jumlah: Number(form.jumlah),
        periode: form.periode,
        keterangan: form.keterangan || undefined,
        scopeLevel: form.scopeLevel,
        desa: user?.desa || scope.desa,
      };

      if (form.scopeLevel === 'rw' || form.scopeLevel === 'rt') {
        payload.rw = form.rw || user?.rw || scope.rw;
      }
      if (form.scopeLevel === 'rt') {
        payload.rt = form.rt || user?.rt || scope.rt;
      }

      if (editingId) {
        await iuranTypesService.update(editingId, payload);
      } else {
        await iuranTypesService.create(payload);
      }

      setShowForm(false);
      loadData();
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: editingId ? 'Jenis iuran berhasil diperbarui' : 'Jenis iuran berhasil ditambahkan',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error('Error saving iuran type:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: error?.response?.data?.message || 'Terjadi kesalahan saat menyimpan jenis iuran',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus Jenis Iuran?',
      text: 'Data yang dihapus tidak dapat dikembalikan!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    try {
      await iuranTypesService.delete(id);
      loadData();
      Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'Jenis iuran berhasil dihapus', timer: 2000, showConfirmButton: false });
    } catch (error: any) {
      console.error('Error deleting iuran type:', error);
      Swal.fire({ icon: 'error', title: 'Gagal!', text: error?.response?.data?.message || 'Gagal menghapus jenis iuran' });
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const res = await iuranTypesService.getAll({ ...scope, limit: 9999 });
      const allData: any[] = res.data || [];
      if (allData.length === 0) {
        Swal.fire({ icon: 'info', title: 'Data Kosong', text: 'Tidak ada data jenis iuran untuk diexport' });
        return;
      }

      const headers = ['No', 'Nama Iuran', 'Jumlah (Rp)', 'Periode', 'Scope', 'Detail Scope', 'Status', 'Keterangan'];
      const rows = allData.map((item, idx) => [
        idx + 1,
        `"${item.nama}"`,
        item.jumlah,
        item.periode,
        item.scopeLevel === 'desa' ? 'Desa' : item.scopeLevel === 'rw' ? 'RW' : 'RT',
        item.scopeLevel === 'rt' ? `RT ${item.rt} / RW ${item.rw}` : item.scopeLevel === 'rw' ? `RW ${item.rw}` : 'Seluruh Desa',
        item.isActive ? 'Aktif' : 'Nonaktif',
        `"${item.keterangan || '-'}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Laporan_Jenis_Iuran_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      Swal.fire({ icon: 'success', title: 'Export Berhasil!', text: `${allData.length} data berhasil diexport ke CSV`, timer: 2000, showConfirmButton: false });
    } catch (error) {
      console.error('Error exporting:', error);
      Swal.fire({ icon: 'error', title: 'Gagal!', text: 'Terjadi kesalahan saat export data' });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const getScopeBadge = (item: any) => {
    if (item.scopeLevel === 'rt') return `RT ${item.rt}`;
    if (item.scopeLevel === 'rw') return `RW ${item.rw}`;
    return 'Desa';
  };

  const getScopeBadgeColor = (level: string) => {
    switch (level) {
      case 'desa': return 'bg-blue-100 text-blue-800';
      case 'rw': return 'bg-purple-100 text-purple-800';
      case 'rt': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const startItem = (page - 1) * PER_PAGE + 1;
  const endItem = Math.min(page * PER_PAGE, total);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Jenis Iuran</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari jenis iuran..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-52 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 text-sm font-medium"
            title="Export CSV"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : iuranTypes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search ? 'Tidak ada data yang cocok dengan pencarian.' : 'Belum ada jenis iuran. Klik "Tambah" untuk memulai.'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12">No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Periode</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Scope</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {iuranTypes.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-500 text-center">{startItem + idx}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{item.nama}</div>
                        {item.keterangan && <div className="text-xs text-gray-500">{item.keterangan}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(item.jumlah)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {item.periode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScopeBadgeColor(item.scopeLevel)}`}>
                          {getScopeBadge(item)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {item.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                Menampilkan <span className="font-medium">{startItem}</span>-<span className="font-medium">{endItem}</span> dari <span className="font-medium">{total}</span> data
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | string)[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    typeof p === 'string' ? (
                      <span key={`dot-${i}`} className="px-2 text-gray-400">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`min-w-[36px] h-9 rounded-lg border text-sm font-medium ${
                          p === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 text-gray-600 hover:bg-white'
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Jenis Iuran' : 'Tambah Jenis Iuran'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Iuran</label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Contoh: Iuran Kebersihan"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
                <input
                  type="number"
                  value={form.jumlah}
                  onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="50000"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Periode</label>
                <select
                  value={form.periode}
                  onChange={(e) => setForm({ ...form, periode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {PERIODE_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scope Level</label>
                <select
                  value={form.scopeLevel}
                  onChange={(e) => setForm({ ...form, scopeLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {SCOPE_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {(form.scopeLevel === 'rw' || form.scopeLevel === 'rt') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomor RW</label>
                  <input
                    type="text"
                    value={form.rw}
                    onChange={(e) => setForm({ ...form, rw: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="01"
                  />
                </div>
              )}

              {form.scopeLevel === 'rt' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomor RT</label>
                  <input
                    type="text"
                    value={form.rt}
                    onChange={(e) => setForm({ ...form, rt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="03"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan (opsional)</label>
                <textarea
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  rows={2}
                  placeholder="Keterangan tambahan..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  {saving ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
