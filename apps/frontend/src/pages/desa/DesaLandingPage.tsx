import { useState, useEffect } from 'react';
import { regionsService, LandingConfig, Region } from '../../services/regions.service';
import {
  Globe, Save, Loader2, Plus, X, ExternalLink,
} from 'lucide-react';

export default function DesaLandingPage() {
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [config, setConfig] = useState<LandingConfig>({
    heroTitle: '',
    heroSubtitle: '',
    aboutText: '',
    features: [],
    contactPhone: '',
    contactEmail: '',
    socialMedia: {},
  });

  const [newFeature, setNewFeature] = useState('');
  const [newSocialKey, setNewSocialKey] = useState('');
  const [newSocialValue, setNewSocialValue] = useState('');

  useEffect(() => {
    loadDesa();
  }, []);

  const loadDesa = async () => {
    try {
      const data = await regionsService.getMyDesa();
      setRegion(data);
      if (data.landingConfig) {
        setConfig({
          heroTitle: data.landingConfig.heroTitle || '',
          heroSubtitle: data.landingConfig.heroSubtitle || '',
          aboutText: data.landingConfig.aboutText || '',
          features: data.landingConfig.features || [],
          contactPhone: data.landingConfig.contactPhone || '',
          contactEmail: data.landingConfig.contactEmail || '',
          socialMedia: data.landingConfig.socialMedia || {},
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const updated = await regionsService.updateMyDesaLanding(config);
      setRegion(updated);
      setMessage('Landing page berhasil diperbarui');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setConfig({ ...config, features: [...(config.features || []), newFeature.trim()] });
    setNewFeature('');
  };

  const removeFeature = (idx: number) => {
    setConfig({ ...config, features: (config.features || []).filter((_, i) => i !== idx) });
  };

  const addSocial = () => {
    if (!newSocialKey.trim() || !newSocialValue.trim()) return;
    setConfig({
      ...config,
      socialMedia: { ...(config.socialMedia || {}), [newSocialKey.trim()]: newSocialValue.trim() },
    });
    setNewSocialKey('');
    setNewSocialValue('');
  };

  const removeSocial = (key: string) => {
    const updated = { ...(config.socialMedia || {}) };
    delete updated[key];
    setConfig({ ...config, socialMedia: updated });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Landing Page Desa</h1>
            <p className="text-sm text-gray-500">Konfigurasi halaman publik desa Anda</p>
          </div>
        </div>
        {region?.subdomain && (
          <a
            href={`/desa/${region.subdomain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50"
          >
            <ExternalLink size={16} /> Preview
          </a>
        )}
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl">{message}</div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>
      )}

      {/* Hero Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hero Section</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Hero</label>
            <input
              value={config.heroTitle}
              onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Selamat Datang di Desa Sukamaju"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle Hero</label>
            <input
              value={config.heroSubtitle}
              onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Desa modern dengan layanan digital terpadu"
            />
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tentang Desa</h2>
        <textarea
          value={config.aboutText}
          onChange={(e) => setConfig({ ...config, aboutText: e.target.value })}
          rows={4}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Deskripsi tentang desa Anda..."
        />
      </div>

      {/* Features */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Fitur Unggulan</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {(config.features || []).map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-700 text-sm rounded-lg">
              {f}
              <button onClick={() => removeFeature(i)} className="ml-1 text-primary-400 hover:text-primary-600">
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Tambah fitur..."
          />
          <button onClick={addFeature} className="px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700">
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Kontak</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
            <input
              value={config.contactPhone}
              onChange={(e) => setConfig({ ...config, contactPhone: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="081234567890"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              value={config.contactEmail}
              onChange={(e) => setConfig({ ...config, contactEmail: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="desa@email.id"
            />
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Media Sosial</h2>
        <div className="space-y-2 mb-4">
          {Object.entries(config.socialMedia || {}).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700 capitalize w-24">{key}</span>
              <span className="text-sm text-gray-500 flex-1 truncate">{value}</span>
              <button onClick={() => removeSocial(key)} className="text-red-400 hover:text-red-600">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newSocialKey}
            onChange={(e) => setNewSocialKey(e.target.value)}
            className="w-32 px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Platform"
          />
          <input
            value={newSocialValue}
            onChange={(e) => setNewSocialValue(e.target.value)}
            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="URL/Username"
          />
          <button onClick={addSocial} className="px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700">
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Simpan Landing Page
        </button>
      </div>
    </div>
  );
}
