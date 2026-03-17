import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../../services/auth.service';
import { Home, Loader2, Check, X } from 'lucide-react';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token wajib diisi'),
  newPassword: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/^(?=.*[a-z])/, 'Harus ada huruf kecil')
    .regex(/^(?=.*[A-Z])/, 'Harus ada huruf besar')
    .regex(/^(?=.*\d)/, 'Harus ada angka'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const tokenFromUrl = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: tokenFromUrl,
    },
  });

  const newPassword = watch('newPassword', '');

  const passwordRequirements = [
    { label: 'Minimal 8 karakter', met: newPassword.length >= 8 },
    { label: 'Huruf besar', met: /[A-Z]/.test(newPassword) },
    { label: 'Huruf kecil', met: /[a-z]/.test(newPassword) },
    { label: 'Angka', met: /\d/.test(newPassword) },
  ];

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError('');
    setLoading(true);

    try {
      await authService.resetPassword(data);
      setSuccess(true);

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset password gagal. Silakan coba lagi.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Berhasil Direset!</h2>
          <p className="text-gray-600 mb-4">
            Password Anda telah berhasil diubah. Silakan login dengan password baru.
          </p>
          <p className="text-sm text-gray-500">Mengarahkan ke halaman login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-4">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">WargaHub</h1>
          <p className="text-gray-600 mt-2">Reset Password</p>
        </div>

        {/* Reset Password Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Buat Password Baru</h2>
          <p className="text-gray-600 mb-6">
            Masukkan password baru Anda untuk akun ini.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!tokenFromUrl && (
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                  Reset Token
                </label>
                <input
                  id="token"
                  type="text"
                  {...register('token')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Paste token dari email"
                />
                {errors.token && (
                  <p className="mt-1 text-sm text-red-600">{errors.token.message}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Password Baru
              </label>
              <input
                id="newPassword"
                type="password"
                {...register('newPassword')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="••••••••"
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
              )}

              {/* Password strength indicator */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center text-sm">
                      {req.met ? (
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400 mr-2" />
                      )}
                      <span className={req.met ? 'text-green-600' : 'text-gray-500'}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Konfirmasi Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Mereset Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
