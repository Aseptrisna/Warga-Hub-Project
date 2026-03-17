import { useState, useEffect } from 'react';
import { paymentsService } from '../../../services/payments.service';
import { useRegionScope } from '../../../hooks/useRegionScope';
import { useAuthStore } from '../../../stores/auth.store';
import { canPerformAction } from '../../../config/permissions';
import { Role } from '@shared/role.enum';
import { DollarSign, Clock, CheckCircle, XCircle, Upload, Eye, X, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import Swal from 'sweetalert2';

const MONTHS = [
  { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
  { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
];

const STATUS_OPTIONS = ['Belum Bayar', 'Menunggu Verifikasi', 'Lunas', 'Ditolak'];
const PER_PAGE = 10;

export default function PaymentListTab() {
  const scope = useRegionScope();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user ? canPerformAction(user.role, 'payments', 'verify') : false;
  const isWarga = user?.role === Role.WARGA;

  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [filterBulan, setFilterBulan] = useState<string>('');
  const [filterTahun, setFilterTahun] = useState<string>(String(new Date().getFullYear()));
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [search, setSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Upload modal
  const [uploadModal, setUploadModal] = useState<{ show: boolean; paymentId: string | null }>({ show: false, paymentId: null });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Verify modal
  const [verifyModal, setVerifyModal] = useState<{ show: boolean; payment: any | null }>({ show: false, payment: null });
  const [rejectReason, setRejectReason] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Preview bukti
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [filterBulan, filterTahun, filterStatus, search, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = { ...scope, limit: PER_PAGE, page };
      if (filterBulan) params.bulan = filterBulan;
      if (filterTahun) params.tahun = filterTahun;
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;

      const [paymentsRes, statsRes] = await Promise.all([
        isWarga
          ? paymentsService.getMy(params)
          : paymentsService.getAll(params),
        paymentsService.getStatistics({ ...scope, bulan: filterBulan || undefined, tahun: filterTahun || undefined }),
      ]);
      setPayments(paymentsRes.data || []);
      setTotal(paymentsRes.meta?.total || 0);
      setTotalPages(paymentsRes.meta?.totalPages || 1);
      setStats(statsRes);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Lunas': return 'bg-green-100 text-green-800 border-green-200';
      case 'Menunggu Verifikasi': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Belum Bayar': return 'bg-red-100 text-red-800 border-red-200';
      case 'Ditolak': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const handleUpload = async () => {
    if (!uploadModal.paymentId || !uploadFile) return;
    try {
      setUploading(true);
      await paymentsService.uploadBukti(uploadModal.paymentId, uploadFile);
      setUploadModal({ show: false, paymentId: null });
      setUploadFile(null);
      loadData();
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Bukti pembayaran berhasil diupload. Menunggu verifikasi admin.',
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error('Error uploading bukti:', error);
      Swal.fire({
        icon: 'error',
        title: 'Upload Gagal!',
        text: error?.response?.data?.message || 'Terjadi kesalahan saat mengupload bukti pembayaran',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleVerify = async (status: 'Lunas' | 'Ditolak') => {
    if (!verifyModal.payment) return;

    if (status === 'Ditolak' && !rejectReason.trim()) {
      Swal.fire({ icon: 'warning', title: 'Perhatian', text: 'Mohon isi alasan penolakan terlebih dahulu' });
      return;
    }

    const confirm = await Swal.fire({
      title: status === 'Lunas' ? 'Terima Pembayaran?' : 'Tolak Pembayaran?',
      text: status === 'Lunas'
        ? `Verifikasi pembayaran ${verifyModal.payment.citizenName} sebagai lunas?`
        : `Tolak pembayaran ${verifyModal.payment.citizenName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: status === 'Lunas' ? '#16a34a' : '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: status === 'Lunas' ? 'Ya, Terima' : 'Ya, Tolak',
      cancelButtonText: 'Batal',
    });
    if (!confirm.isConfirmed) return;

    try {
      setVerifying(true);
      await paymentsService.verify(verifyModal.payment.id, {
        status,
        rejectionReason: status === 'Ditolak' ? rejectReason : undefined,
      });
      setVerifyModal({ show: false, payment: null });
      setRejectReason('');
      loadData();
      Swal.fire({
        icon: 'success',
        title: status === 'Lunas' ? 'Diverifikasi!' : 'Ditolak!',
        text: status === 'Lunas'
          ? 'Pembayaran berhasil diverifikasi sebagai lunas'
          : 'Pembayaran berhasil ditolak',
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: error?.response?.data?.message || 'Terjadi kesalahan saat memverifikasi pembayaran',
      });
    } finally {
      setVerifying(false);
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const params: any = { ...scope, limit: 9999 };
      if (filterBulan) params.bulan = filterBulan;
      if (filterTahun) params.tahun = filterTahun;
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;

      const res = await paymentsService.getAll(params);
      const allData: any[] = res.data || [];
      if (allData.length === 0) {
        Swal.fire({ icon: 'info', title: 'Data Kosong', text: 'Tidak ada data pembayaran untuk diexport' });
        return;
      }

      const headers = ['No', 'Nama Warga', 'NIK', 'RT', 'RW', 'Jenis Iuran', 'Bulan', 'Tahun', 'Jumlah (Rp)', 'Dibayar (Rp)', 'Status', 'Tgl Bayar', 'Verifikator'];
      const rows = allData.map((p, idx) => [
        idx + 1,
        `"${p.citizenName}"`,
        `"${p.nik}"`,
        p.rt,
        p.rw,
        `"${p.iuranTypeName || p.jenis || '-'}"`,
        MONTHS.find((m) => m.value === p.bulan)?.label || p.bulan,
        p.tahun,
        p.jumlah,
        p.jumlahDibayar || 0,
        p.status,
        p.tanggalBayar ? new Date(p.tanggalBayar).toLocaleDateString('id-ID') : '-',
        `"${p.verifiedByName || '-'}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const periodLabel = filterBulan ? `${MONTHS[parseInt(filterBulan) - 1]?.label}_` : '';
      link.download = `Laporan_Pembayaran_${periodLabel}${filterTahun || 'All'}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      Swal.fire({ icon: 'success', title: 'Export Berhasil!', text: `${allData.length} data berhasil diexport ke CSV`, timer: 2000, showConfirmButton: false });
    } catch (error) {
      console.error('Error exporting:', error);
      Swal.fire({ icon: 'error', title: 'Gagal!', text: 'Terjadi kesalahan saat export data' });
    }
  };

  const apiBaseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

  const startItem = (page - 1) * PER_PAGE + 1;
  const endItem = Math.min(page * PER_PAGE, total);

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Tagihan</span>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalTagihan || 0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Lunas</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.totalLunas || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Menunggu Verifikasi</span>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">{stats.totalMenunggu || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Belum Bayar</span>
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.totalBelumBayar || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Cari nama warga..."
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-56 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          value={filterBulan}
          onChange={(e) => { setFilterBulan(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Bulan</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <input
          type="number"
          value={filterTahun}
          onChange={(e) => { setFilterTahun(e.target.value); setPage(1); }}
          placeholder="Tahun"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-24 focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="ml-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 text-sm font-medium"
            title="Export CSV"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Belum ada data pembayaran</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12">No</th>
                    {!isWarga && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis Iuran</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Periode</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Bukti</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((payment, idx) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-500 text-center">{startItem + idx}</td>
                      {!isWarga && (
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{payment.citizenName}</div>
                          <div className="text-xs text-gray-500">RT {payment.rt} / RW {payment.rw}</div>
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-gray-900">{payment.iuranTypeName || payment.jenis}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 text-center">
                        {MONTHS.find((m) => m.value === payment.bulan)?.label || payment.bulan}/{payment.tahun}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(payment.jumlah)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {payment.buktiBayarUrl ? (
                          <button
                            onClick={() => setPreviewUrl(`${apiBaseUrl}${payment.buktiBayarUrl}`)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Lihat bukti"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {(payment.status === 'Belum Bayar' || payment.status === 'Ditolak') && (isWarga || isAdmin) && (
                            <button
                              onClick={() => setUploadModal({ show: true, paymentId: payment.id })}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium flex items-center gap-1"
                            >
                              <Upload className="w-3.5 h-3.5" /> Bayar
                            </button>
                          )}
                          {payment.status === 'Menunggu Verifikasi' && isAdmin && (
                            <button
                              onClick={() => setVerifyModal({ show: true, payment })}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium"
                            >
                              Verifikasi
                            </button>
                          )}
                          {payment.status === 'Ditolak' && payment.rejectionReason && (
                            <span className="text-xs text-red-500" title={payment.rejectionReason}>
                              Alasan: {payment.rejectionReason}
                            </span>
                          )}
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

      {/* Upload Bukti Modal */}
      {uploadModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Upload Bukti Pembayaran</h3>
              <button onClick={() => { setUploadModal({ show: false, paymentId: null }); setUploadFile(null); }} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih file bukti pembayaran</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-1 text-xs text-gray-500">Format: JPG, PNG, PDF. Maks 5MB</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setUploadModal({ show: false, paymentId: null }); setUploadFile(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  {uploading ? 'Mengupload...' : 'Upload & Bayar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verify Modal */}
      {verifyModal.show && verifyModal.payment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Verifikasi Pembayaran</h3>
              <button onClick={() => { setVerifyModal({ show: false, payment: null }); setRejectReason(''); }} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm"><strong>Warga:</strong> {verifyModal.payment.citizenName}</p>
                <p className="text-sm"><strong>Jenis:</strong> {verifyModal.payment.iuranTypeName}</p>
                <p className="text-sm"><strong>Jumlah:</strong> {formatCurrency(verifyModal.payment.jumlah)}</p>
                <p className="text-sm"><strong>Periode:</strong> {MONTHS.find((m) => m.value === verifyModal.payment.bulan)?.label}/{verifyModal.payment.tahun}</p>
              </div>

              {verifyModal.payment.buktiBayarUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bukti Pembayaran:</label>
                  <img
                    src={`${apiBaseUrl}${verifyModal.payment.buktiBayarUrl}`}
                    alt="Bukti bayar"
                    className="w-full max-h-48 object-contain rounded-lg border border-gray-200 cursor-pointer"
                    onClick={() => setPreviewUrl(`${apiBaseUrl}${verifyModal.payment.buktiBayarUrl}`)}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Penolakan (jika ditolak)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Opsional, isi jika menolak..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleVerify('Ditolak')}
                  disabled={verifying}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                >
                  Tolak
                </button>
                <button
                  onClick={() => handleVerify('Lunas')}
                  disabled={verifying}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                >
                  {verifying ? 'Memproses...' : 'Terima (Lunas)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Bukti Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewUrl(null)} className="absolute -top-3 -right-3 p-1.5 bg-white rounded-full shadow-lg text-gray-600 hover:text-gray-800">
              <X className="w-5 h-5" />
            </button>
            <img src={previewUrl} alt="Preview bukti" className="max-w-full max-h-[85vh] rounded-lg shadow-xl" />
          </div>
        </div>
      )}
    </div>
  );
}
