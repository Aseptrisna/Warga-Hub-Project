import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Search, Filter, Download, Eye, CheckCircle, XCircle, Clock, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { lettersService, Letter } from '../../services/letters.service';
import { useAuthStore } from '../../stores/auth.store';
import { canPerformAction } from '../../config/permissions';
import { useRegionScope } from '../../hooks/useRegionScope';
import { Role } from '@shared/role.enum';
import { cn } from '../../utils/cn';

const LettersListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const scope = useRegionScope();
  const canCreate = user ? canPerformAction(user.role, 'letters', 'create') : false;
  const canManageTemplate = user ? canPerformAction(user.role, 'letters', 'template') : false;
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);

  const isWarga = user?.role === Role.WARGA;

  const loadLetters = async () => {
    try {
      setLoading(true);
      const response = isWarga
        ? await lettersService.getMy({
            status: statusFilter || undefined,
            page,
            limit: 20,
          })
        : await lettersService.getAll({
            search: search || undefined,
            status: statusFilter || undefined,
            page,
            limit: 20,
            ...scope,
          });
      setLetters(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error('Failed to load letters:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLetters();
  }, [search, statusFilter, page]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
      pending_rt: { label: 'Menunggu RT', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved_rt: { label: 'Disetujui RT', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      pending_rw: { label: 'Menunggu RW', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved_rw: { label: 'Disetujui RW', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      pending_desa: { label: 'Menunggu Desa', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { label: 'Selesai', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: Clock };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const canApprove = (letter: Letter) => {
    if (!user) return false;

    const rolePermissions: Record<string, string[]> = {
      pending_rt: ['KetuaRT', 'AdminRT'],
      pending_rw: ['KetuaRW', 'AdminRW'],
      pending_desa: ['KepalaDesa', 'SekretarisDesa', 'KaurUmum', 'KasiPelayanan'],
    };

    const allowedRoles = rolePermissions[letter.status];
    return allowedRoles?.includes(user.role) || false;
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Surat Menyurat</h1>
            <p className="text-sm text-gray-600 mt-1">
              Kelola permohonan dan persetujuan surat warga
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canManageTemplate && (
              <button
                onClick={() => navigate('/letters/templates')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Template
              </button>
            )}
            {canCreate && (
              <button
                onClick={() => navigate('/letters/request')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajukan Surat
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari nomor surat..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">Semua Status</option>
              <option value="pending_rt">Menunggu RT</option>
              <option value="pending_rw">Menunggu RW</option>
              <option value="pending_desa">Menunggu Desa</option>
              <option value="approved">Selesai</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
        </div>
      </div>

      {/* Letters List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : letters.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada surat</h3>
          <p className="text-sm text-gray-600">
            {search || statusFilter ? 'Tidak ada surat yang sesuai filter' : 'Belum ada surat yang diajukan'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {letters.map((letter) => (
            <div
              key={letter.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{letter.letterNumber}</h3>
                    {getStatusBadge(letter.status)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {letter.templateName} • {letter.requestedByName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Diajukan {formatDate(letter.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {letter.pdfUrl && (
                    <a
                      href={`http://localhost:3000${letter.pdfUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => navigate(`/letters/${letter.id}`)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Lihat Detail"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Workflow Timeline */}
              <div className="flex items-center gap-2 text-xs">
                <div className={`flex items-center gap-1 ${letter.approvedByRT ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="w-3 h-3" />
                  <span>RT</span>
                </div>
                <div className="flex-1 h-0.5 bg-gray-200">
                  <div className={`h-full transition-all ${letter.approvedByRT ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
                <div className={`flex items-center gap-1 ${letter.approvedByRW ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="w-3 h-3" />
                  <span>RW</span>
                </div>
                <div className="flex-1 h-0.5 bg-gray-200">
                  <div className={`h-full transition-all ${letter.approvedByRW ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
                <div className={`flex items-center gap-1 ${letter.approvedByDesa ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="w-3 h-3" />
                  <span>Desa</span>
                </div>
              </div>

              {/* Action Button */}
              {canApprove(letter) && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => navigate(`/letters/${letter.id}/approve`)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Proses Persetujuan →
                  </button>
                </div>
              )}

              {/* Rejection Info */}
              {letter.status === 'rejected' && letter.rejectionReason && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs font-medium text-red-900 mb-1">Alasan Penolakan:</p>
                  <p className="text-xs text-red-700">{letter.rejectionReason}</p>
                  <p className="text-xs text-red-600 mt-1">
                    Ditolak oleh {letter.rejectedByName} • {letter.rejectedAt && formatDate(letter.rejectedAt)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination with page numbers */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-600">
            Halaman {meta.page} dari {meta.totalPages} - Total {meta.total} surat
          </p>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
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
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LettersListPage;
