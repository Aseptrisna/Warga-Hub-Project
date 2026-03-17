import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { letterTemplatesService, lettersService, LetterTemplate } from '../../services/letters.service';
import { citizensService, Citizen } from '../../services/citizens.service';

const LetterRequestPage = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplate | null>(null);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [letterNumber, setLetterNumber] = useState('');

  useEffect(() => {
    loadTemplates();
    loadCitizens();
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
      const response = await citizensService.getAll({ limit: 100 });
      setCitizens(response.data);
    } catch (error) {
      console.error('Failed to load citizens:', error);
    }
  };

  // Dynamic schema based on selected template
  const createSchema = () => {
    if (!selectedTemplate) {
      return z.object({
        templateId: z.string().min(1, 'Pilih template surat'),
        citizenId: z.string().min(1, 'Pilih warga'),
      });
    }

    const fields: Record<string, any> = {
      templateId: z.string().min(1, 'Pilih template surat'),
      citizenId: z.string().min(1, 'Pilih warga'),
    };

    selectedTemplate.requiredFields.forEach((field) => {
      fields[field] = z.string().min(1, `${field} wajib diisi`);
    });

    return z.object(fields);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(createSchema()),
  });

  const templateId = watch('templateId');
  const citizenId = watch('citizenId');

  useEffect(() => {
    if (templateId) {
      const template = templates.find((t) => t.id === templateId);
      setSelectedTemplate(template || null);
    }
  }, [templateId, templates]);

  useEffect(() => {
    if (citizenId) {
      const citizen = citizens.find((c) => c.id === citizenId);
      if (citizen && selectedTemplate) {
        // Auto-fill citizen data
        setValue('nama', citizen.namaLengkap);
        setValue('nik', citizen.nik);
        setValue('tempatLahir', citizen.tempatLahir || '');
        setValue('tanggalLahir', citizen.tanggalLahir ? new Date(citizen.tanggalLahir).toLocaleDateString('id-ID') : '');
        setValue('jenisKelamin', citizen.jenisKelamin || '');
        setValue('agama', citizen.agama || '');
        setValue('pekerjaan', citizen.pekerjaan || '');
        setValue('alamat', citizen.alamat || '');
      }
    }
  }, [citizenId, citizens, selectedTemplate, setValue]);

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      const { templateId, citizenId, ...formData } = data;

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
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-lg p-6">
        {/* Template Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jenis Surat <span className="text-red-500">*</span>
          </label>
          <select
            {...register('templateId')}
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
            <p className="text-xs text-red-600 mt-1">{errors.templateId.message as string}</p>
          )}
          {selectedTemplate && (
            <p className="text-xs text-gray-600 mt-2">{selectedTemplate.description}</p>
          )}
        </div>

        {/* Citizen Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Warga <span className="text-red-500">*</span>
          </label>
          <select
            {...register('citizenId')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Pilih warga...</option>
            {citizens.map((citizen) => (
              <option key={citizen.id} value={citizen.id}>
                {citizen.namaLengkap} - {citizen.nik}
              </option>
            ))}
          </select>
          {errors.citizenId && (
            <p className="text-xs text-red-600 mt-1">{errors.citizenId.message as string}</p>
          )}
        </div>

        {/* Dynamic Fields */}
        {selectedTemplate && (
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Data Surat</h3>
            {selectedTemplate.requiredFields.map((field) => {
              // Skip fields that are auto-filled from citizen data
              const autoFilledFields = ['nama', 'nik', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 'agama', 'pekerjaan', 'alamat'];
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
                      {...register(field)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Masukkan ${field}...`}
                      readOnly={isAutoFilled}
                    />
                  ) : (
                    <input
                      type="text"
                      {...register(field)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Masukkan ${field}...`}
                      readOnly={isAutoFilled}
                    />
                  )}
                  {errors[field] && (
                    <p className="text-xs text-red-600 mt-1">{errors[field]?.message as string}</p>
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
            disabled={loading || !selectedTemplate}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Mengirim...' : 'Ajukan Surat'}
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
