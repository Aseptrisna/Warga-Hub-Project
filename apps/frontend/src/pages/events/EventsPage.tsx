import { useState, useEffect } from 'react';
import { eventsService } from '../../services/events.service';
import { useAuthStore } from '../../stores/auth.store';
import { canPerformAction } from '../../config/permissions';
import { useRegionScope } from '../../hooks/useRegionScope';
import { Calendar, Plus, MapPin, Users, Trash2, UserPlus, UserMinus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';
import Swal from 'sweetalert2';

const eventCategories = ['Kerja Bakti', 'Rapat', 'Perayaan', 'Olahraga', 'Sosial', 'Lainnya'];

export default function EventsPage() {
  const { user } = useAuthStore();
  const scope = useRegionScope();
  const canCreate = user ? canPerformAction(user.role, 'events', 'create') : false;
  const canDeleteEvent = user ? canPerformAction(user.role, 'events', 'delete') : false;
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [form, setForm] = useState({
    namaAcara: '', deskripsi: '', kategori: 'Kerja Bakti',
    tanggalMulai: '', tanggalSelesai: '', lokasi: '', kapasitas: 0,
  });

  useEffect(() => { loadData(); }, [statusFilter, search, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10, ...scope };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await eventsService.getAll(params);
      setEvents(res.data || []);
      setMeta(res.meta);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await eventsService.create({ ...form, kapasitas: Number(form.kapasitas) });
      setShowForm(false);
      setForm({ namaAcara: '', deskripsi: '', kategori: 'Kerja Bakti', tanggalMulai: '', tanggalSelesai: '', lokasi: '', kapasitas: 0 });
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Event berhasil dibuat', timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal membuat event' });
    }
  };

  const handleRegister = async (id: string) => {
    try {
      await eventsService.register(id);
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Berhasil mendaftar event', timer: 1500, showConfirmButton: false });
      loadData();
    } catch (e: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: e.response?.data?.message || 'Gagal mendaftar' });
    }
  };

  const handleUnregister = async (id: string) => {
    try {
      await eventsService.unregister(id);
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pendaftaran dibatalkan', timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal membatalkan' });
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    const result = await Swal.fire({
      title: 'Hapus Event?',
      text: `Event "${nama}" akan dihapus permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    try {
      await eventsService.delete(id);
      await Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'Event berhasil dihapus', timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus' });
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      upcoming: { color: 'bg-blue-100 text-blue-800', label: 'Akan Datang' },
      ongoing: { color: 'bg-green-100 text-green-800', label: 'Berlangsung' },
      completed: { color: 'bg-gray-100 text-gray-800', label: 'Selesai' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Dibatalkan' },
    };
    const s = map[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <span className={cn('px-2 py-1 rounded-full text-xs font-medium', s.color)}>{s.label}</span>;
  };

  const isRegistered = (event: any) => event.peserta?.some((p: any) => p.userId === user?.id);

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
          <h1 className="text-3xl font-bold text-gray-900">Event & Kegiatan</h1>
          <p className="text-gray-600 mt-1">Kelola event dan kegiatan warga</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Plus className="w-5 h-5 mr-2" />Buat Event
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Cari event..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg">
          <option value="">Semua Status</option>
          <option value="upcoming">Akan Datang</option>
          <option value="ongoing">Berlangsung</option>
          <option value="completed">Selesai</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Buat Event Baru</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Acara</label>
                <input type="text" value={form.namaAcara} onChange={(e) => setForm({ ...form, namaAcara: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} required rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {eventCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                <input type="text" value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                <input type="datetime-local" value={form.tanggalMulai} onChange={(e) => setForm({ ...form, tanggalMulai: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai</label>
                <input type="datetime-local" value={form.tanggalSelesai} onChange={(e) => setForm({ ...form, tanggalSelesai: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kapasitas (0 = unlimited)</label>
                <input type="number" value={form.kapasitas} onChange={(e) => setForm({ ...form, kapasitas: parseInt(e.target.value) || 0 })} min={0} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Buat Event</button>
            </div>
          </form>
        </div>
      )}

      {/* Event Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">Loading...</div>
        ) : events.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">Belum ada event</div>
        ) : events.map((ev) => (
          <div key={ev.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">{ev.namaAcara}</h3>
                  {getStatusBadge(ev.status)}
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">{ev.kategori}</span>
              </div>
              {canDeleteEvent && (
                <button onClick={() => handleDelete(ev.id, ev.namaAcara)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-gray-700 text-sm mb-3">{ev.deskripsi}</p>
            <div className="space-y-1.5 text-sm text-gray-600 mb-4">
              <div className="flex items-center"><Calendar className="w-4 h-4 mr-2" />{ev.tanggalMulai ? format(new Date(ev.tanggalMulai), 'dd MMM yyyy HH:mm') : ''} - {ev.tanggalSelesai ? format(new Date(ev.tanggalSelesai), 'dd MMM yyyy HH:mm') : ''}</div>
              <div className="flex items-center"><MapPin className="w-4 h-4 mr-2" />{ev.lokasi}</div>
              <div className="flex items-center"><Users className="w-4 h-4 mr-2" />{ev.peserta?.length || 0} peserta {ev.kapasitas > 0 ? `/ ${ev.kapasitas}` : ''}</div>
              <div className="text-xs text-gray-400">Penyelenggara: {ev.penyelenggaraName}</div>
            </div>
            {ev.status === 'upcoming' && (
              <div>
                {isRegistered(ev) ? (
                  <button onClick={() => handleUnregister(ev.id)} className="inline-flex items-center px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                    <UserMinus className="w-4 h-4 mr-1" />Batalkan Pendaftaran
                  </button>
                ) : (
                  <button onClick={() => handleRegister(ev.id)} className="inline-flex items-center px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    <UserPlus className="w-4 h-4 mr-1" />Daftar
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-700">Halaman {page} dari {meta.totalPages} - Total {meta.total} event</p>
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
