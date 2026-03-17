import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../stores/auth.store';
import { authService } from '../../services/auth.service';
import {
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Users,
  FileText,
  ArrowLeft,
  Mail,
  Lock,
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(data);

      login(
        response.user,
        response.accessToken,
        response.refreshToken,
      );

      navigate('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login gagal. Silakan coba lagi.';
      if (message.includes('belum diaktifkan') || message.includes('tidak aktif')) {
        setError('Akun Anda belum diaktifkan. Hubungi admin RT Anda untuk proses aktivasi.');
      } else {
        setError(message);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ─── Left Branding Panel ─── */}
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
                Selamat Datang<br />Kembali
              </h2>
              <p className="text-white/70 text-lg max-w-md">
                Masuk ke akun Anda untuk mengelola administrasi desa secara digital.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="space-y-4">
              {[
                { icon: Users, text: 'Kelola data warga & keluarga' },
                { icon: FileText, text: 'Buat surat otomatis' },
                { icon: Shield, text: 'Aman dengan enkripsi & RBAC' },
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

      {/* ─── Right Form Panel ─── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 sm:p-8">
        <div className="w-full max-w-md">
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
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
              Masuk ke Akun
            </h1>
            <p className="text-gray-500">
              Belum punya akun?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                Daftar gratis
              </Link>
            </p>
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

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm placeholder:text-gray-400"
                  placeholder="nama@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="w-full pl-11 pr-12 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm placeholder:text-gray-400"
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center text-sm shadow-lg shadow-primary-600/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
