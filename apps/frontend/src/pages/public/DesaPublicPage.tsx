import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicRegionsService } from '../../services/regions.service';
import { resolveFileUrl } from '../../utils/file-url';
import {
  Loader2, MapPin, Phone, Mail, Users, ArrowLeft,
  CheckCircle2, Globe,
} from 'lucide-react';

interface DesaLanding {
  name: string;
  description?: string;
  address?: string;
  provinsi?: string;
  kabupaten?: string;
  kecamatan?: string;
  phone?: string;
  email?: string;
  leaderName?: string;
  logoUrl?: string;
  bannerUrl?: string;
  subdomain?: string;
  totalCitizens?: number;
  totalFamilies?: number;
  landingConfig?: {
    heroTitle?: string;
    heroSubtitle?: string;
    aboutText?: string;
    features?: string[];
    contactPhone?: string;
    contactEmail?: string;
    socialMedia?: Record<string, string>;
  };
}

export default function DesaPublicPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [data, setData] = useState<DesaLanding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (subdomain) loadData(subdomain);
  }, [subdomain]);

  const loadData = async (sub: string) => {
    try {
      const result = await publicRegionsService.getDesaLanding(sub);
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Desa tidak ditemukan');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Globe className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Desa Tidak Ditemukan</h1>
          <p className="text-gray-500 mb-6">{error || 'Halaman yang Anda cari tidak tersedia.'}</p>
          <Link to="/" className="inline-flex items-center gap-2 text-primary-600 font-medium hover:underline">
            <ArrowLeft size={16} /> Kembali ke WargaHub
          </Link>
        </div>
      </div>
    );
  }

  const config = data.landingConfig || {};

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {data.logoUrl ? (
                <img src={resolveFileUrl(data.logoUrl)} alt="Logo" className="w-9 h-9 rounded-xl object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{data.name.charAt(0)}</span>
                </div>
              )}
              <span className="text-xl font-bold text-gray-900">{data.name}</span>
            </div>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary-300/20 rounded-full blur-3xl" />

        {data.bannerUrl && (
          <div className="absolute inset-0">
            <img src={resolveFileUrl(data.bannerUrl)} alt="Banner" className="w-full h-full object-cover opacity-20" />
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            {config.heroTitle || `Selamat Datang di ${data.name}`}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
            {config.heroSubtitle || data.description || 'Desa digital modern dengan layanan terpadu untuk warga.'}
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 sm:gap-12">
            {data.totalCitizens !== undefined && data.totalCitizens > 0 && (
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{data.totalCitizens.toLocaleString()}</div>
                <div className="text-sm text-white/70">Warga</div>
              </div>
            )}
            {data.totalFamilies !== undefined && data.totalFamilies > 0 && (
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{data.totalFamilies.toLocaleString()}</div>
                <div className="text-sm text-white/70">Keluarga</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About */}
      {config.aboutText && (
        <section className="py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Tentang {data.name}</h2>
            <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">{config.aboutText}</p>
          </div>
        </section>
      )}

      {/* Features */}
      {config.features && config.features.length > 0 && (
        <section className="py-16 lg:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Layanan Desa</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {config.features.map((f, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={20} className="text-primary-600" />
                  </div>
                  <span className="text-gray-800 font-medium">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Info & Contact */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Informasi Desa</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.address && (
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="text-primary-600" size={20} />
                  <h3 className="font-semibold text-gray-900">Alamat</h3>
                </div>
                <p className="text-sm text-gray-600">{data.address}</p>
                {(data.kecamatan || data.kabupaten || data.provinsi) && (
                  <p className="text-sm text-gray-500 mt-1">
                    {[data.kecamatan, data.kabupaten, data.provinsi].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            )}
            {(data.phone || config.contactPhone) && (
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Phone className="text-primary-600" size={20} />
                  <h3 className="font-semibold text-gray-900">Telepon</h3>
                </div>
                <p className="text-sm text-gray-600">{config.contactPhone || data.phone}</p>
              </div>
            )}
            {(data.email || config.contactEmail) && (
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Mail className="text-primary-600" size={20} />
                  <h3 className="font-semibold text-gray-900">Email</h3>
                </div>
                <p className="text-sm text-gray-600">{config.contactEmail || data.email}</p>
              </div>
            )}
            {data.leaderName && (
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="text-primary-600" size={20} />
                  <h3 className="font-semibold text-gray-900">Kepala Desa</h3>
                </div>
                <p className="text-sm text-gray-600">{data.leaderName}</p>
              </div>
            )}
          </div>

          {/* Social Media */}
          {config.socialMedia && Object.keys(config.socialMedia).length > 0 && (
            <div className="mt-8 text-center">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Media Sosial</h3>
              <div className="flex justify-center gap-4">
                {Object.entries(config.socialMedia).map(([key, value]) => (
                  <a
                    key={key}
                    href={value.startsWith('http') ? value : `https://${value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 capitalize"
                  >
                    {key}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} {data.name}. Powered by{' '}
            <Link to="/" className="text-primary-400 hover:text-primary-300 font-medium">
              WargaHub
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
