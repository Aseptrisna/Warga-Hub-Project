import { useState, useEffect } from 'react';
import { paymentsService } from '../../../services/payments.service';
import { useRegionScope } from '../../../hooks/useRegionScope';
import { useAuthStore } from '../../../stores/auth.store';
import { canPerformAction } from '../../../config/permissions';
import { resolveFileUrl } from '../../../utils/file-url';
import { Role } from '@shared/role.enum';
import { DollarSign, Clock, CheckCircle, XCircle, Upload, Eye, X, ChevronLeft, ChevronRight, FileSpreadsheet, QrCode, BellRing } from 'lucide-react';
import Swal from 'sweetalert2';
import { StatTile } from '../../../components/ui/StatTile';
import { Card } from '../../../components/ui/Card';
import { Table, Thead, Tbody, Th, Td } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input, Select, Textarea } from '../../../components/ui/Input';
import { EmptyState } from '../../../components/ui/EmptyState';

const MONTHS = [
  { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
  { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
];

const STATUS_OPTIONS = ['Belum Bayar', 'Menunggu Verifikasi', 'Lunas', 'Ditolak'];
const PER_PAGE = 10;

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  Lunas: 'success',
  'Menunggu Verifikasi': 'warning',
  'Belum Bayar': 'danger',
  Ditolak: 'neutral',
};

export default function PaymentListTab() {
  const scope = useRegionScope();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user ? canPerformAction(user.role, 'payments', 'verify') : false;
  const isWarga = user?.role === Role.WARGA;
  const canSendReminders = user
    ? [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KAUR_KEUANGAN].includes(user.role)
    : false;

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

  // QRIS payment
  const [qrisLoadingId, setQrisLoadingId] = useState<string | null>(null);

  // Reminder iuran
  const [sendingReminders, setSendingReminders] = useState(false);

  useEffect(() => {
    loadData();
  }, [filterBulan, filterTahun, filterStatus, search, page]);

  // Landed back from the QRIS hosted payment page (success/cancel return URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qrisResult = params.get('qris');
    const paymentId = params.get('paymentId');
    if (!qrisResult || !paymentId) return;

    window.history.replaceState({}, '', window.location.pathname);

    if (qrisResult === 'cancel') {
      Swal.fire({ icon: 'info', title: 'Pembayaran Dibatalkan', timer: 3000, showConfirmButton: false });
      return;
    }

    paymentsService
      .getQrisStatus(paymentId)
      .then((res) => {
        const status = res.data?.status;
        if (status === 'Lunas') {
          Swal.fire({ icon: 'success', title: 'Pembayaran Berhasil!', text: 'Tagihan sudah lunas.', timer: 3000, showConfirmButton: false });
        } else {
          Swal.fire({ icon: 'info', title: 'Menunggu Konfirmasi', text: 'Pembayaran sedang diproses oleh payment gateway.', timer: 3000, showConfirmButton: false });
        }
        loadData();
      })
      .catch(() => loadData());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = isWarga ? { limit: PER_PAGE, page } : { ...scope, limit: PER_PAGE, page };
      if (filterBulan) params.bulan = filterBulan;
      if (filterTahun) params.tahun = filterTahun;
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;

      const statsParams: any = isWarga
        ? { bulan: filterBulan || undefined, tahun: filterTahun || undefined }
        : { ...scope, bulan: filterBulan || undefined, tahun: filterTahun || undefined };

      const [paymentsRes, statsRes] = await Promise.all([
        isWarga
          ? paymentsService.getMy(params)
          : paymentsService.getAll(params),
        paymentsService.getStatistics(statsParams),
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

  const handlePayQris = async (paymentId: string) => {
    try {
      setQrisLoadingId(paymentId);
      const res = await paymentsService.createQris(paymentId);
      const linkUrl = res.data?.qrisPaymentLinkUrl;
      if (linkUrl) {
        window.open(linkUrl, '_blank', 'noopener,noreferrer');
      }
      loadData();
    } catch (error: any) {
      console.error('Error creating QRIS payment:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Membuat Pembayaran QRIS',
        text: error?.response?.data?.message || 'Terjadi kesalahan saat membuat pembayaran QRIS',
      });
    } finally {
      setQrisLoadingId(null);
    }
  };

  const handleSendReminders = async () => {
    try {
      setSendingReminders(true);
      const res = await paymentsService.sendReminders();
      Swal.fire({
        icon: 'success',
        title: 'Reminder Terkirim',
        text: `${res.remindersSent ?? 0} reminder berhasil dikirim${res.skipped ? `, ${res.skipped} dilewati (belum ada akun warga terhubung)` : ''}.`,
      });
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim Reminder',
        text: error?.response?.data?.message || 'Terjadi kesalahan',
      });
    } finally {
      setSendingReminders(false);
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
      confirmButtonColor: status === 'Lunas' ? '#15803d' : '#b91c1c',
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
      const params: any = isWarga ? { limit: 9999 } : { ...scope, limit: 9999 };
      if (filterBulan) params.bulan = filterBulan;
      if (filterTahun) params.tahun = filterTahun;
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;

      const res = isWarga ? await paymentsService.getMy(params) : await paymentsService.getAll(params);
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
      const BOM = '﻿';
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

  const startItem = (page - 1) * PER_PAGE + 1;
  const endItem = Math.min(page * PER_PAGE, total);

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatTile label="Total Tagihan" value={formatCurrency(stats.totalTagihan || 0)} icon={DollarSign} />
        <StatTile label="Lunas" value={stats.totalLunas || 0} icon={CheckCircle} tone="success" />
        <StatTile label="Menunggu Verifikasi" value={stats.totalMenunggu || 0} icon={Clock} tone="warning" />
        <StatTile label="Belum Bayar" value={stats.totalBelumBayar || 0} icon={XCircle} tone="danger" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {!isWarga && (
          <Input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari nama warga..."
            className="w-56"
          />
        )}
        <Select
          value={filterBulan}
          onChange={(e) => { setFilterBulan(e.target.value); setPage(1); }}
          className="w-auto"
        >
          <option value="">Semua Bulan</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </Select>
        <Input
          type="number"
          value={filterTahun}
          onChange={(e) => { setFilterTahun(e.target.value); setPage(1); }}
          placeholder="Tahun"
          className="w-24"
        />
        <Select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="w-auto"
        >
          <option value="">Semua Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <div className="ml-auto flex gap-2">
          {canSendReminders && (
            <Button
              variant="secondary"
              onClick={handleSendReminders}
              disabled={sendingReminders}
              title="Kirim reminder iuran jatuh tempo/terlambat sekarang (otomatis jalan tiap hari jam 08:00)"
            >
              <BellRing className="w-4 h-4" /> {sendingReminders ? 'Mengirim...' : 'Kirim Reminder'}
            </Button>
          )}
          <Button variant="secondary" onClick={handleExportCSV} title="Export CSV">
            <FileSpreadsheet className="w-4 h-4" /> Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Memuat data...</div>
        ) : payments.length === 0 ? (
          <EmptyState icon={DollarSign} title="Belum ada data pembayaran" />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th align="center" className="w-12">No</Th>
                  {!isWarga && <Th>Nama</Th>}
                  <Th>Jenis Iuran</Th>
                  <Th align="center">Periode</Th>
                  <Th align="right">Jumlah</Th>
                  <Th align="center">Status</Th>
                  <Th align="center">Bukti</Th>
                  <Th align="center">Aksi</Th>
                </tr>
              </Thead>
              <Tbody>
                {payments.map((payment, idx) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <Td align="center" className="text-gray-500">{startItem + idx}</Td>
                    {!isWarga && (
                      <Td>
                        <div className="text-sm font-medium text-gray-900">{payment.citizenName}</div>
                        <div className="text-xs text-gray-500">RT {payment.rt} / RW {payment.rw}</div>
                      </Td>
                    )}
                    <Td>{payment.iuranTypeName || payment.jenis}</Td>
                    <Td align="center" className="text-gray-500">
                      {MONTHS.find((m) => m.value === payment.bulan)?.label || payment.bulan}/{payment.tahun}
                    </Td>
                    <Td align="right" className="font-medium text-gray-900">
                      {formatCurrency(payment.jumlah)}
                    </Td>
                    <Td align="center">
                      <Badge tone={STATUS_TONE[payment.status] || 'neutral'}>{payment.status}</Badge>
                    </Td>
                    <Td align="center">
                      {payment.buktiBayarUrl ? (
                        <button
                          onClick={() => setPreviewUrl(resolveFileUrl(payment.buktiBayarUrl))}
                          className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-md"
                          title="Lihat bukti"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </Td>
                    <Td align="center">
                      <div className="flex items-center justify-center gap-1">
                        {(payment.status === 'Belum Bayar' || payment.status === 'Ditolak') && (isWarga || isAdmin) && (
                          <Button size="sm" onClick={() => setUploadModal({ show: true, paymentId: payment.id })}>
                            <Upload className="w-3.5 h-3.5" /> Upload Bukti
                          </Button>
                        )}
                        {(payment.status === 'Belum Bayar' || payment.status === 'Ditolak') && isWarga && (
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => handlePayQris(payment.id)}
                            disabled={qrisLoadingId === payment.id}
                          >
                            <QrCode className="w-3.5 h-3.5" /> {qrisLoadingId === payment.id ? 'Memproses...' : 'Bayar QRIS'}
                          </Button>
                        )}
                        {payment.status === 'Menunggu Verifikasi' && isAdmin && (
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setVerifyModal({ show: true, payment })}>
                            Verifikasi
                          </Button>
                        )}
                        {payment.status === 'Ditolak' && payment.rejectionReason && (
                          <span className="text-xs text-danger-text" title={payment.rejectionReason}>
                            Alasan: {payment.rejectionReason}
                          </span>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                Menampilkan <span className="font-medium">{startItem}</span>-<span className="font-medium">{endItem}</span> dari <span className="font-medium">{total}</span> data
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
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
                        className={`min-w-[36px] h-9 rounded-md border text-sm font-medium ${
                          p === page
                            ? 'bg-primary-600 text-white border-primary-600'
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
                  className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Upload Bukti Modal */}
      <Modal
        open={uploadModal.show}
        onClose={() => { setUploadModal({ show: false, paymentId: null }); setUploadFile(null); }}
        title="Upload Bukti Pembayaran"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pilih file bukti pembayaran</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            <p className="mt-1 text-xs text-gray-500">Format: JPG, PNG, PDF. Maks 5MB</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => { setUploadModal({ show: false, paymentId: null }); setUploadFile(null); }}
            >
              Batal
            </Button>
            <Button className="flex-1" onClick={handleUpload} disabled={!uploadFile || uploading}>
              {uploading ? 'Mengupload...' : 'Upload & Bayar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Verify Modal */}
      <Modal
        open={verifyModal.show && !!verifyModal.payment}
        onClose={() => { setVerifyModal({ show: false, payment: null }); setRejectReason(''); }}
        title="Verifikasi Pembayaran"
      >
        {verifyModal.payment && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-md p-4 space-y-2">
              <p className="text-sm"><strong>Warga:</strong> {verifyModal.payment.citizenName}</p>
              <p className="text-sm"><strong>Jenis:</strong> {verifyModal.payment.iuranTypeName}</p>
              <p className="text-sm"><strong>Jumlah:</strong> {formatCurrency(verifyModal.payment.jumlah)}</p>
              <p className="text-sm"><strong>Periode:</strong> {MONTHS.find((m) => m.value === verifyModal.payment.bulan)?.label}/{verifyModal.payment.tahun}</p>
            </div>

            {verifyModal.payment.buktiBayarUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bukti Pembayaran:</label>
                <img
                  src={resolveFileUrl(verifyModal.payment.buktiBayarUrl)}
                  alt="Bukti bayar"
                  className="w-full max-h-48 object-contain rounded-md border border-gray-200 cursor-pointer"
                  onClick={() => setPreviewUrl(resolveFileUrl(verifyModal.payment.buktiBayarUrl))}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Penolakan (jika ditolak)</label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={2}
                placeholder="Opsional, isi jika menolak..."
              />
            </div>

            <div className="flex gap-3">
              <Button variant="danger" className="flex-1" onClick={() => handleVerify('Ditolak')} disabled={verifying}>
                Tolak
              </Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleVerify('Lunas')} disabled={verifying}>
                {verifying ? 'Memproses...' : 'Terima (Lunas)'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Preview Bukti Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewUrl(null)} className="absolute -top-3 -right-3 p-1.5 bg-white rounded-full border border-gray-200 text-gray-600 hover:text-gray-800">
              <X className="w-5 h-5" />
            </button>
            <img src={previewUrl} alt="Preview bukti" className="max-w-full max-h-[85vh] rounded-md" />
          </div>
        </div>
      )}
    </div>
  );
}
