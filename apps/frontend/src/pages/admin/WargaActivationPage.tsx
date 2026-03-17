import { useState, useEffect } from 'react';
import { UserCheck, UserX, Search, Clock, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { cn } from '../../utils/cn';
import { format } from 'date-fns';
import api from '../../services/api';
import Swal from 'sweetalert2';

interface PendingUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  nik?: string;
  desa?: string;
  rw?: string;
  rt?: string;
  citizenName?: string;
  createdAt: string;
}

export default function WargaActivationPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [search, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      const response = await api.get('/users/pending-activation', { params });
      setUsers(response.data.data || []);
      setMeta(response.data.meta || null);
    } catch (error) {
      console.error('Failed to load pending activations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (user: PendingUser) => {
    const result = await Swal.fire({
      title: 'Aktifkan Akun?',
      html: `Anda yakin ingin mengaktifkan akun <b>${user.name}</b>?<br/><small>NIK: ${user.nik || '-'}</small>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      confirmButtonText: 'Ya, Aktifkan',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    try {
      setProcessing(user.id);
      await api.post(`/users/${user.id}/activate`);
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: `Akun ${user.name} berhasil diaktifkan`,
        timer: 1500,
        showConfirmButton: false,
      });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengaktifkan akun' });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (user: PendingUser) => {
    const result = await Swal.fire({
      title: 'Tolak Pendaftaran?',
      html: `Anda yakin ingin menolak pendaftaran <b>${user.name}</b>?<br/><small>NIK: ${user.nik || '-'}</small>`,
      icon: 'warning',
      input: 'textarea',
      inputLabel: 'Alasan penolakan (opsional)',
      inputPlaceholder: 'Masukkan alasan penolakan...',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Ya, Tolak',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    try {
      setProcessing(user.id);
      await api.post(`/users/${user.id}/reject-activation`, { reason: result.value || '' });
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: `Pendaftaran ${user.name} ditolak`,
        timer: 1500,
        showConfirmButton: false,
      });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menolak pendaftaran' });
    } finally {
      setProcessing(null);
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
          <h1 className="text-3xl font-bold text-gray-900">Aktivasi Warga</h1>
          <p className="text-gray-600 mt-1">Verifikasi dan aktifkan akun warga yang baru mendaftar</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau NIK..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading...
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada pendaftaran menunggu</h3>
            <p className="text-sm text-gray-500">Semua pendaftaran warga sudah diproses</p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                    <div className="mt-1 space-y-1">
                      {user.nik && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">NIK:</span> {user.nik}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span> {user.email}
                      </p>
                      {user.phone && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Telepon:</span> {user.phone}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        {user.desa && <span>{user.desa}</span>}
                        {user.rw && <span> / RW {user.rw}</span>}
                        {user.rt && <span> / RT {user.rt}</span>}
                      </p>
                      <p className="text-xs text-gray-400">
                        Mendaftar: {format(new Date(user.createdAt), 'dd MMM yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleReject(user)}
                    disabled={processing === user.id}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 text-sm font-medium"
                  >
                    <UserX className="w-4 h-4 mr-1.5" />
                    Tolak
                  </button>
                  <button
                    onClick={() => handleActivate(user)}
                    disabled={processing === user.id}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                  >
                    <UserCheck className="w-4 h-4 mr-1.5" />
                    Aktifkan
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Halaman {page} dari {meta.totalPages} - Total {meta.total} pendaftaran
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
  );
}
