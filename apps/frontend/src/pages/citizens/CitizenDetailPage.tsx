import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Briefcase,
  Phone, Mail, CreditCard, FileText, Users, Edit,
  Trash2, UserCircle, Upload, Shield
} from 'lucide-react';
import { citizensService } from '../../services/citizens.service';
import { useAuthStore } from '../../stores/auth.store';
import { Role } from '@shared/role.enum';
import { canPerformAction } from '../../config/permissions';
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
  namaAyah?: string;
  namaIbu?: string;
  alamat: string;
  rt: string;
  rw: string;
  desa: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
  kodePos?: string;
  noTelp?: string;
  email?: string;
  kewarganegaraan?: string;
  golonganDarah?: string;
  nomorPaspor?: string;
  nomorAktaLahir?: string;
  npwp?: string;
  noBpjsKesehatan?: string;
  noBpjsKetenagakerjaan?: string;
  statusKepemilikanRumah?: string;
  fotoUrl?: string;
  ktpUrl?: string;
  kkUrl?: string;
  aktaLahirUrl?: string;
  suratNikahUrl?: string;
  ijazahUrl?: string;
  bpjsKesehatanUrl?: string;
  bpjsKetenagakerjaanUrl?: string;
  vaksinUrl?: string;
  skckUrl?: string;
  statusKependudukan?: string;
  tanggalPindah?: string;
  tanggalMeninggal?: string;
  keterangan?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

// Document type configurations
const DOCUMENT_TYPES = [
  { key: 'ktp', label: 'Scan KTP', field: 'ktpUrl', endpoint: 'upload-ktp', color: 'blue', accept: 'image/*,application/pdf' },
  { key: 'kk', label: 'Scan Kartu Keluarga', field: 'kkUrl', endpoint: 'upload-kk', color: 'purple', accept: 'image/*,application/pdf' },
  { key: 'akta', label: 'Akta Kelahiran', field: 'aktaLahirUrl', endpoint: 'upload-akta', color: 'green', accept: 'image/*,application/pdf' },
  { key: 'surat-nikah', label: 'Surat/Akta Nikah', field: 'suratNikahUrl', endpoint: 'upload-surat-nikah', color: 'pink', accept: 'image/*,application/pdf' },
  { key: 'ijazah', label: 'Ijazah Terakhir', field: 'ijazahUrl', endpoint: 'upload-ijazah', color: 'indigo', accept: 'image/*,application/pdf' },
  { key: 'bpjs-kesehatan', label: 'BPJS Kesehatan', field: 'bpjsKesehatanUrl', endpoint: 'upload-bpjs-kesehatan', color: 'teal', accept: 'image/*,application/pdf' },
  { key: 'vaksin', label: 'Sertifikat Vaksin', field: 'vaksinUrl', endpoint: 'upload-vaksin', color: 'cyan', accept: 'image/*,application/pdf' },
  { key: 'skck', label: 'SKCK', field: 'skckUrl', endpoint: 'upload-skck', color: 'amber', accept: 'image/*,application/pdf' },
] as const;

