import { useState, useEffect } from 'react';
import { announcementsService } from '../../services/announcements.service';
import { useAuthStore } from '../../stores/auth.store';
import { canPerformAction } from '../../config/permissions';
import { useRegionScope } from '../../hooks/useRegionScope';
import { Plus, Pin, Trash2, Calendar, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';
import Swal from 'sweetalert2';

export default function AnnouncementsPage() {
  const { user } = useAuthStore();
  const scope = useRegionScope();
  const canCreate = user ? canPerformAction(user.role, 'announcements', 'create') : false;
  const canPin = user ? canPerformAction(user.role, 'announcements', 'pin') : false;
  const canDelete = user ? canPerformAction(user.role, 'announcements', 'delete') : false;
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [formData, setFormData] = useState({
    judul: '',
    isi: '',
    kategori: 'Umum',
    targetDesa: '',
    targetRW: '',
    targetRT: '',
  });

  useEffect(() => { loadAnnouncements(); }, [search, page]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10, ...scope };
      if (search) params.search = search;
      const response = await announcementsService.getAll(params);
      setAnnouncements(response.data || []);
      setMeta(response.meta);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await announcementsService.create(formData);
      setShowForm(false);
      setFormData({ judul: '', isi: '', kategori: 'Umum', targetDesa: '', targetRW: '', targetRT: '' });
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pengumuman berhasil dibuat', timer: 1500, showConfirmButton: false });
      loadAnnouncements();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal membuat pengumuman' });
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      await announcementsService.togglePin(id);
      loadAnnouncements();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal pin/unpin pengumuman' });
    }
  };

  const handleDelete = async (id: string, judul: string) => {
    const result = await Swal.fire({
      title: 'Hapus Pengumuman?',
      text: `Pengumuman "${judul}" akan dihapus permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    try {
      await announcementsService.delete(id);
      await Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'Pengumuman berhasil dihapus', timer: 1500, showConfirmButton: false });
      loadAnnouncements();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus pengumuman' });
    }
  };

  const getKategoriColor = (kategori: string) => {
    switch (kategori) {
      case 'Penting': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Mendesak': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
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
          <h1 className="text-3xl font-bold text-gray-900">Pengumuman</h1>
          <p className="text-gray-600 mt-1">Kelola pengumuman warga</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Buat Pengumuman
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Cari pengumuman..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Buat Pengumuman Baru</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
                <input
                  type="text"
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Isi Pengumuman</label>
                <textarea
                  value={formData.isi}
                  onChange={(e) => setFormData({ ...formData, isi: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="Umum">Umum</option>
                  <option value="Penting">Penting</option>
                  <option value="Mendesak">Mendesak</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Desa</label>
                <input
                  type="text"
                  value={formData.targetDesa}
                  onChange={(e) => setFormData({ ...formData, targetDesa: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Kosongkan untuk semua"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Buat Pengumuman</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">Belum ada pengumuman</div>
        ) : (
          announcements.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 ${item.isPinned ? 'border-primary-500' : 'border-gray-200'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {item.isPinned && <Pin className="w-5 h-5 text-primary-600" />}
                  <h3 className="text-xl font-semibold text-gray-900">{item.judul}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getKategoriColor(item.kategori)}`}>
                    {item.kategori}
                  </span>
                </div>
                <div className="flex space-x-2">
                  {canPin && (
                    <button
                      onClick={() => handleTogglePin(item.id)}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                      title={item.isPinned ? 'Unpin' : 'Pin'}
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(item.id, item.judul)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-gray-700 mb-3 whitespace-pre-line">{item.isi}</p>
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {item.createdAt ? format(new Date(item.createdAt), 'dd MMM yyyy HH:mm') : '-'}
                </div>
                <div>Oleh: {item.createdByName}</div>
                {item.targetDesa && <div>Target: {item.targetDesa} {item.targetRW && `RW ${item.targetRW}`} {item.targetRT && `RT ${item.targetRT}`}</div>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Halaman {page} dari {meta.totalPages} - Total {meta.total} pengumuman
          </p>
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
  );
}
