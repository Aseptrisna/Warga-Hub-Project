import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { familiesService } from '../../services/families.service';
import { useAuthStore } from '../../stores/auth.store';
import { canPerformAction } from '../../config/permissions';
import { useRegionScope } from '../../hooks/useRegionScope';
import { Users, Plus, Search, Home, UserCheck, UserX, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import Swal from 'sweetalert2';

export default function FamiliesPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const canCreate = user ? canPerformAction(user.role, 'families', 'create') : false;
  const canEdit = user ? canPerformAction(user.role, 'families', 'edit') : false;
  const canDelete = user ? canPerformAction(user.role, 'families', 'delete') : false;
  const [families, setFamilies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);

  const isPlatformRole = user && ['SuperAdmin', 'AdminPlatform'].includes(user.role);

  const [form, setForm] = useState({
    noKk: '', kepalaKeluargaNama: '', alamat: '',
    rt: (!isPlatformRole && user?.rt) || '',
    rw: (!isPlatformRole && user?.rw) || '',
    desa: (!isPlatformRole && user?.desa) || '',
    kecamatan: '', kabupaten: '', provinsi: '',
  });

  const scope = useRegionScope();

  useEffect(() => { loadData(); }, [search, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10, ...scope };
      if (search) params.search = search;
      const [familiesRes, statsRes] = await Promise.all([
        familiesService.getAll(params),
        familiesService.getStatistics(scope).catch(() => null),
      ]);
      setFamilies(familiesRes.data || []);
      setMeta(familiesRes.meta);
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
      if (editingId) {
        await familiesService.update(editingId, form);
      } else {
        await familiesService.create(form);
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: editingId ? 'Kartu keluarga berhasil diperbarui' : 'Kartu keluarga berhasil ditambahkan', timer: 1500, showConfirmButton: false });
      loadData();
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Gagal menyimpan data' });
    }
  };

  const resetForm = () => {
    setForm({
      noKk: '', kepalaKeluargaNama: '', alamat: '',
      rt: (!isPlatformRole && user?.rt) || '',
      rw: (!isPlatformRole && user?.rw) || '',
      desa: (!isPlatformRole && user?.desa) || '',
      kecamatan: '', kabupaten: '', provinsi: '',
    });
  };

  const handleEdit = (family: any) => {
    setForm({
      noKk: family.noKk,
      kepalaKeluargaNama: family.kepalaKeluargaNama,
      alamat: family.alamat,
      rt: family.rt,
      rw: family.rw,
      desa: family.desa,
      kecamatan: family.kecamatan || '',
      kabupaten: family.kabupaten || '',
      provinsi: family.provinsi || '',
    });
    setEditingId(family.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string, nama: string) => {
    const result = await Swal.fire({
      title: 'Hapus Kartu Keluarga?',
      text: `Data KK "${nama}" akan dihapus permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    try {
      await familiesService.delete(id);
      await Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'Kartu keluarga berhasil dihapus', timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus data' });
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

  const scopedField = !isPlatformRole;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kartu Keluarga</h1>
          <p className="text-gray-600 mt-1">Kelola data kartu keluarga warga</p>
        </div>
        {canCreate && (
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); resetForm(); }} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Plus className="w-5 h-5 mr-2" />Tambah KK
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total KK', value: stats.totalKeluarga, color: 'bg-blue-100 text-blue-700', icon: Home },
            { label: 'Total Anggota', value: stats.totalAnggota, color: 'bg-green-100 text-green-700', icon: Users },
            { label: 'KK Aktif', value: stats.aktif, color: 'bg-emerald-100 text-emerald-700', icon: UserCheck },
            { label: 'KK Tidak Aktif', value: stats.tidakAktif, color: 'bg-red-100 text-red-700', icon: UserX },
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

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Cari No. KK, nama kepala keluarga, alamat..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Kartu Keluarga' : 'Tambah Kartu Keluarga'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. KK (16 digit)</label>
                <input type="text" value={form.noKk} onChange={(e) => setForm({ ...form, noKk: e.target.value })} required maxLength={16} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kepala Keluarga</label>
                <input type="text" value={form.kepalaKeluargaNama} onChange={(e) => setForm({ ...form, kepalaKeluargaNama: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <input type="text" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RT</label>
                <input type="text" value={form.rt} onChange={(e) => setForm({ ...form, rt: e.target.value })} required readOnly={scopedField && !!user?.rt} className={cn('w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500', scopedField && user?.rt && 'bg-gray-100 cursor-not-allowed')} />
                {scopedField && user?.rt && <p className="text-xs text-gray-400 mt-1">Otomatis sesuai wilayah Anda</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RW</label>
                <input type="text" value={form.rw} onChange={(e) => setForm({ ...form, rw: e.target.value })} required readOnly={scopedField && !!user?.rw} className={cn('w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500', scopedField && user?.rw && 'bg-gray-100 cursor-not-allowed')} />
                {scopedField && user?.rw && <p className="text-xs text-gray-400 mt-1">Otomatis sesuai wilayah Anda</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desa</label>
                <input type="text" value={form.desa} onChange={(e) => setForm({ ...form, desa: e.target.value })} required readOnly={scopedField && !!user?.desa} className={cn('w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500', scopedField && user?.desa && 'bg-gray-100 cursor-not-allowed')} />
                {scopedField && user?.desa && <p className="text-xs text-gray-400 mt-1">Otomatis sesuai wilayah Anda</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label>
                <input type="text" value={form.kecamatan} onChange={(e) => setForm({ ...form, kecamatan: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kabupaten</label>
                <input type="text" value={form.kabupaten} onChange={(e) => setForm({ ...form, kabupaten: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label>
                <input type="text" value={form.provinsi} onChange={(e) => setForm({ ...form, provinsi: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{editingId ? 'Perbarui' : 'Simpan'}</button>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. KK</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kepala Keluarga</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alamat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RT/RW</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Anggota</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : families.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Belum ada data kartu keluarga</td></tr>
              ) : families.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{f.noKk}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{f.kepalaKeluargaNama}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{f.alamat}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{f.rt}/{f.rw}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{f.jumlahAnggota} orang</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', f.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                      {f.isActive ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                    <button onClick={() => navigate(`/families/${f.id}`)} className="text-blue-600 hover:text-blue-900"><Eye className="w-4 h-4 inline" /></button>
                    {canEdit && (
                      <button onClick={() => handleEdit(f)} className="text-yellow-600 hover:text-yellow-900">Edit</button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDelete(f.id, f.kepalaKeluargaNama)} className="text-red-600 hover:text-red-900">Hapus</button>
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
            <p className="text-sm text-gray-700">
              Menampilkan {((page - 1) * meta.limit) + 1} - {Math.min(page * meta.limit, meta.total)} dari {meta.total} data
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
    </div>
  );
}
