import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Mail,
  ArrowRight,
} from 'lucide-react';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (token) {
      verifyToken(token);
    } else {
      setStatus('error');
      setMessage('Token verifikasi tidak ditemukan. Pastikan Anda menggunakan link yang benar dari email.');
    }
  }, [token]);

  const verifyToken = async (t: string) => {
    try {
      const response = await authService.verifyEmail(t);
      setStatus('success');
      setMessage(response.message);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Verifikasi gagal. Token mungkin sudah kadaluarsa.');
    }
  };

  const handleResend = async () => {
    if (!resendEmail) return;
    setResending(true);
    setResendMessage('');
    try {
      const response = await authService.resendVerification(resendEmail);
      setResendMessage(response.message);
    } catch (err: any) {
      setResendMessage(err.response?.data?.message || 'Gagal mengirim ulang email verifikasi.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">WargaHub</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {status === 'loading' && (
            <div className="text-center">
              <Loader2 size={48} className="mx-auto text-primary-600 animate-spin mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Memverifikasi Email...</h2>
              <p className="text-gray-500 text-sm">Mohon tunggu sebentar.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Terverifikasi!</h2>
              <p className="text-gray-500 text-sm mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
              >
                Login Sekarang <ArrowRight size={18} />
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle size={32} className="text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifikasi Gagal</h2>
              <p className="text-gray-500 text-sm mb-6">{message}</p>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Kirim ulang email verifikasi:</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="Email Anda"
                    />
                  </div>
                  <button
                    onClick={handleResend}
                    disabled={resending || !resendEmail}
                    className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {resending ? <Loader2 size={16} className="animate-spin" /> : 'Kirim'}
                  </button>
                </div>
                {resendMessage && (
                  <p className="text-xs text-green-600 mt-2">{resendMessage}</p>
                )}
              </div>

              <Link
                to="/login"
                className="text-sm text-primary-600 font-medium hover:underline"
              >
                Kembali ke Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
