import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService, ValidateNikResponse } from '../../services/auth.service';
import {
  Loader2,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  Clock,
  Search,
  Eye,
  EyeOff,
  Fingerprint,
  Shield,
  Users,
  Zap,
  Mail,
  Lock,
  Phone,
} from 'lucide-react';

// Step 1: NIK validation
const nikSchema = z.object({
  nik: z.string().regex(/^[0-9]{16}$/, 'NIK harus 16 digit angka'),
});

// Step 2: Account creation
const accountSchema = z.object({
  email: z.string().email('Email tidak valid'),
  phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Nomor telepon tidak valid').optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/^(?=.*[a-z])/, 'Harus ada huruf kecil')
    .regex(/^(?=.*[A-Z])/, 'Harus ada huruf besar')
    .regex(/^(?=.*\d)/, 'Harus ada angka'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

type NikFormData = z.infer<typeof nikSchema>;
type AccountFormData = z.infer<typeof accountSchema>;

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nikData, setNikData] = useState<ValidateNikResponse | null>(null);
  const [verifiedNik, setVerifiedNik] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 1 form
  const nikForm = useForm<NikFormData>({
    resolver: zodResolver(nikSchema),
  });

  // Step 2 form
  const accountForm = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
  });

  const password = accountForm.watch('password', '');

  const passwordRequirements = [
    { label: 'Minimal 8 karakter', met: password.length >= 8 },
    { label: 'Huruf besar', met: /[A-Z]/.test(password) },
    { label: 'Huruf kecil', met: /[a-z]/.test(password) },
    { label: 'Angka', met: /\d/.test(password) },
  ];

  // Step 1: Validate NIK
  const handleValidateNik = async (data: NikFormData) => {
    setError('');
    setLoading(true);
    try {
      const result = await authService.validateNik({ nik: data.nik });
      if (result.valid) {
        setNikData(result);
        setVerifiedNik(data.nik);
        setStep(2);
      } else {
        setError(result.message || 'NIK tidak ditemukan');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memverifikasi NIK');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Register
  const handleRegister = async (data: AccountFormData) => {
    setError('');
    setLoading(true);
    try {
      await authService.register({
        nik: verifiedNik,
        email: data.email,
        password: data.password,
        name: nikData!.nama!,
        phone: data.phone || undefined,
      });
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Success ───
  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Registrasi Berhasil!</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Akun Anda telah dibuat dan sedang menunggu aktivasi dari admin RT.
            Anda akan bisa login setelah admin menyetujui akun Anda.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
          >
            <ArrowLeft size={18} />
            Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  // ─── Branding Panel (shared) ───
  const BrandingPanel = () => (
    <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary-300/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl" />

      <div className="relative flex flex-col justify-between p-12 w-full">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white font-bold text-xl">W</span>
          </div>
          <span className="text-2xl font-bold text-white">WargaHub</span>
        </Link>

        {/* Center content */}
        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Bergabung dengan<br />WargaHub
            </h2>
            <p className="text-white/70 text-lg max-w-md">
              Daftar gratis dan nikmati layanan administrasi desa digital.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4">
            {[
              { icon: Zap, text: 'Proses pendaftaran cepat & mudah' },
              { icon: Users, text: 'Verifikasi data otomatis via NIK' },
              { icon: Shield, text: 'Data Anda aman & terenkripsi' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <item.icon size={20} className="text-white/80" />
                </div>
                <span className="text-white/80 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p className="text-white/40 text-sm">
          &copy; {new Date().getFullYear()} WargaHub. Platform Digital Desa.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      <BrandingPanel />

      {/* ─── Right Form Panel ─── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 sm:p-8">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">W</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">WargaHub</span>
            </Link>
          </div>

          {/* Back to home */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Kembali ke Beranda
          </Link>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
              Daftar Akun Baru
            </h1>
            <p className="text-gray-500">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                Masuk di sini
              </Link>
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center mb-8">
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-colors ${
                step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > 1 ? <Check size={16} /> : '1'}
              </div>
              <span className={`text-sm font-medium ${step >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                Verifikasi NIK
              </span>
            </div>
            <div className={`w-12 h-0.5 mx-3 rounded transition-colors ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`} />
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-colors ${
                step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <span className={`text-sm font-medium ${step >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>
                Buat Akun
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-red-500 text-xs font-bold">!</span>
              </div>
              <span>{error}</span>
            </div>
          )}

          {/* ─── Step 1: NIK Verification ─── */}
          {step === 1 && (
            <div>
              <div className="bg-primary-50/50 border border-primary-100 rounded-xl p-4 mb-6">
                <p className="text-sm text-primary-700">
                  Masukkan NIK Anda untuk memverifikasi data kependudukan.
                  Data Anda harus sudah terdaftar oleh admin RT/RW.
                </p>
              </div>

              <form onSubmit={nikForm.handleSubmit(handleValidateNik)} className="space-y-5">
                <div>
                  <label htmlFor="nik" className="block text-sm font-semibold text-gray-700 mb-2">
                    Nomor Induk Kependudukan (NIK)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Fingerprint size={18} className="text-gray-400" />
                    </div>
                    <input
                      id="nik"
                      type="text"
                      maxLength={16}
                      {...nikForm.register('nik')}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base tracking-widest font-mono placeholder:text-gray-400 placeholder:tracking-normal placeholder:font-sans"
                      placeholder="3201234567890001"
                    />
                  </div>
                  {nikForm.formState.errors.nik && (
                    <p className="mt-1.5 text-sm text-red-600">{nikForm.formState.errors.nik.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center text-sm shadow-lg shadow-primary-600/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Verifikasi NIK
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ─── Step 2: Create Account ─── */}
          {step === 2 && nikData && (
            <div>
              {/* Verified citizen info */}
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Data Terverifikasi</p>
                    <p className="text-sm text-emerald-700 mt-0.5 font-medium">
                      {nikData.nama}
                    </p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      {nikData.desa && `Desa ${nikData.desa}`}
                      {nikData.rw && ` / RW ${nikData.rw}`}
                      {nikData.rt && ` / RT ${nikData.rt}`}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={accountForm.handleSubmit(handleRegister)} className="space-y-5">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail size={18} className="text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      {...accountForm.register('email')}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm placeholder:text-gray-400"
                      placeholder="nama@example.com"
                    />
                  </div>
                  {accountForm.formState.errors.email && (
                    <p className="mt-1.5 text-sm text-red-600">{accountForm.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    No. Telepon
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone size={18} className="text-gray-400" />
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      {...accountForm.register('phone')}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm placeholder:text-gray-400"
                      placeholder="081234567890"
                    />
                  </div>
                  {accountForm.formState.errors.phone && (
                    <p className="mt-1.5 text-sm text-red-600">{accountForm.formState.errors.phone.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...accountForm.register('password')}
                      className="w-full pl-11 pr-12 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm placeholder:text-gray-400"
                      placeholder="Minimal 8 karakter"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {accountForm.formState.errors.password && (
                    <p className="mt-1.5 text-sm text-red-600">{accountForm.formState.errors.password.message}</p>
                  )}

                  {password && (
                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center text-xs gap-1.5">
                          {req.met ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-gray-300" />
                          )}
                          <span className={req.met ? 'text-emerald-600' : 'text-gray-400'}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Konfirmasi Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      {...accountForm.register('confirmPassword')}
                      className="w-full pl-11 pr-12 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm placeholder:text-gray-400"
                      placeholder="Ulangi password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {accountForm.formState.errors.confirmPassword && (
                    <p className="mt-1.5 text-sm text-red-600">{accountForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(''); }}
                    className="flex-1 border border-gray-300 text-gray-700 py-3.5 px-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center text-sm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] bg-primary-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center text-sm shadow-lg shadow-primary-600/20"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Mendaftar...
                      </>
                    ) : (
                      <>
                        Daftar Sekarang
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
