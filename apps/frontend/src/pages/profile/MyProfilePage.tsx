import { useState, useEffect } from 'react';
import { citizensService } from '../../services/citizens.service';
import { resolveFileUrl } from '../../utils/file-url';
import { useAuthStore } from '../../stores/auth.store';
import { RoleLabels } from '@shared/role.enum';
import { User, Camera, FileText, Save, Loader2, Upload, Check } from 'lucide-react';
import Swal from 'sweetalert2';

const DOCUMENT_TYPES = [
  { key: 'upload-ktp', label: 'KTP', field: 'ktpUrl' },
  { key: 'upload-kk', label: 'Kartu Keluarga', field: 'kkUrl' },
  { key: 'upload-akta', label: 'Akta Lahir', field: 'aktaLahirUrl' },
  { key: 'upload-surat-nikah', label: 'Surat Nikah', field: 'suratNikahUrl' },
  { key: 'upload-ijazah', label: 'Ijazah', field: 'ijazahUrl' },
  { key: 'upload-bpjs', label: 'BPJS Kesehatan', field: 'bpjsKesehatanUrl' },
  { key: 'upload-bpjs-ketenagakerjaan', label: 'BPJS Ketenagakerjaan', field: 'bpjsKetenagakerjaanUrl' },
  { key: 'upload-vaksin', label: 'Sertifikat Vaksin', field: 'vaksinUrl' },
  { key: 'upload-skck', label: 'SKCK', field: 'skckUrl' },
];

export default function MyProfilePage() {
  const { user } = useAuthStore();
  const [citizen, setCitizen] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'data' | 'documents'>('data');
  const [editForm, setEditForm] = useState({
    noTelp: '',
    email: '',
    alamat: '',
    npwp: '',
    noBpjsKesehatan: '',
    noBpjsKetenagakerjaan: '',
  });
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);


  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await citizensService.getMyProfile();
      
      // Handle the case where the backend returns { message: '...', data: null }
      if (data && data.data === null) {
        setCitizen(null);
      } else {
        setCitizen(data);
        if (data) {
          setEditForm({
            noTelp: data.noTelp || '',
            email: data.email || '',
            alamat: data.alamat || '',
            npwp: data.npwp || '',
            noBpjsKesehatan: data.noBpjsKesehatan || '',
            noBpjsKetenagakerjaan: data.noBpjsKetenagakerjaan || '',
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await citizensService.updateMyProfile(editForm);
      await loadProfile();
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Profil berhasil diperbarui', timer: 1500, showConfirmButton: false });
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error?.response?.data?.message || 'Gagal memperbarui profil' });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await citizensService.uploadMyPhoto(file);
      await loadProfile();
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Foto profil berhasil diupdate', timer: 1500, showConfirmButton: false });
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error?.response?.data?.message || 'Gagal mengupload foto' });
    }
  };

  const handleUploadDocument = async (docType: string, file: File) => {
    try {
      setUploadingDoc(docType);
      await citizensService.uploadMyDocument(docType, file);
      await loadProfile();
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Dokumen berhasil diupload', timer: 1500, showConfirmButton: false });
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error?.response?.data?.message || 'Gagal mengupload dokumen' });
    } finally {
      setUploadingDoc(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!citizen) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Data Belum Terhubung</h3>
        <p className="text-sm text-gray-600">
          Data kependudukan Anda belum terhubung dengan akun ini.
          Hubungi admin RT/RW untuk bantuan.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Profil Saya</h1>

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-6">
          {/* Photo */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {citizen.fotoUrl ? (
                <img src={resolveFileUrl(citizen.fotoUrl)} alt="Foto" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
              <Camera className="w-4 h-4 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} />
            </label>
          </div>

          {/* Info */}
          <div>
            <h2 className="text-xl font-bold text-gray-900">{citizen.namaLengkap}</h2>
            <p className="text-sm text-gray-600">NIK: {citizen.nik}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                {user?.role && RoleLabels[user.role]}
              </span>
              <span className="text-xs text-gray-500">
                {citizen.desa && `Desa ${citizen.desa}`}
                {citizen.rw && ` / RW ${citizen.rw}`}
                {citizen.rt && ` / RT ${citizen.rt}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('data')}
          className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'data'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Data Diri
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'documents'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Dokumen
        </button>
      </div>

      {/* Tab: Data Diri */}
      {activeTab === 'data' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Read-only fields */}
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Kependudukan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'No. KK', value: citizen.noKk },
              { label: 'Jenis Kelamin', value: citizen.jenisKelamin },
              { label: 'Tempat Lahir', value: citizen.tempatLahir },
              { label: 'Tanggal Lahir', value: citizen.tanggalLahir ? new Date(citizen.tanggalLahir).toLocaleDateString('id-ID') : '-' },
              { label: 'Agama', value: citizen.agama },
              { label: 'Pendidikan', value: citizen.pendidikan },
              { label: 'Pekerjaan', value: citizen.pekerjaan },
              { label: 'Status Perkawinan', value: citizen.statusPerkawinan },
              { label: 'Hub. Keluarga', value: citizen.statusHubunganDalamKeluarga },
              { label: 'Kewarganegaraan', value: citizen.kewarganegaraan },
              { label: 'Golongan Darah', value: citizen.golonganDarah || '-' },
              { label: 'No. Akta Lahir', value: citizen.nomorAktaLahir || '-' },
              { label: 'No. Paspor', value: citizen.nomorPaspor || '-' },
            ].map((item) => (
              <div key={item.label}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{item.label}</label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">{item.value || '-'}</p>
              </div>
            ))}
          </div>

          {/* Editable fields */}
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-t pt-6">Data Kontak & Identitas Tambahan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
              <input
                type="text"
                value={editForm.noTelp}
                onChange={(e) => setEditForm({ ...editForm, noTelp: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="081234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="nama@email.com"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Domisili</label>
              <input
                type="text"
                value={editForm.alamat}
                onChange={(e) => setEditForm({ ...editForm, alamat: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NPWP</label>
              <input
                type="text"
                value={editForm.npwp}
                onChange={(e) => setEditForm({ ...editForm, npwp: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="00.000.000.0-000.000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. BPJS Kesehatan</label>
              <input
                type="text"
                value={editForm.noBpjsKesehatan}
                onChange={(e) => setEditForm({ ...editForm, noBpjsKesehatan: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. BPJS Ketenagakerjaan</label>
              <input
                type="text"
                value={editForm.noBpjsKetenagakerjaan}
                onChange={(e) => setEditForm({ ...editForm, noBpjsKetenagakerjaan: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="inline-flex items-center px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium transition-colors shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Simpan Perubahan
          </button>
        </div>
      )}

      {/* Tab: Dokumen */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DOCUMENT_TYPES.map((doc) => {
            const hasDoc = citizen[doc.field];
            const isUploading = uploadingDoc === doc.key;

            return (
              <div key={doc.key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{doc.label}</span>
                    </div>
                    {hasDoc && <Check className="w-4 h-4 text-green-600" />}
                  </div>

                  {hasDoc ? (
                    <div className="mb-3">
                      <a
                        href={resolveFileUrl(citizen[doc.field])}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Lihat dokumen
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mb-3 italic">Belum diupload</p>
                  )}
                </div>

                <label className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg cursor-pointer text-xs font-medium transition-colors">
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  {hasDoc ? 'Ganti Dokumen' : 'Upload Dokumen'}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadDocument(doc.key, file);
                    }}
                  />
                </label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