export default function CitizenDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const { user } = useAuthStore();
  const role = user?.role as Role;
  const canEditCitizen = canPerformAction(role, 'citizens', 'edit');
  const canDeleteCitizen = canPerformAction(role, 'citizens', 'delete');

  useEffect(() => {
    if (id) loadCitizen();
  }, [id]);

  const loadCitizen = async () => {
    try {
      setLoading(true);
      const data = await citizensService.getById(id!);
      setCitizen(data);
    } catch (error: any) {
      console.error('Error loading citizen:', error);
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Gagal memuat data warga' });
      navigate('/citizens');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Hapus Data Warga?',
      text: `Data "${citizen?.namaLengkap}" akan dihapus permanen dan tidak dapat dikembalikan.`,
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    try {
      await citizensService.delete(id!);
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data warga berhasil dihapus', timer: 2000, showConfirmButton: false });
      navigate('/citizens');
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Gagal menghapus data' });
    }
  };

  const handleFileUpload = async (file: File, type: string, endpoint: string) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ icon: 'warning', title: 'File Terlalu Besar', text: 'Ukuran file maksimal 5MB' });
      return;
    }

    try {
      setUploading(type);
      const result = await citizensService.uploadDocument(id!, file, endpoint);
      setCitizen(result.data);
    } catch (error) {
      console.error('Upload error:', error);
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal upload file' });
    } finally {
      setUploading(null);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return '-';
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
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
      return age;
    } catch {
      return 0;
    }
  };

  const DocumentUploadCard = ({ docType }: { docType: typeof DOCUMENT_TYPES[number] }) => {
    const url = citizen?.[docType.field as keyof Citizen] as string | undefined;
    return (
      <div className="border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">{docType.label}</p>
          <label className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-colors ${
            uploading === docType.key ? 'bg-gray-200 text-gray-500' : `bg-${docType.color}-600 text-white hover:bg-${docType.color}-700`
          }`}
          style={uploading !== docType.key ? { backgroundColor: getColor(docType.color) } : undefined}
          >
            <input
              type="file"
              accept={docType.accept}
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], docType.key, docType.endpoint)}
              disabled={uploading === docType.key}
            />
            {uploading === docType.key ? (
              <><div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div> Uploading...</>
            ) : (
              <><Upload className="w-3 h-3" /> {url ? 'Ganti' : 'Upload'}</>
            )}
          </label>
        </div>
        {url ? (
          <div className="mt-2">
            {url.endsWith('.pdf') ? (
              <a href={`${API_BASE}${url}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm">
                <FileText className="w-4 h-4" /> Lihat PDF
              </a>
            ) : (
              <a href={`${API_BASE}${url}`} target="_blank" rel="noopener noreferrer">
                <img src={`${API_BASE}${url}`} alt={docType.label} className="w-full rounded border border-gray-200 max-h-48 object-contain" />
              </a>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400 mt-2">Belum ada dokumen</p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!citizen) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/citizens')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Warga
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="relative group">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg overflow-hidden">
                {citizen.fotoUrl ? (
                  <img src={`${API_BASE}${citizen.fotoUrl}`} alt={citizen.namaLengkap} className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-16 h-16" />
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'photo', 'upload-photo')}
                  disabled={uploading === 'photo'}
                />
                {uploading === 'photo' ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Upload className="w-6 h-6 text-white" />
                )}
              </label>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{citizen.namaLengkap}</h1>
              <p className="text-gray-600 mt-1">{citizen.statusHubunganDalamKeluarga}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  citizen.statusKependudukan === 'Pindah' ? 'bg-yellow-100 text-yellow-800' :
                  citizen.statusKependudukan === 'Meninggal' ? 'bg-red-100 text-red-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {citizen.statusKependudukan || 'Aktif'}
                </span>
                <span className="text-sm text-gray-500">
                  {citizen.jenisKelamin} - {calculateAge(citizen.tanggalLahir)} tahun
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {canEditCitizen && (
              <Link
                to={`/citizens/${id}/edit`}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4" /> Edit
              </Link>
            )}
            {canDeleteCitizen && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Hapus
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identitas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" /> Identitas
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="NIK" value={citizen.nik} mono />
              <InfoItem label="No. Kartu Keluarga" value={citizen.noKk} mono />
              <InfoItem label="Tempat Lahir" value={citizen.tempatLahir} />
              <InfoItem label="Tanggal Lahir" value={`${formatDate(citizen.tanggalLahir)} (${calculateAge(citizen.tanggalLahir)} tahun)`} />
              <InfoItem label="Jenis Kelamin" value={citizen.jenisKelamin} />
              <InfoItem label="Golongan Darah" value={citizen.golonganDarah || '-'} />
              <InfoItem label="Agama" value={citizen.agama} />
              <InfoItem label="Kewarganegaraan" value={citizen.kewarganegaraan || 'WNI'} />
            </div>
          </div>

          {/* Keluarga */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Keluarga
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Status Perkawinan" value={citizen.statusPerkawinan} />
              <InfoItem label="Status Hubungan" value={citizen.statusHubunganDalamKeluarga} />
              {citizen.namaAyah && <InfoItem label="Nama Ayah" value={citizen.namaAyah} />}
              {citizen.namaIbu && <InfoItem label="Nama Ibu" value={citizen.namaIbu} />}
            </div>
          </div>

          {/* Pendidikan & Pekerjaan */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" /> Pendidikan & Pekerjaan
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Pendidikan Terakhir" value={citizen.pendidikan} />
              <InfoItem label="Pekerjaan" value={citizen.pekerjaan || '-'} />
            </div>
          </div>

          {/* Alamat */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" /> Alamat
            </h2>
            <div className="space-y-3">
              <InfoItem label="Alamat Lengkap" value={citizen.alamat} />
              <div className="grid grid-cols-3 gap-4">
                <InfoItem label="RT / RW" value={`${citizen.rt} / ${citizen.rw}`} />
                <InfoItem label="Desa" value={citizen.desa} />
                <InfoItem label="Kecamatan" value={citizen.kecamatan || '-'} />
                <InfoItem label="Kabupaten" value={citizen.kabupaten || '-'} />
                <InfoItem label="Provinsi" value={citizen.provinsi || '-'} />
                <InfoItem label="Kode Pos" value={citizen.kodePos || '-'} />
              </div>
              {citizen.statusKepemilikanRumah && (
                <InfoItem label="Status Kepemilikan Rumah" value={citizen.statusKepemilikanRumah} />
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Kontak */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" /> Kontak
            </h2>
            <div className="space-y-3">
              {citizen.noTelp && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Telepon</p>
                    <p className="font-medium text-gray-900">{citizen.noTelp}</p>
                  </div>
                </div>
              )}
              {citizen.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{citizen.email}</p>
                  </div>
                </div>
              )}
              {!citizen.noTelp && !citizen.email && (
                <p className="text-sm text-gray-500">Tidak ada data kontak</p>
              )}
            </div>
          </div>

          {/* Nomor Dokumen */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" /> Nomor Dokumen
            </h2>
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-medium mb-1">NIK (KTP)</p>
                <p className="font-mono text-sm font-bold text-blue-900">{citizen.nik}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-xs text-purple-600 font-medium mb-1">No. Kartu Keluarga</p>
                <p className="font-mono text-sm font-bold text-purple-900">{citizen.noKk}</p>
              </div>
              {citizen.nomorAktaLahir && (
                <NumberDoc label="No. Akta Lahir" value={citizen.nomorAktaLahir} />
              )}
              {citizen.npwp && (
                <NumberDoc label="NPWP" value={citizen.npwp} />
              )}
              {citizen.noBpjsKesehatan && (
                <NumberDoc label="No. BPJS Kesehatan" value={citizen.noBpjsKesehatan} />
              )}
              {citizen.noBpjsKetenagakerjaan && (
                <NumberDoc label="No. BPJS Ketenagakerjaan" value={citizen.noBpjsKetenagakerjaan} />
              )}
              {citizen.nomorPaspor && (
                <NumberDoc label="No. Paspor" value={citizen.nomorPaspor} />
              )}
            </div>
          </div>

          {/* Dokumen Scan */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" /> Dokumen (Scan/Upload)
            </h2>
            <div className="space-y-3">
              {DOCUMENT_TYPES.map((docType) => (
                <DocumentUploadCard key={docType.key} docType={docType} />
              ))}
            </div>
          </div>

          {/* Keterangan */}
          {citizen.keterangan && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Keterangan</h2>
              <p className="text-sm text-blue-800">{citizen.keterangan}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Informasi Sistem</h2>
            <div className="space-y-2 text-xs text-gray-600">
              <div>
                <p className="text-gray-500">Terdaftar</p>
                <p>{formatDate(citizen.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-500">Terakhir Diupdate</p>
                <p>{formatDate(citizen.updatedAt)}</p>
              </div>
              {citizen.tanggalPindah && (
                <div>
                  <p className="text-gray-500">Tanggal Pindah</p>
                  <p>{formatDate(citizen.tanggalPindah)}</p>
                </div>
              )}
              {citizen.tanggalMeninggal && (
                <div>
                  <p className="text-gray-500">Tanggal Meninggal</p>
                  <p>{formatDate(citizen.tanggalMeninggal)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`font-medium text-gray-900 ${mono ? 'font-mono text-sm' : ''}`}>{value}</p>
    </div>
  );
}

function NumberDoc({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 rounded-lg p-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-mono text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

function getColor(color: string): string {
  const colors: Record<string, string> = {
    blue: '#2563eb',
    purple: '#9333ea',
    green: '#16a34a',
    pink: '#ec4899',
    indigo: '#6366f1',
    teal: '#0d9488',
    cyan: '#0891b2',
    amber: '#d97706',
  };
  return colors[color] || '#2563eb';
}
