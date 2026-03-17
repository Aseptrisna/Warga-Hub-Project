import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { familiesService } from '../../services/families.service';
import { useAuthStore } from '../../stores/auth.store';
import { canPerformAction } from '../../config/permissions';
import { ArrowLeft, Users, Upload, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';
import Swal from 'sweetalert2';

export default function FamilyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canEdit = user ? canPerformAction(user.role, 'families', 'edit') : false;
  const [family, setFamily] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) loadData(); }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [familyRes, membersRes] = await Promise.all([
        familiesService.getById(id!),
        familiesService.getMembers(id!),
      ]);
      setFamily(familyRes);
      setMembers(membersRes.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadKK = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await familiesService.uploadKK(id!, file);
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'File KK berhasil diupload', timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengupload file' });
    }
  };

  const handleSyncMembers = async () => {
    try {
      await familiesService.syncMembers(id!);
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Jumlah anggota berhasil disinkronkan', timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal sinkronisasi' });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  if (!family) {
    return <div className="p-8 text-center text-gray-500">Data tidak ditemukan</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/families')} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detail Kartu Keluarga</h1>
            <p className="text-gray-600 mt-1">No. KK: {family.noKk}</p>
          </div>
        </div>
        {canEdit && (
          <div className="flex space-x-2">
            <button onClick={handleSyncMembers} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              <RefreshCw className="w-4 h-4 mr-2" />Sync Anggota
            </button>
          </div>
        )}
      </div>

      {/* Family Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Keluarga</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">No. Kartu Keluarga</p>
              <p className="font-mono font-semibold text-gray-900">{family.noKk}</p>
            </div>
            <div>
              <p className="text-gray-500">Kepala Keluarga</p>
              <p className="font-semibold text-gray-900">{family.kepalaKeluargaNama}</p>
            </div>
            <div>
              <p className="text-gray-500">Alamat</p>
              <p className="text-gray-900">{family.alamat}</p>
            </div>
            <div>
              <p className="text-gray-500">RT / RW</p>
              <p className="text-gray-900">{family.rt} / {family.rw}</p>
            </div>
            <div>
              <p className="text-gray-500">Desa / Kelurahan</p>
              <p className="text-gray-900">{family.desa}</p>
            </div>
            <div>
              <p className="text-gray-500">Kecamatan</p>
              <p className="text-gray-900">{family.kecamatan || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500">Kabupaten</p>
              <p className="text-gray-900">{family.kabupaten || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500">Provinsi</p>
              <p className="text-gray-900">{family.provinsi || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500">Jumlah Anggota</p>
              <p className="text-gray-900">{family.jumlahAnggota} orang</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <span className={cn('px-2 py-1 rounded-full text-xs font-medium', family.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                {family.isActive ? 'Aktif' : 'Tidak Aktif'}
              </span>
            </div>
          </div>
        </div>

        {/* KK Scan Upload */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan KK</h3>
          {family.kkUrl ? (
            <div className="space-y-3">
              <img src={family.kkUrl} alt="Scan KK" className="w-full rounded-lg border border-gray-200" onError={(e) => { (e.target as any).style.display = 'none'; }} />
              <a href={family.kkUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline">Lihat file</a>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Upload className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada scan KK</p>
            </div>
          )}
          {canEdit && (
            <label className="block mt-4">
              <span className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer text-sm">
                <Upload className="w-4 h-4 mr-2" />Upload KK
              </span>
              <input type="file" accept="image/*,.pdf" onChange={handleUploadKK} className="hidden" />
            </label>
          )}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="w-5 h-5 mr-2" />Anggota Keluarga ({members.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIK</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Lengkap</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hub. Keluarga</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis Kelamin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tempat/Tgl Lahir</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pekerjaan</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Belum ada data anggota keluarga</td></tr>
              ) : members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/citizens/${m.id}`)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{m.nik}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{m.namaLengkap}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium',
                      m.statusHubunganDalamKeluarga === 'Kepala Keluarga' ? 'bg-purple-100 text-purple-800' :
                      m.statusHubunganDalamKeluarga === 'Istri' ? 'bg-pink-100 text-pink-800' :
                      'bg-gray-100 text-gray-800'
                    )}>
                      {m.statusHubunganDalamKeluarga}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{m.jenisKelamin}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {m.tempatLahir}, {m.tanggalLahir ? new Date(m.tanggalLahir).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{m.pekerjaan || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
