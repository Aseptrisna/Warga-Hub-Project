import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { citizensService } from '../../services/citizens.service';
import { useAuthStore } from '../../stores/auth.store';
import { Role } from '@shared/role.enum';
import Swal from 'sweetalert2';

const AGAMA_OPTIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
const JENIS_KELAMIN_OPTIONS = ['Laki-laki', 'Perempuan'];
const STATUS_KAWIN_OPTIONS = ['Kawin', 'Belum Kawin', 'Cerai Hidup', 'Cerai Mati'];
const HUB_KELUARGA_OPTIONS = ['Kepala Keluarga', 'Istri', 'Anak', 'Orang Tua', 'Mertua', 'Famili Lain', 'Pembantu', 'Lainnya'];
const PENDIDIKAN_OPTIONS = ['Tidak Sekolah', 'SD', 'SMP', 'SMA', 'SMK', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3'];
const GOL_DARAH_OPTIONS = ['A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Tidak Tahu'];
const STATUS_RUMAH_OPTIONS = ['Milik Sendiri', 'Kontrak', 'Sewa', 'Bebas Sewa', 'Dinas', 'Lainnya'];
const KEWARGANEGARAAN_OPTIONS = ['WNI', 'WNA'];
const STATUS_KEPENDUDUKAN_OPTIONS = ['Aktif', 'Pindah', 'Meninggal'];

const PLATFORM_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM];

interface FormData {
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
  namaAyah: string;
  namaIbu: string;
  alamat: string;
  rt: string;
  rw: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
  noTelp: string;
  email: string;
  kewarganegaraan: string;
  golonganDarah: string;
  npwp: string;
  nomorAktaLahir: string;
  nomorPaspor: string;
  statusKepemilikanRumah: string;
  statusKependudukan: string;
  noBpjsKesehatan: string;
  noBpjsKetenagakerjaan: string;
  keterangan: string;
}

const defaultForm: FormData = {
  nik: '',
  noKk: '',
  namaLengkap: '',
  jenisKelamin: 'Laki-laki',
  tempatLahir: '',
  tanggalLahir: '',
  agama: 'Islam',
  pendidikan: 'SMA',
  pekerjaan: '',
  statusPerkawinan: 'Belum Kawin',
  statusHubunganDalamKeluarga: 'Kepala Keluarga',
  namaAyah: '',
  namaIbu: '',
  alamat: '',
  rt: '',
  rw: '',
  desa: '',
  kecamatan: '',
  kabupaten: '',
  provinsi: '',
  kodePos: '',
  noTelp: '',
  email: '',
  kewarganegaraan: 'WNI',
  golonganDarah: '',
  npwp: '',
  nomorAktaLahir: '',
  nomorPaspor: '',
  statusKepemilikanRumah: '',
  statusKependudukan: 'Aktif',
  noBpjsKesehatan: '',
  noBpjsKetenagakerjaan: '',
  keterangan: '',
};

