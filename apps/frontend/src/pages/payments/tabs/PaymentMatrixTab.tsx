import { useState, useEffect, useMemo } from 'react';
import { paymentsService } from '../../../services/payments.service';
import { useRegionScope } from '../../../hooks/useRegionScope';
import { RefreshCw, Download, ChevronLeft, ChevronRight, FileSpreadsheet, Search } from 'lucide-react';
import Swal from 'sweetalert2';

const MONTHS = [
  { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
  { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
];

const PER_PAGE = 15;

export default function PaymentMatrixTab() {
  const scope = useRegionScope();
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [matrix, setMatrix] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Client-side pagination & search
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadMatrix();
  }, [bulan, tahun]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const loadMatrix = async () => {
    try {
      setLoading(true);
      setPage(1);
      setSearch('');
      const res = await paymentsService.getMatrix({ bulan, tahun, ...scope });
      setMatrix(res);
    } catch (error) {
      console.error('Error loading matrix:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered rows based on search
  const filteredRows = useMemo(() => {
    if (!matrix?.rows) return [];
    if (!search.trim()) return matrix.rows;
    const q = search.toLowerCase();
    return matrix.rows.filter((row: any) =>
      row.citizenName?.toLowerCase().includes(q) ||
      row.nik?.includes(q) ||
      row.rt?.includes(q)
    );
  }, [matrix, search]);

  // Paginated rows
  const totalFiltered = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filteredRows.slice(start, start + PER_PAGE);
  }, [filteredRows, page]);

  const startItem = totalFiltered === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const endItem = Math.min(page * PER_PAGE, totalFiltered);

  const handleGenerate = async () => {
    const confirm = await Swal.fire({
      title: 'Generate Tagihan?',
      html: `Generate tagihan untuk bulan <strong>${MONTHS[bulan - 1]?.label} ${tahun}</strong>?<br/><small class="text-gray-500">Tagihan yang sudah ada akan dilewati.</small>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Generate!',
      cancelButtonText: 'Batal',
    });
    if (!confirm.isConfirmed) return;

    try {
      setGenerating(true);
      const res = await paymentsService.generateBulk({ bulan, tahun });
      loadMatrix();
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        html: `<strong>${res.created}</strong> tagihan baru dibuat<br/><small class="text-gray-500">${res.skipped} tagihan sudah ada (dilewati)</small>`,
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error('Error generating bulk:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: error?.response?.data?.message || 'Gagal generate tagihan',
      });
    } finally {
      setGenerating(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!matrix?.rows || matrix.rows.length === 0 || !matrix.iuranTypes?.length) {
      Swal.fire({ icon: 'info', title: 'Data Kosong', text: 'Tidak ada data matrix untuk diexport' });
      return;
    }

    const iuranTypes: any[] = matrix.iuranTypes;
    const rows: any[] = filteredRows;

    // Headers
    const headers = ['No', 'Nama Warga', 'NIK', 'RT', 'RW', ...iuranTypes.map((it: any) => it.nama)];

    // Data rows
    const csvRows = rows.map((row: any, idx: number) => {
      const statusCells = row.cells.map((cell: any) => `"${cell.status || 'Belum Generate'}"`);
      return [
        idx + 1,
        `"${row.citizenName}"`,
        `"${row.nik}"`,
        row.rt,
        row.rw,
        ...statusCells,
      ];
    });

    // Summary row
    const summaryRow = ['', '', '', '', 'TOTAL',
      ...iuranTypes.map((_it: any, colIdx: number) => {
        let lunas = 0, menunggu = 0, belum = 0;
        for (const row of rows) {
          const s = row.cells[colIdx]?.status;
          if (s === 'Lunas') lunas++;
          else if (s === 'Menunggu Verifikasi') menunggu++;
          else if (s === 'Belum Bayar') belum++;
        }
        return `"L:${lunas} M:${menunggu} B:${belum}"`;
      }),
    ];

    const csvContent = [
      headers.join(','),
      ...csvRows.map((r) => r.join(',')),
      '',
      summaryRow.join(','),
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Status_Iuran_${MONTHS[bulan - 1]?.label}_${tahun}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    Swal.fire({ icon: 'success', title: 'Export Berhasil!', text: `${rows.length} data warga berhasil diexport`, timer: 2000, showConfirmButton: false });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'Lunas':
        return <span className="inline-block w-full text-center px-1 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-800">Lunas</span>;
      case 'Menunggu Verifikasi':
        return <span className="inline-block w-full text-center px-1 py-0.5 rounded text-[10px] font-semibold bg-yellow-100 text-yellow-800">Menunggu</span>;
      case 'Belum Bayar':
        return <span className="inline-block w-full text-center px-1 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800">Belum</span>;
      case 'Ditolak':
        return <span className="inline-block w-full text-center px-1 py-0.5 rounded text-[10px] font-semibold bg-gray-200 text-gray-700">Ditolak</span>;
      default:
        return <span className="inline-block w-full text-center px-1 py-0.5 rounded text-[10px] text-gray-400">-</span>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={bulan}
          onChange={(e) => setBulan(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <input
          type="number"
          value={tahun}
          onChange={(e) => setTahun(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-24 focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={loadMatrix}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> {generating ? 'Generating...' : 'Generate Tagihan'}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari warga..."
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-48 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 text-sm font-medium"
            title="Export CSV"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Summary */}
      {matrix?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500">Total Warga</p>
            <p className="text-lg font-bold text-gray-900">{matrix.summary.totalWarga}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500">Total Tagihan</p>
            <p className="text-lg font-bold text-gray-900">{matrix.summary.totalTagihan}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-3 text-center">
            <p className="text-xs text-green-600">Lunas</p>
            <p className="text-lg font-bold text-green-700">{matrix.summary.lunas}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-3 text-center">
            <p className="text-xs text-yellow-600">Menunggu</p>
            <p className="text-lg font-bold text-yellow-700">{matrix.summary.menunggu}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-3 text-center">
            <p className="text-xs text-red-600">Belum Bayar</p>
            <p className="text-lg font-bold text-red-700">{matrix.summary.belumBayar}</p>
          </div>
        </div>
      )}

      {/* Matrix Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading matrix...</div>
        ) : !matrix || matrix.rows?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {!matrix ? 'Pilih bulan dan tahun untuk melihat matrix.' : 'Tidak ada data warga dalam scope ini.'}
          </div>
        ) : matrix.iuranTypes?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Belum ada jenis iuran aktif. Buat jenis iuran di tab "Setup Iuran" terlebih dahulu.
          </div>
        ) : paginatedRows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Tidak ada warga yang cocok dengan pencarian "{search}".
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10 w-12">
                      No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-[48px] bg-gray-50 z-10 min-w-[180px]">
                      Warga
                    </th>
                    {matrix.iuranTypes.map((it: any) => (
                      <th key={it.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase min-w-[100px]">
                        <div>{it.nama}</div>
                        <div className="text-[10px] font-normal text-gray-400">{formatCurrency(it.jumlah)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedRows.map((row: any, idx: number) => (
                    <tr key={row.citizenId} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-sm text-gray-500 text-center sticky left-0 bg-white z-10">
                        {startItem + idx}
                      </td>
                      <td className="px-4 py-3 sticky left-[48px] bg-white z-10">
                        <div className="text-sm font-medium text-gray-900">{row.citizenName}</div>
                        <div className="text-[10px] text-gray-500">RT {row.rt} / RW {row.rw}</div>
                      </td>
                      {row.cells.map((cell: any, cellIdx: number) => (
                        <td key={cellIdx} className="px-3 py-3 text-center">
                          {getStatusBadge(cell.status)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                Menampilkan <span className="font-medium">{startItem}</span>-<span className="font-medium">{endItem}</span> dari <span className="font-medium">{totalFiltered}</span> warga
                {search && ` (filter dari ${matrix.rows.length} total)`}
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
    </div>
  );
}
