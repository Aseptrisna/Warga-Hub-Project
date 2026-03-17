import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../../services/auth.service';
import {
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Building,
  CheckCircle2,
  Shield,
  Users,
  FileText,
} from 'lucide-react';

// Step 1: Admin data
const adminSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Nomor telepon tidak valid').or(z.literal('')).optional(),
  password: z.string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[a-z]/, 'Harus mengandung huruf kecil')
    .regex(/[A-Z]/, 'Harus mengandung huruf besar')
    .regex(/[0-9]/, 'Harus mengandung angka'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

// Step 2: Desa data
const desaSchema = z.object({
  desaName: z.string().min(3, 'Nama desa minimal 3 karakter'),
  provinsi: z.string().optional(),
  kabupaten: z.string().optional(),
  kecamatan: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  desaPhone: z.string().optional(),
  desaEmail: z.string().email('Email tidak valid').or(z.literal('')).optional(),
  leaderName: z.string().optional(),
});

type AdminFormData = z.infer<typeof adminSchema>;
type DesaFormData = z.infer<typeof desaSchema>;

export default function RegisterDesaPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [adminData, setAdminData] = useState<AdminFormData | null>(null);

  const adminForm = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
  });

  const desaForm = useForm<DesaFormData>({
    resolver: zodResolver(desaSchema),
  });

  const onAdminSubmit = (data: AdminFormData) => {
    setAdminData(data);
    setStep(2);
  };

  const onDesaSubmit = async (data: DesaFormData) => {
    if (!adminData) return;
    setError('');
    setLoading(true);

    try {
      await authService.registerDesa({
        name: adminData.name,
        email: adminData.email,
        phone: adminData.phone || undefined,
        password: adminData.password,
        desaName: data.desaName,
        provinsi: data.provinsi || undefined,
        kabupaten: data.kabupaten || undefined,
        kecamatan: data.kecamatan || undefined,
        address: data.address || undefined,
        postalCode: data.postalCode || undefined,
        desaPhone: data.desaPhone || undefined,
        desaEmail: data.desaEmail || undefined,
        leaderName: data.leaderName || undefined,
      });
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const password = adminForm.watch('password') || '';
  const checks = [
    { label: 'Min. 8 karakter', ok: password.length >= 8 },
    { label: 'Huruf besar', ok: /[A-Z]/.test(password) },
    { label: 'Huruf kecil', ok: /[a-z]/.test(password) },
    { label: 'Angka', ok: /[0-9]/.test(password) },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl" />

        <div className="relative flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <span className="text-white text-2xl font-bold">WargaHub</span>
          </Link>

          <div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Daftarkan Desa Anda
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Digitalisasi administrasi desa Anda dengan platform modern dan gratis.
            </p>

            <div className="space-y-4">
              {[
                { icon: Users, text: 'Kelola data warga & keluarga' },
                { icon: FileText, text: 'Surat menyurat otomatis' },
                { icon: Shield, text: 'Keamanan & ronda digital' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-3 text-white/80">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} />
                  </div>
                  <span className="text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step >= s ? 'bg-white text-primary-700' : 'bg-white/20 text-white/60'
                }`}>
                  {step > s ? <CheckCircle2 size={16} /> : s}
                </div>
                {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-white' : 'bg-white/20'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
            <ArrowLeft size={16} /> Kembali
          </Link>

          {/* Step 1: Admin Data */}
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Data Admin Desa</h1>
              <p className="text-gray-500 mb-6">Anda akan menjadi admin utama yang mengelola desa.</p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>
              )}

              <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      {...adminForm.register('name')}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                  {adminForm.formState.errors.name && (
                    <p className="text-red-500 text-xs mt-1">{adminForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      {...adminForm.register('email')}
                      type="email"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="admin@desa.id"
                    />
                  </div>
                  {adminForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">{adminForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon <span className="text-gray-400">(opsional)</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      {...adminForm.register('phone')}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="081234567890"
                    />
                  </div>
                  {adminForm.formState.errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{adminForm.formState.errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      {...adminForm.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="Min. 8 karakter"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {checks.map((c) => (
                      <span key={c.label} className={`text-xs px-2 py-0.5 rounded-full ${c.ok ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.ok ? '\u2713' : '\u2022'} {c.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      {...adminForm.register('confirmPassword')}
                      type={showConfirm ? 'text' : 'password'}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="Ulangi password"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {adminForm.formState.errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{adminForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Lanjut <ArrowRight size={18} />
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Sudah punya akun?{' '}
                <Link to="/login" className="text-primary-600 font-semibold hover:underline">Masuk</Link>
              </p>
              <p className="text-center text-sm text-gray-500 mt-2">
                Daftar sebagai warga?{' '}
                <Link to="/register" className="text-primary-600 font-semibold hover:underline">Daftar Warga</Link>
              </p>
            </>
          )}

          {/* Step 2: Desa Data */}
          {step === 2 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Data Desa</h1>
              <p className="text-gray-500 mb-6">Informasi desa yang akan didaftarkan.</p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>
              )}

              <form onSubmit={desaForm.handleSubmit(onDesaSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Desa *</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      {...desaForm.register('desaName')}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="contoh: Desa Sukamaju"
                    />
                  </div>
                  {desaForm.formState.errors.desaName && (
                    <p className="text-red-500 text-xs mt-1">{desaForm.formState.errors.desaName.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label>
                    <input
                      {...desaForm.register('provinsi')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="Jawa Barat"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kabupaten</label>
                    <input
                      {...desaForm.register('kabupaten')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="Bandung"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label>
                    <input
                      {...desaForm.register('kecamatan')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="Baleendah"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kode Pos</label>
                    <input
                      {...desaForm.register('postalCode')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="40375"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                    <textarea
                      {...desaForm.register('address')}
                      rows={2}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none"
                      placeholder="Jl. Raya Sukamaju No.100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telepon Desa</label>
                    <input
                      {...desaForm.register('desaPhone')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="(022) 1234567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Desa</label>
                    <input
                      {...desaForm.register('desaEmail')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="desa@email.id"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kepala Desa <span className="text-gray-400">(opsional)</span></label>
                  <input
                    {...desaForm.register('leaderName')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    placeholder="H. Suharto, S.Sos"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft size={18} /> Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Daftarkan Desa'}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">Pendaftaran Berhasil!</h1>
              <p className="text-gray-500 mb-8">
                Email verifikasi telah dikirim ke <strong>{adminData?.email}</strong>. Silakan cek inbox (dan folder spam) Anda untuk mengaktifkan akun.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-700">
                Link verifikasi berlaku selama 24 jam. Setelah verifikasi, Anda dapat langsung login dan mulai mengelola desa.
              </div>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
              >
                Ke Halaman Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