export default function CitizenFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { user } = useAuthStore();
  const role = user?.role as Role;
  const isPlatform = PLATFORM_ROLES.includes(role);

  // Determine which region fields are locked by user scope
  const scopedDesa = !isPlatform && user?.desa ? user.desa : '';
  const scopedRW = !isPlatform && user?.rw ? user.rw : '';
  const scopedRT = !isPlatform && user?.rt ? user.rt : '';

  const [form, setForm] = useState<FormData>({
    ...defaultForm,
    desa: scopedDesa,
    rw: scopedRW,
    rt: scopedRT,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && id) {
      loadCitizen();
    }
  }, [id]);

  const loadCitizen = async () => {
    try {
      setLoading(true);
      const data = await citizensService.getById(id!);
      setForm({
        nik: data.nik || '',
        noKk: data.noKk || '',
        namaLengkap: data.namaLengkap || '',
        jenisKelamin: data.jenisKelamin || 'Laki-laki',
        tempatLahir: data.tempatLahir || '',
        tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir).toISOString().split('T')[0] : '',
        agama: data.agama || 'Islam',
        pendidikan: data.pendidikan || 'SMA',
        pekerjaan: data.pekerjaan || '',
        statusPerkawinan: data.statusPerkawinan || 'Belum Kawin',
        statusHubunganDalamKeluarga: data.statusHubunganDalamKeluarga || 'Kepala Keluarga',
        namaAyah: data.namaAyah || '',
        namaIbu: data.namaIbu || '',
        alamat: data.alamat || '',
        rt: data.rt || scopedRT,
        rw: data.rw || scopedRW,
        desa: data.desa || scopedDesa,
        kecamatan: data.kecamatan || '',
        kabupaten: data.kabupaten || '',
        provinsi: data.provinsi || '',
        kodePos: data.kodePos || '',
        noTelp: data.noTelp || '',
        email: data.email || '',
        kewarganegaraan: data.kewarganegaraan || 'WNI',
        golonganDarah: data.golonganDarah || '',
        npwp: data.npwp || '',
        nomorAktaLahir: data.nomorAktaLahir || '',
        nomorPaspor: data.nomorPaspor || '',
        statusKepemilikanRumah: data.statusKepemilikanRumah || '',
        statusKependudukan: data.statusKependudukan || 'Aktif',
        noBpjsKesehatan: data.noBpjsKesehatan || '',
        noBpjsKetenagakerjaan: data.noBpjsKetenagakerjaan || '',
        keterangan: data.keterangan || '',
      });
    } catch (error: any) {
      console.error('Error loading citizen:', error);
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Gagal memuat data warga' });
      navigate('/citizens');
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.nik) newErrors.nik = 'NIK wajib diisi';
    else if (!/^\d{16}$/.test(form.nik)) newErrors.nik = 'NIK harus 16 digit angka';

    if (!form.noKk) newErrors.noKk = 'No. KK wajib diisi';
    else if (!/^\d{16}$/.test(form.noKk)) newErrors.noKk = 'No. KK harus 16 digit angka';

    if (!form.namaLengkap) newErrors.namaLengkap = 'Nama lengkap wajib diisi';
    if (!form.tempatLahir) newErrors.tempatLahir = 'Tempat lahir wajib diisi';
    if (!form.tanggalLahir) newErrors.tanggalLahir = 'Tanggal lahir wajib diisi';
    if (!form.alamat) newErrors.alamat = 'Alamat wajib diisi';
    if (!form.rt) newErrors.rt = 'RT wajib diisi';
    if (!form.rw) newErrors.rw = 'RW wajib diisi';
    if (!form.desa) newErrors.desa = 'Desa wajib diisi';

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSaving(true);
      const payload = { ...form };
      // Remove empty optional fields
      Object.keys(payload).forEach((key) => {
        if (payload[key as keyof FormData] === '') {
          delete (payload as any)[key];
        }
      });
      // Keep required fields even if empty
      payload.nik = form.nik;
      payload.noKk = form.noKk;
      payload.namaLengkap = form.namaLengkap;
      payload.alamat = form.alamat;
      payload.rt = form.rt;
      payload.rw = form.rw;
      payload.desa = form.desa;

      if (isEdit) {
        await citizensService.update(id!, payload);
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data warga berhasil diperbarui', timer: 2000, showConfirmButton: false });
        navigate(`/citizens/${id}`);
      } else {
        const result = await citizensService.create(payload);
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data warga berhasil ditambahkan', timer: 2000, showConfirmButton: false });
        navigate(`/citizens/${result.data?.id || ''}`);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Gagal menyimpan data warga';
      Swal.fire({ icon: 'error', title: 'Gagal', text: Array.isArray(msg) ? msg.join(', ') : msg });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const InputField = ({ label, field, required, type = 'text', placeholder, maxLength, readOnly }: {
    label: string; field: keyof FormData; required?: boolean; type?: string; placeholder?: string; maxLength?: number; readOnly?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={form[field]}
        onChange={(e) => handleChange(field, e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        readOnly={readOnly}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
          readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
        } ${errors[field] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
      />
      {readOnly && (
        <p className="text-xs text-gray-400 mt-0.5">Otomatis sesuai wilayah Anda</p>
      )}
      {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
    </div>
  );

  const SelectField = ({ label, field, options, required }: {
    label: string; field: keyof FormData; options: string[]; required?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={form[field]}
        onChange={(e) => handleChange(field, e.target.value)}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
          errors[field] ? 'border-red-500 bg-red-50' : 'border-gray-300'
        }`}
      >
        <option value="">-- Pilih --</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(isEdit ? `/citizens/${id}` : '/citizens')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {isEdit ? 'Kembali ke Detail' : 'Kembali ke Daftar Warga'}
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Data Warga' : 'Tambah Warga Baru'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit ? 'Perbarui data warga yang sudah terdaftar' : 'Isi formulir berikut untuk mendaftarkan warga baru'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Identitas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="NIK" field="nik" required placeholder="16 digit NIK" maxLength={16} />
            <InputField label="No. Kartu Keluarga" field="noKk" required placeholder="16 digit No. KK" maxLength={16} />
            <div className="md:col-span-2">
              <InputField label="Nama Lengkap" field="namaLengkap" required placeholder="Sesuai KTP" />
            </div>
            <SelectField label="Jenis Kelamin" field="jenisKelamin" options={JENIS_KELAMIN_OPTIONS} required />
            <InputField label="Tempat Lahir" field="tempatLahir" required placeholder="Kota kelahiran" />
            <InputField label="Tanggal Lahir" field="tanggalLahir" required type="date" />
            <SelectField label="Agama" field="agama" options={AGAMA_OPTIONS} required />
            <SelectField label="Golongan Darah" field="golonganDarah" options={GOL_DARAH_OPTIONS} />
            <SelectField label="Kewarganegaraan" field="kewarganegaraan" options={KEWARGANEGARAAN_OPTIONS} />
          </div>
        </div>

        {/* Keluarga */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Keluarga</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label="Status Perkawinan" field="statusPerkawinan" options={STATUS_KAWIN_OPTIONS} required />
            <SelectField label="Hubungan Dalam Keluarga" field="statusHubunganDalamKeluarga" options={HUB_KELUARGA_OPTIONS} required />
            <InputField label="Nama Ayah" field="namaAyah" placeholder="Nama ayah kandung" />
            <InputField label="Nama Ibu" field="namaIbu" placeholder="Nama ibu kandung" />
          </div>
        </div>

        {/* Pendidikan & Pekerjaan */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pendidikan & Pekerjaan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label="Pendidikan Terakhir" field="pendidikan" options={PENDIDIKAN_OPTIONS} required />
            <InputField label="Pekerjaan" field="pekerjaan" placeholder="Jenis pekerjaan" />
          </div>
        </div>

        {/* Alamat */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alamat</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <InputField label="Alamat Lengkap" field="alamat" required placeholder="Jalan, gang, nomor rumah" />
            </div>
            <InputField label="RT" field="rt" required placeholder="001" maxLength={3} readOnly={!!scopedRT} />
            <InputField label="RW" field="rw" required placeholder="001" maxLength={3} readOnly={!!scopedRW} />
            <InputField label="Desa / Kelurahan" field="desa" required placeholder="Nama desa" readOnly={!!scopedDesa} />
            <InputField label="Kecamatan" field="kecamatan" placeholder="Nama kecamatan" />
            <InputField label="Kabupaten / Kota" field="kabupaten" placeholder="Nama kabupaten" />
            <InputField label="Provinsi" field="provinsi" placeholder="Nama provinsi" />
            <InputField label="Kode Pos" field="kodePos" placeholder="12345" maxLength={5} />
            <SelectField label="Status Kepemilikan Rumah" field="statusKepemilikanRumah" options={STATUS_RUMAH_OPTIONS} />
          </div>
        </div>

        {/* Kontak */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kontak</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="No. Telepon / HP" field="noTelp" placeholder="08xxxxxxxxxx" />
            <InputField label="Email" field="email" type="email" placeholder="contoh@email.com" />
          </div>
        </div>

        {/* Dokumen Tambahan */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Tambahan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="No. Akta Lahir" field="nomorAktaLahir" placeholder="Nomor akta lahir" />
            <InputField label="No. Paspor" field="nomorPaspor" placeholder="Nomor paspor (jika ada)" />
            <InputField label="NPWP" field="npwp" placeholder="Nomor NPWP" />
            <InputField label="No. BPJS Kesehatan" field="noBpjsKesehatan" placeholder="Nomor BPJS Kesehatan" />
            <InputField label="No. BPJS Ketenagakerjaan" field="noBpjsKetenagakerjaan" placeholder="Nomor BPJS TK" />
            <SelectField label="Status Kependudukan" field="statusKependudukan" options={STATUS_KEPENDUDUKAN_OPTIONS} />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
              <textarea
                value={form.keterangan}
                onChange={(e) => handleChange('keterangan', e.target.value)}
                rows={3}
                placeholder="Catatan tambahan (opsional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/citizens/${id}` : '/citizens')}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
            ) : (
              <><Save className="w-4 h-4" /> {isEdit ? 'Simpan Perubahan' : 'Tambah Warga'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
