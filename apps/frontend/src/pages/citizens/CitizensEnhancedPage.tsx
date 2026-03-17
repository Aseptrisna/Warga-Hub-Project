import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { citizensService } from '../../services/citizens.service';
import { useAuthStore } from '../../stores/auth.store';
import { Role } from '@shared/role.enum';
import { canPerformAction } from '../../config/permissions';
import {
  Plus, Search, Eye, Users as UsersIcon, User, List, Grid,
  Download, Upload, Trash2, Edit, ChevronLeft, ChevronRight,
  X, FileSpreadsheet, AlertCircle, CheckCircle,
} from 'lucide-react';
import Swal from 'sweetalert2';

interface Citizen {
  id: string;
  nik: string;
  noKk: string;
  namaLengkap: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  agama: string;
  pendidikan: string;
  pekerjaan: string;
  statusPerkawinan: string;
  statusHubunganDalamKeluarga: string;
  alamat: string;
  rt: string;
  rw: string;
  desa: string;
  noTelp?: string;
  email?: string;
  golonganDarah?: string;
  statusKependudukan?: string;
  keterangan?: string;
}

interface Family {
  noKk: string;
  kepalaKeluarga: string;
  jumlahAnggota: number;
}

export default function CitizensEnhancedPage() {
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rtFilter, setRtFilter] = useState('');
  const [rwFilter, setRwFilter] = useState('');
  const [kkFilter, setKkFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'family'>('list');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [meta, setMeta] = useState<any>({});

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Families for KK filter
  const [families, setFamilies] = useState<Family[]>([]);

  // Auth & permissions
  const { user } = useAuthStore();
  const role = user?.role as Role;
  const canCreate = canPerformAction(role, 'citizens', 'create');
  const canEditCitizen = canPerformAction(role, 'citizens', 'edit');
  const canDeleteCitizen = canPerformAction(role, 'citizens', 'delete');

  useEffect(() => {
    loadFamilies();
  }, []);

  useEffect(() => {
    loadCitizens();
  }, [page, limit, search, kkFilter]);

  const loadCitizens = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit, search };
      if (kkFilter) params.noKk = kkFilter;
      const response = await citizensService.getAll(params);
      setCitizens(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error('Error loading citizens:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFamilies = async () => {
    try {
      const data = await citizensService.getFamilies();
      setFamilies(data);
    } catch (error) {
      console.error('Error loading families:', error);
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      if (isNaN(birth.getTime())) return 0;
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return 0;
    }
  };

  // Client-side RT/RW filters (applied after server-side search/KK filter)
  const filteredCitizens = citizens.filter((c) => {
    if (rtFilter && c.rt !== rtFilter) return false;
    if (rwFilter && c.rw !== rwFilter) return false;
    return true;
  });

  // Group by family
  const groupedByFamily = filteredCitizens.reduce((acc, citizen) => {
    if (!acc[citizen.noKk]) acc[citizen.noKk] = [];
    acc[citizen.noKk].push(citizen);
    return acc;
  }, {} as Record<string, Citizen[]>);

  const uniqueRT = Array.from(new Set(citizens.map((c) => c.rt))).sort();
  const uniqueRW = Array.from(new Set(citizens.map((c) => c.rw))).sort();

  // Stats
  const stats = {
    total: meta.total || filteredCitizens.length,
    lakiLaki: filteredCitizens.filter((c) => c.jenisKelamin === 'Laki-laki').length,
    perempuan: filteredCitizens.filter((c) => c.jenisKelamin === 'Perempuan').length,
    keluarga: Object.keys(groupedByFamily).length,
    anak: filteredCitizens.filter((c) => calculateAge(c.tanggalLahir) < 17).length,
    dewasa: filteredCitizens.filter((c) => {
      const age = calculateAge(c.tanggalLahir);
      return age >= 17 && age < 60;
    }).length,
    lansia: filteredCitizens.filter((c) => calculateAge(c.tanggalLahir) >= 60).length,
    kawin: filteredCitizens.filter((c) => c.statusPerkawinan === 'Kawin').length,
    belumKawin: filteredCitizens.filter((c) => c.statusPerkawinan === 'Belum Kawin').length,
    perguruan: filteredCitizens.filter((c) => ['D1', 'D2', 'D3', 'S1', 'S-1', 'S2', 'S3'].includes(c.pendidikan)).length,
  };

  // Excel Export
  const handleExport = async () => {
    try {
      setExporting(true);
      await citizensService.exportExcel({ search, noKk: kkFilter, rt: rtFilter, rw: rwFilter });
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data berhasil diekspor', timer: 2000, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal export data' });
    } finally {
      setExporting(false);
    }
  };

  // Excel Import
  const handleImportFile = async (file: File) => {
    try {
      setImporting(true);
      setImportResult(null);
      const result = await citizensService.importExcel(file);
      setImportResult(result);
      loadCitizens();
      loadFamilies();
    } catch (error: any) {
      setImportResult({
        message: error.response?.data?.message || 'Gagal import data',
        data: { imported: 0, skipped: 0, errors: [] },
      });
    } finally {
      setImporting(false);
    }
  };

  // Delete citizen with SweetAlert2
  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Hapus Data Warga?',
      text: `Data "${name}" akan dihapus permanen dan tidak dapat dikembalikan.`,
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    try {
      await citizensService.delete(id);
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data warga berhasil dihapus', timer: 2000, showConfirmButton: false });
      loadCitizens();
      loadFamilies();
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Gagal menghapus data warga' });
    }
  };

  // Pagination helpers
  const totalPages = meta.totalPages || 1;
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
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
            <h1 className="text-3xl font-bold text-gray-900">Data Warga</h1>
            <p className="text-gray-600 mt-1">Database lengkap warga dengan data demografi</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center px-4 py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent mr-2"></div> Exporting...</>
              ) : (
                <><Download className="w-4 h-4 mr-2" /> Export Excel</>
              )}
            </button>
            {canCreate && (
              <button
                onClick={() => { setShowImportModal(true); setImportResult(null); }}
                className="inline-flex items-center px-4 py-2 border border-orange-600 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Excel
              </button>
            )}
            {canCreate && (
              <Link
                to="/citizens/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Tambah Warga
              </Link>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Warga</p>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
              </div>
              <UsersIcon className="w-12 h-12 text-blue-200 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Laki-laki</p>
                <p className="text-3xl font-bold mt-1">{stats.lakiLaki}</p>
                <p className="text-xs text-green-100 mt-1">{stats.total > 0 ? ((stats.lakiLaki / stats.total) * 100).toFixed(1) : 0}%</p>
              </div>
              <User className="w-12 h-12 text-green-200 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-sm">Perempuan</p>
                <p className="text-3xl font-bold mt-1">{stats.perempuan}</p>
                <p className="text-xs text-pink-100 mt-1">{stats.total > 0 ? ((stats.perempuan / stats.total) * 100).toFixed(1) : 0}%</p>
              </div>
              <User className="w-12 h-12 text-pink-200 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Keluarga (KK)</p>
                <p className="text-3xl font-bold mt-1">{stats.keluarga}</p>
                <p className="text-xs text-purple-100 mt-1">Avg {stats.keluarga > 0 ? (stats.total / stats.keluarga).toFixed(1) : 0} org/KK</p>
              </div>
              <UsersIcon className="w-12 h-12 text-purple-200 opacity-50" />
            </div>
          </div>
        </div>

        {/* Additional Statistics */}
        <div className="grid grid-cols-6 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500">{"Anak (< 17 th)"}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.anak}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500">Dewasa (17-59)</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.dewasa}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500">{"\u2265 60 (Lansia)"}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.lansia}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500">Kawin</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.kawin}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500">Belum Kawin</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.belumKawin}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500">Pendidikan Tinggi</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.perguruan}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="flex-1 min-w-[250px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari NIK, nama, atau No KK..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={kkFilter}
            onChange={(e) => { setKkFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-w-[250px]"
          >
            <option value="">Semua Keluarga (KK)</option>
            {families.map((f) => (
              <option key={f.noKk} value={f.noKk}>
                {f.kepalaKeluarga} ({f.jumlahAnggota} org)
              </option>
            ))}
          </select>
          <select
            value={rtFilter}
            onChange={(e) => setRtFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Semua RT</option>
            {uniqueRT.map((rt) => <option key={rt} value={rt}>RT {rt}</option>)}
          </select>
          <select
            value={rwFilter}
            onChange={(e) => setRwFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Semua RW</option>
            {uniqueRW.map((rw) => <option key={rw} value={rw}>RW {rw}</option>)}
          </select>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('family')}
              className={`px-4 py-2 ${viewMode === 'family' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Memuat data warga...</p>
        </div>
      ) : filteredCitizens.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data warga</h3>
          <p className="text-gray-500 mb-4">
            {search || kkFilter ? 'Coba ubah filter pencarian' : 'Mulai dengan menambahkan data warga baru'}
          </p>
          {!search && !kkFilter && canCreate && (
            <Link to="/citizens/new" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> Tambah Warga
            </Link>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIK</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Lengkap</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">JK / Umur</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">RT/RW</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pekerjaan</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCitizens.map((citizen, idx) => (
                  <tr key={citizen.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{(page - 1) * limit + idx + 1}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{citizen.nik}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{citizen.namaLengkap}</p>
                        <p className="text-xs text-gray-500">KK: {citizen.noKk}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        citizen.jenisKelamin === 'Laki-laki' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                      }`}>
                        {citizen.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                      </span>
                      <span className="ml-1">{calculateAge(citizen.tanggalLahir)} th</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                        {citizen.statusHubunganDalamKeluarga}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{citizen.rt}/{citizen.rw}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{citizen.pekerjaan || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/citizens/${citizen.id}`}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {canEditCitizen && (
                          <Link
                            to={`/citizens/${citizen.id}/edit`}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        )}
                        {canDeleteCitizen && (
                          <button
                            onClick={() => handleDelete(citizen.id, citizen.namaLengkap)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Family View */
        <div className="space-y-6">
          {Object.entries(groupedByFamily).map(([noKk, members]) => {
            const kepalaKeluarga = members.find((m) => m.statusHubunganDalamKeluarga === 'Kepala Keluarga');
            return (
              <div key={noKk} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {kepalaKeluarga ? `Keluarga ${kepalaKeluarga.namaLengkap}` : `Keluarga ${noKk}`}
                    </h3>
                    <p className="text-sm text-gray-500">No. KK: {noKk} - {members.length} anggota keluarga</p>
                    {kepalaKeluarga && (
                      <p className="text-sm text-gray-600 mt-1">{kepalaKeluarga.alamat}</p>
                    )}
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                    RT {members[0].rt} / RW {members[0].rw}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {members.map((member) => (
                    <Link
                      key={member.id}
                      to={`/citizens/${member.id}`}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                          member.jenisKelamin === 'Laki-laki' ? 'bg-blue-500' : 'bg-pink-500'
                        }`}>
                          {member.namaLengkap.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{member.namaLengkap}</p>
                          <p className="text-xs text-gray-500">{member.statusHubunganDalamKeluarga}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {member.jenisKelamin === 'Laki-laki' ? 'L' : 'P'} - {calculateAge(member.tanggalLahir)} th
                          </p>
                          {member.pekerjaan && (
                            <p className="text-xs text-gray-500 mt-1 truncate">{member.pekerjaan}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enhanced Pagination */}
      {!loading && filteredCitizens.length > 0 && (
        <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">
              Menampilkan {(page - 1) * limit + 1}-{Math.min(page * limit, meta.total || 0)} dari {meta.total || 0} warga
            </p>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Per halaman:</label>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
              >
                {[10, 15, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Awal
            </button>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {getPageNumbers().map((p, i) =>
              p === '...' ? (
                <span key={`dots-${i}`} className="px-2 py-1 text-sm text-gray-500">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`px-3 py-1 text-sm rounded ${
                    page === p
                      ? 'bg-blue-600 text-white border border-blue-600'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Akhir
            </button>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg mx-4 w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Import Data Warga</h3>
              <button onClick={() => setShowImportModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Upload file Excel (.xlsx) dengan kolom sesuai format. Download template terlebih dahulu untuk memastikan format yang benar.
              </p>
              <button
                onClick={handleExport}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1" />
                Download template (export data saat ini)
              </button>
            </div>

            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleImportFile(e.target.files[0]);
                    e.target.value = '';
                  }
                }}
              />
              {importing ? (
                <div>
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600">Mengimport data...</p>
                </div>
              ) : (
                <div>
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">Klik untuk pilih file atau drag & drop</p>
                  <p className="text-xs text-gray-500 mt-1">Format: .xlsx (max 10MB)</p>
                </div>
              )}
            </div>

            {importResult && (
              <div className={`mt-4 p-4 rounded-lg ${importResult.data?.imported > 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {importResult.data?.imported > 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  )}
                  <p className="text-sm font-medium">{importResult.message}</p>
                </div>
                {importResult.data && (
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>Berhasil diimport: {importResult.data.imported}</p>
                    <p>Dilewati: {importResult.data.skipped}</p>
                    {importResult.data.errors?.length > 0 && (
                      <div className="mt-2 max-h-32 overflow-y-auto">
                        {importResult.data.errors.map((err: string, i: number) => (
                          <p key={i} className="text-red-600">{err}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
