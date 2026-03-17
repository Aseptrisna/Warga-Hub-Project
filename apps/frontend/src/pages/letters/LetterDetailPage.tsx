import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText, CheckCircle, XCircle, Clock, User, Calendar } from 'lucide-react';
import { lettersService, Letter } from '../../services/letters.service';
import { useAuthStore } from '../../stores/auth.store';

const LetterDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [letter, setLetter] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (id) {
      loadLetter();
    }
  }, [id]);

  const loadLetter = async () => {
    try {
      setLoading(true);
      const data = await lettersService.getById(id!);
      setLetter(data);
    } catch (error) {
      console.error('Failed to load letter:', error);
      alert('Gagal memuat surat');
      navigate('/letters');
    } finally {
      setLoading(false);
    }
  };

  const canApprove = () => {
    if (!letter || !user) return false;

    const rolePermissions: Record<string, string[]> = {
      pending_rt: ['KetuaRT', 'AdminRT'],
      pending_rw: ['KetuaRW', 'AdminRW'],
      pending_desa: ['KepalaDesa', 'SekretarisDesa', 'KaurUmum', 'KasiPelayanan'],
    };

    const allowedRoles = rolePermissions[letter.status];
    return allowedRoles?.includes(user.role) || false;
  };

  const handleApprove = async () => {
    if (!letter) return;

    try {
      setActionLoading(true);

      if (letter.status === 'pending_rt') {
        await lettersService.approveByRT(letter.id, { notes });
      } else if (letter.status === 'pending_rw') {
        await lettersService.approveByRW(letter.id, { notes });
      } else if (letter.status === 'pending_desa') {
        await lettersService.approveByDesa(letter.id, { notes });
      }

      setShowApprovalModal(false);
      setNotes('');
      alert('Surat berhasil disetujui!');
      loadLetter();
    } catch (error: any) {
      console.error('Failed to approve letter:', error);
      alert(error.response?.data?.message || 'Gagal menyetujui surat');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!letter || !rejectionReason.trim()) {
      alert('Alasan penolakan wajib diisi');
      return;
    }

    try {
      setActionLoading(true);
      await lettersService.reject(letter.id, { reason: rejectionReason });
      setShowRejectionModal(false);
      setRejectionReason('');
      alert('Surat telah ditolak');
      loadLetter();
    } catch (error: any) {
      console.error('Failed to reject letter:', error);
      alert(error.response?.data?.message || 'Gagal menolak surat');
    } finally {
      setActionLoading(false);
    }
  };

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
      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!letter) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/letters')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{letter.letterNumber}</h1>
            <p className="text-gray-600">{letter.templateName}</p>
          </div>
          {getStatusBadge(letter.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Letter Data */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Data Surat</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(letter.data).map(([key, value]) => (
                <div key={key}>
                  <p className="text-xs text-gray-500 mb-1">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                  </p>
                  <p className="text-sm font-medium text-gray-900">{String(value)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Approval Timeline */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Timeline Persetujuan</h2>
            <div className="space-y-4">
              {/* RT Approval */}
              <div className="flex gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  letter.approvedByRT ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {letter.approvedByRT ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Persetujuan RT</p>
                  {letter.approvedByRT ? (
                    <>
                      <p className="text-sm text-gray-600">{letter.approvedByRTName}</p>
                      <p className="text-xs text-gray-500">{letter.approvedAtRT && formatDate(letter.approvedAtRT)}</p>
                      {letter.rtNotes && <p className="text-sm text-gray-600 mt-1">"{letter.rtNotes}"</p>}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Menunggu persetujuan RT</p>
                  )}
                </div>
              </div>

              {/* RW Approval */}
              <div className="flex gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  letter.approvedByRW ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {letter.approvedByRW ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Persetujuan RW</p>
                  {letter.approvedByRW ? (
                    <>
                      <p className="text-sm text-gray-600">{letter.approvedByRWName}</p>
                      <p className="text-xs text-gray-500">{letter.approvedAtRW && formatDate(letter.approvedAtRW)}</p>
                      {letter.rwNotes && <p className="text-sm text-gray-600 mt-1">"{letter.rwNotes}"</p>}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Menunggu persetujuan RW</p>
                  )}
                </div>
              </div>

              {/* Desa Approval */}
              <div className="flex gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  letter.approvedByDesa ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {letter.approvedByDesa ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Persetujuan Desa</p>
                  {letter.approvedByDesa ? (
                    <>
                      <p className="text-sm text-gray-600">{letter.approvedByDesaName}</p>
                      <p className="text-xs text-gray-500">{letter.approvedAtDesa && formatDate(letter.approvedAtDesa)}</p>
                      {letter.desaNotes && <p className="text-sm text-gray-600 mt-1">"{letter.desaNotes}"</p>}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Menunggu persetujuan Desa</p>
                  )}
                </div>
              </div>

              {/* Rejection */}
              {letter.status === 'rejected' && (
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-red-100 text-red-600">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Ditolak</p>
                    <p className="text-sm text-gray-600">{letter.rejectedByName}</p>
                    <p className="text-xs text-gray-500">{letter.rejectedAt && formatDate(letter.rejectedAt)}</p>
                    {letter.rejectionReason && (
                      <p className="text-sm text-red-600 mt-1">"{letter.rejectionReason}"</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PDF Download */}
          {letter.pdfUrl && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Dokumen PDF</h2>
              <a
                href={`http://localhost:3000${letter.pdfUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-8 h-8 text-red-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{letter.letterNumber}.pdf</p>
                  <p className="text-xs text-gray-500">
                    Dibuat {letter.generatedAt && formatDate(letter.generatedAt)}
                  </p>
                </div>
                <Download className="w-5 h-5 text-gray-400" />
              </a>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Informasi</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Pemohon</p>
                  <p className="text-sm font-medium text-gray-900">{letter.requestedByName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Tanggal Pengajuan</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(letter.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Kode Template</p>
                  <p className="text-sm font-medium text-gray-900">{letter.templateCode}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {canApprove() && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Aksi</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowApprovalModal(true)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Setujui
                </button>
                <button
                  onClick={() => setShowRejectionModal(true)}
                  className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Tolak
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Setujui Surat</h3>
            <p className="text-sm text-gray-600 mb-4">
              Apakah Anda yakin ingin menyetujui surat ini?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan (opsional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tambahkan catatan..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Memproses...' : 'Ya, Setujui'}
              </button>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setNotes('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tolak Surat</h3>
            <p className="text-sm text-gray-600 mb-4">
              Silakan berikan alasan penolakan surat ini.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Jelaskan alasan penolakan..."
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Memproses...' : 'Ya, Tolak'}
              </button>
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LetterDetailPage;
