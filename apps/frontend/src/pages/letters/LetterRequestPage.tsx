import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { letterTemplatesService, lettersService, LetterTemplate } from '../../services/letters.service';
import { citizensService, Citizen } from '../../services/citizens.service';
import { useAuthStore } from '../../stores/auth.store';
import { Role } from '@shared/role.enum';

const LetterRequestPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplate | null>(null);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [letterNumber, setLetterNumber] = useState('');

  // Controlled form state
  const [templateId, setTemplateId] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const init = async () => {
      setInitialLoading(true);
      await Promise.all([loadTemplates(), loadCitizens()]);
      setInitialLoading(false);
    };
    init();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await letterTemplatesService.getAll({ isActive: true });
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadCitizens = async () => {
    try {
      if (user?.role === Role.WARGA) {
        const profile = await citizensService.getMyProfile();
        if (profile?.noKk) {
          const response = await citizensService.getAll({ noKk: profile.noKk, limit: 50 });
          setCitizens(response.data);
        }
      } else {
        const response = await citizensService.getAll({ limit: 100 });
        setCitizens(response.data);
      }
    } catch (error) {
      console.error('Failed to load citizens:', error);
    }
  };

  // When template selection changes
  const handleTemplateChange = (id: string) => {
    setTemplateId(id);
    const template = templates.find((t) => t.id === id) || null;
    setSelectedTemplate(template);
    // Reset form data when template changes
    setFormData({});
    setCitizenId('');
    setErrors({});
  };

  // When citizen selection changes - auto-fill fields
  const handleCitizenChange = (id: string) => {
    setCitizenId(id);
    const citizen = citizens.find((c) => c.id === id);
    if (citizen && selectedTemplate) {
      const autoFill: Record<string, string> = {
        nama: citizen.namaLengkap || '',
        nik: citizen.nik || '',
        tempatLahir: citizen.tempatLahir || '',
        tanggalLahir: citizen.tanggalLahir
          ? new Date(citizen.tanggalLahir).toLocaleDateString('id-ID')
          : '',
        jenisKelamin: citizen.jenisKelamin || '',
        agama: citizen.agama || '',
        pekerjaan: citizen.pekerjaan || '',
        alamat: citizen.alamat || '',
      };
      setFormData((prev) => ({ ...prev, ...autoFill }));
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!templateId) newErrors.templateId = 'Pilih jenis surat';
    if (!citizenId) newErrors.citizenId = 'Pilih warga';

    if (selectedTemplate) {
      selectedTemplate.requiredFields.forEach((field) => {
        if (!formData[field] || formData[field].trim() === '') {
          newErrors[field] = `${field} wajib diisi`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);
      const response = await lettersService.create({
        templateId,
        citizenId,
        data: formData,
      });

      setLetterNumber(response.letterNumber);
      setSubmitted(true);
    } catch (error: any) {
      console.error('Failed to submit letter:', error);
      alert(error.response?.data?.message || 'Gagal mengajukan surat');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Surat Berhasil Diajukan!</h2>
          <p className="text-gray-600 mb-1">Nomor Surat:</p>
          <p className="text-xl font-semibold text-blue-600 mb-4">{letterNumber}</p>
          <p className="text-sm text-gray-600 mb-6">
            Surat Anda sedang diproses dan akan melewati tahap persetujuan RT → RW → Desa.
            <br />
            Anda akan menerima notifikasi saat surat telah disetujui.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/letters')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Lihat Daftar Surat
            </button>
            <button
              onClick={() => {
                setSubmitted(false);
                setSelectedTemplate(null);
                setTemplateId('');
                setCitizenId('');
                setFormData({});
                setErrors({});
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Ajukan Surat Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Memuat data...</span>
        </div>
      </div>
    );
  }

  const autoFilledFields = ['nama', 'nik', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 'agama', 'pekerjaan', 'alamat'];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/letters')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Ajukan Surat Baru</h1>
        <p className="text-sm text-gray-600 mt-1">
          Isi formulir di bawah ini untuk mengajukan permohonan surat
        </p>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-lg p-6">
        {/* Template Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jenis Surat <span className="text-red-500">*</span>
          </label>
          <select
            value={templateId}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Pilih jenis surat...</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.code})
              </option>
            ))}
          </select>
          {errors.templateId && (
            <p className="text-xs text-red-600 mt-1">{errors.templateId}</p>
          )}
          {selectedTemplate && (
            <p className="text-xs text-gray-600 mt-2">{selectedTemplate.description}</p>
          )}
        </div>

        {/* Citizen Selection */}
        {selectedTemplate && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {user?.role === Role.WARGA ? 'Anggota Keluarga' : 'Warga'} <span className="text-red-500">*</span>
            </label>
            <select
              value={citizenId}
              onChange={(e) => handleCitizenChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{user?.role === Role.WARGA ? 'Pilih anggota keluarga...' : 'Pilih warga...'}</option>
              {citizens.map((citizen) => (
                <option key={citizen.id} value={citizen.id}>
                  {citizen.namaLengkap} - {citizen.nik}
                  {user?.role === Role.WARGA && citizen.statusHubunganDalamKeluarga ? ` (${citizen.statusHubunganDalamKeluarga})` : ''}
                </option>
              ))}
            </select>
            {errors.citizenId && (
              <p className="text-xs text-red-600 mt-1">{errors.citizenId}</p>
            )}
          </div>
        )}

        {/* Dynamic Fields */}
        {selectedTemplate && citizenId && (
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Data Surat</h3>
            {selectedTemplate.requiredFields.map((field) => {
              const isAutoFilled = autoFilledFields.includes(field);

              return (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}{' '}
                    <span className="text-red-500">*</span>
                    {isAutoFilled && <span className="text-xs text-gray-500 ml-2">(otomatis terisi)</span>}
                  </label>
                  {field === 'alamat' || field.includes('keterangan') ? (
                    <textarea
                      value={formData[field] || ''}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Masukkan ${field}...`}
                      readOnly={isAutoFilled}
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData[field] || ''}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Masukkan ${field}...`}
                      readOnly={isAutoFilled}
                    />
                  )}
                  {errors[field] && (
                    <p className="text-xs text-red-600 mt-1">{errors[field]}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading || !selectedTemplate || !citizenId}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Mengirim...
              </span>
            ) : (
              'Ajukan Surat'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/letters')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
};

export default LetterRequestPage;
