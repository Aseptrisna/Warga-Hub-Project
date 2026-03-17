import { useState, useEffect, useRef, useMemo } from 'react';
import { panicService } from '../../services/panic.service';
import { useAuthStore } from '../../stores/auth.store';
import { canPerformAction } from '../../config/permissions';
import { useRegionScope } from '../../hooks/useRegionScope';
import {
  AlertCircle, MapPin, AlertTriangle, Camera, X, Navigation,
  Image as ImageIcon, Eye, Clock, User, FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';
import Swal from 'sweetalert2';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icon issue in webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createColoredIcon = (color: string) =>
  new L.DivIcon({
    className: '',
    html: `<div style="
      width: 24px; height: 24px; border-radius: 50%;
      background: ${color}; border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ${color === '#dc2626' ? 'animation: pulse 1.5s infinite;' : ''}
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });

const redIcon = createColoredIcon('#dc2626');
const yellowIcon = createColoredIcon('#eab308');
const greenIcon = createColoredIcon('#16a34a');

const getMarkerIcon = (status: string) => {
  if (status === 'active') return redIcon;
  if (status === 'responded') return yellowIcon;
  return greenIcon;
};

const emergencyTypes = ['Kebakaran', 'Pencurian', 'Kesehatan', 'Kecelakaan', 'Bencana Alam', 'Lainnya'];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const UPLOADS_BASE = API_URL.replace('/api/v1', '');

export default function PanicPage() {
  const { user } = useAuthStore();
  const scope = useRegionScope();
  const isResponder = user ? canPerformAction(user.role, 'panic', 'respond') : false;
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPanicForm, setShowPanicForm] = useState(false);
  const [form, setForm] = useState({
    tipeEmergency: 'Kebakaran',
    deskripsi: '',
    lokasi: { alamat: '', lat: 0, lng: 0 },
  });
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [respondForm, setRespondForm] = useState<{ id: string; tindakan: string } | null>(null);
  const [detailAlert, setDetailAlert] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (showPanicForm) {
      getGeolocation();
    } else {
      setGeoStatus('idle');
      setFoto(null);
      setFotoPreview(null);
    }
  }, [showPanicForm]);

  const isWarga = user?.role === 'Warga';

  const loadData = async () => {
    try {
      setLoading(true);
      const alertPromise = isWarga
        ? panicService.getMy({ limit: 50 }).catch(() => ({ data: [] }))
        : panicService.getAll({ limit: 50, ...scope }).catch(() => ({ data: [] }));
      const promises: Promise<any>[] = [alertPromise];
      if (isResponder) {
        promises.push(panicService.getActive(scope).catch(() => ({ data: [] })));
        promises.push(panicService.getStatistics(scope).catch(() => null));
      }
      const [allRes, activeRes, statsRes] = await Promise.all(promises);
      setAlerts(allRes.data || []);
      if (activeRes) setActiveAlerts(activeRes.data || []);
      if (statsRes) setStats(statsRes);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      return;
    }
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          lokasi: {
            ...prev.lokasi,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        }));
        setGeoStatus('success');
      },
      () => {
        setGeoStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setFotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeFoto = () => {
    setFoto(null);
    setFotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetForm = () => {
    setForm({ tipeEmergency: 'Kebakaran', deskripsi: '', lokasi: { alamat: '', lat: 0, lng: 0 } });
    setFoto(null);
    setFotoPreview(null);
  };

  const handlePanic = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await panicService.create(form, foto || undefined);
      setShowPanicForm(false);
      resetForm();
      loadData();
      await Swal.fire({ icon: 'warning', title: 'PANIC ALERT TERKIRIM!', text: 'Bantuan sedang dalam perjalanan.', confirmButtonColor: '#dc2626' });
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengirim panic alert' });
    } finally {
      setSending(false);
    }
  };

  const handleRespond = async () => {
    if (!respondForm) return;
    try {
      await panicService.respond(respondForm.id, respondForm.tindakan);
      setRespondForm(null);
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Alert berhasil direspons', timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal merespons alert' });
    }
  };

  const handleResolve = async (id: string) => {
    const result = await Swal.fire({
      title: 'Selesaikan Alert?',
      text: 'Alert ini akan ditandai sebagai selesai.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Selesaikan',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    try {
      await panicService.resolve(id);
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Alert berhasil diselesaikan', timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menyelesaikan alert' });
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      active: { color: 'bg-red-100 text-red-800 animate-pulse', label: 'AKTIF' },
      responded: { color: 'bg-yellow-100 text-yellow-800', label: 'Direspons' },
      resolved: { color: 'bg-green-100 text-green-800', label: 'Selesai' },
    };
    const s = map[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <span className={cn('px-2 py-1 rounded-full text-xs font-bold', s.color)}>{s.label}</span>;
  };

  const alertsWithCoords = useMemo(() => {
    const all = isResponder ? [...activeAlerts, ...alerts] : alerts;
    const seen = new Set<string>();
    return all.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return a.lokasi?.lat && a.lokasi?.lng;
    });
  }, [alerts, activeAlerts, isResponder]);

  const mapCenter = useMemo((): [number, number] => {
    const first = alertsWithCoords.find((a) => a.status === 'active') || alertsWithCoords[0];
    if (first) return [first.lokasi.lat, first.lokasi.lng];
    return [-6.2, 106.8];
  }, [alertsWithCoords]);

  return (
    <div>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          padding: 0 !important;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          min-width: 260px !important;
        }
        .leaflet-popup-tip {
          box-shadow: 0 2px 6px rgba(0,0,0,0.1) !important;
        }
        .popup-header-active { background: linear-gradient(135deg, #dc2626, #b91c1c); }
        .popup-header-responded { background: linear-gradient(135deg, #eab308, #ca8a04); }
        .popup-header-resolved { background: linear-gradient(135deg, #16a34a, #15803d); }
      `}</style>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panic Button</h1>
          <p className="text-gray-600 mt-1">Sistem darurat dan emergency alert</p>
        </div>
      </div>

      {/* Big Panic Button */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6 text-center">
        <button
          onClick={() => setShowPanicForm(true)}
          className="w-40 h-40 rounded-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 mx-auto flex flex-col items-center justify-center"
        >
          <AlertCircle className="w-16 h-16 mb-2" />
          <span className="text-lg font-bold">DARURAT</span>
        </button>
        <p className="text-gray-500 mt-4 text-sm">Tekan tombol di atas untuk mengirim alert darurat</p>
      </div>

      {/* Stats for responders */}
      {isResponder && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'bg-gray-100 text-gray-700' },
            { label: 'Aktif', value: stats.active, color: 'bg-red-100 text-red-700' },
            { label: 'Direspons', value: stats.responded, color: 'bg-yellow-100 text-yellow-700' },
            { label: 'Selesai', value: stats.resolved, color: 'bg-green-100 text-green-700' },
          ].map((s) => (
            <div key={s.label} className={cn('rounded-xl p-4', s.color)}>
              <p className="text-sm font-medium opacity-80">{s.label}</p>
              <p className="text-2xl font-bold">{s.value || 0}</p>
            </div>
          ))}
        </div>
      )}

      {/* Active Alerts for responders */}
      {isResponder && activeAlerts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-red-600 mb-3 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 animate-pulse" />Alert Aktif ({activeAlerts.length})
          </h2>
          <div className="space-y-3">
            {activeAlerts.map((a) => (
              <div key={a.id} className="bg-red-50 border-2 border-red-300 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg font-bold text-red-800">{a.tipeEmergency}</span>
                      {getStatusBadge(a.status)}
                    </div>
                    <p className="text-sm text-red-700">Pelapor: {a.pelaporName} &middot; {a.createdAt ? format(new Date(a.createdAt), 'dd MMM yyyy HH:mm') : ''}</p>
                    {a.lokasi?.alamat && <p className="text-sm text-red-600 flex items-center mt-1"><MapPin className="w-4 h-4 mr-1 flex-shrink-0" />{a.lokasi.alamat}</p>}
                    {a.lokasi?.lat && a.lokasi?.lng && (
                      <p className="text-xs text-red-500 mt-0.5">GPS: {a.lokasi.lat.toFixed(5)}, {a.lokasi.lng.toFixed(5)}</p>
                    )}
                    {a.deskripsi && <p className="text-sm text-red-700 mt-1">{a.deskripsi}</p>}
                    {a.fotoUrl && (
                      <div className="mt-2">
                        <img
                          src={`${UPLOADS_BASE}${a.fotoUrl}`}
                          alt="Foto bukti"
                          className="h-24 w-auto rounded-lg border border-red-200 object-cover cursor-pointer hover:opacity-80 transition"
                          onClick={() => setPreviewUrl(`${UPLOADS_BASE}${a.fotoUrl}`)}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 ml-3 flex-shrink-0">
                    <button onClick={() => setDetailAlert(a)} className="px-3 py-1.5 text-sm bg-white text-red-700 border border-red-300 rounded-lg hover:bg-red-50 font-medium">
                      Detail
                    </button>
                    {a.status === 'active' && (
                      <button onClick={() => setRespondForm({ id: a.id, tindakan: '' })} className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium">
                        Respons
                      </button>
                    )}
                    {(a.status === 'active' || a.status === 'responded') && (
                      <button onClick={() => handleResolve(a.id)} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                        Selesai
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaflet Map Section */}
      {alertsWithCoords.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-red-500" />
              Peta Lokasi Alert
            </h3>
            <button
              onClick={() => setShowMap(!showMap)}
              className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium"
            >
              {showMap ? 'Sembunyikan Peta' : 'Tampilkan Peta'}
            </button>
          </div>
          {showMap && (
            <div className="h-[400px]">
              <MapContainer
                center={mapCenter}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {alertsWithCoords.map((a) => (
                  <Marker
                    key={a.id}
                    position={[a.lokasi.lat, a.lokasi.lng]}
                    icon={getMarkerIcon(a.status)}
                  >
                    <Popup>
                      <div>
                        {/* Popup Header */}
                        <div className={cn(
                          'px-4 py-3 text-white',
                          a.status === 'active' && 'popup-header-active',
                          a.status === 'responded' && 'popup-header-responded',
                          a.status === 'resolved' && 'popup-header-resolved',
                        )}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm">{a.tipeEmergency}</span>
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
                              {a.status === 'active' ? 'AKTIF' : a.status === 'responded' ? 'Direspons' : 'Selesai'}
                            </span>
                          </div>
                          <p className="text-xs text-white/80 mt-1">
                            {a.createdAt ? format(new Date(a.createdAt), 'dd MMM yyyy HH:mm') : ''}
                          </p>
                        </div>
                        {/* Popup Body */}
                        <div className="px-4 py-3 space-y-2">
                          <div className="flex items-center space-x-2 text-sm">
                            <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700 font-medium">{a.pelaporName}</span>
                          </div>
                          {a.lokasi?.alamat && (
                            <div className="flex items-start space-x-2 text-sm">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-600">{a.lokasi.alamat}</span>
                            </div>
                          )}
                          {a.deskripsi && (
                            <p className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1.5">{a.deskripsi}</p>
                          )}
                          {a.fotoUrl && (
                            <img
                              src={`${UPLOADS_BASE}${a.fotoUrl}`}
                              alt="Foto"
                              className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition"
                              onClick={() => setPreviewUrl(`${UPLOADS_BASE}${a.fotoUrl}`)}
                            />
                          )}
                          {a.respondedByName && (
                            <div className="flex items-center space-x-2 text-xs text-gray-500 border-t border-gray-100 pt-2">
                              <User className="w-3 h-3 flex-shrink-0" />
                              <span>Responder: <strong className="text-gray-700">{a.respondedByName}</strong></span>
                            </div>
                          )}
                        </div>
                        {/* Popup Footer */}
                        <div className="px-4 pb-3">
                          <button
                            onClick={() => setDetailAlert(a)}
                            className="w-full text-center text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg py-1.5 transition"
                          >
                            Lihat Detail
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
          {showMap && (
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center space-x-4 text-xs text-gray-500">
              <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-600 mr-1.5 inline-block"></span>Aktif</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-500 mr-1.5 inline-block"></span>Direspons</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-600 mr-1.5 inline-block"></span>Selesai</span>
            </div>
          )}
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Riwayat Alert</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Waktu</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tipe</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Pelapor</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Lokasi</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Foto</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : alerts.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Belum ada riwayat alert</td></tr>
              ) : alerts.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm whitespace-nowrap">{a.createdAt ? format(new Date(a.createdAt), 'dd MMM yyyy HH:mm') : '-'}</td>
                  <td className="px-6 py-4 text-sm font-medium">{a.tipeEmergency}</td>
                  <td className="px-6 py-4 text-sm">{a.pelaporName}</td>
                  <td className="px-6 py-4 text-sm">
                    <div>{a.lokasi?.alamat || '-'}</div>
                    {a.lokasi?.lat && a.lokasi?.lng && (
                      <div className="text-xs text-gray-400">{a.lokasi.lat.toFixed(5)}, {a.lokasi.lng.toFixed(5)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {a.fotoUrl ? (
                      <img
                        src={`${UPLOADS_BASE}${a.fotoUrl}`}
                        alt="Foto"
                        className="h-10 w-10 rounded object-cover cursor-pointer hover:opacity-80 transition"
                        onClick={() => setPreviewUrl(`${UPLOADS_BASE}${a.fotoUrl}`)}
                      />
                    ) : (
                      <span className="text-gray-300"><ImageIcon className="w-5 h-5" /></span>
                    )}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(a.status)}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setDetailAlert(a)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* Modal: Kirim Alert Darurat */}
      {showPanicForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Kirim Alert Darurat</h3>
              </div>
              <button
                onClick={() => { setShowPanicForm(false); resetForm(); }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handlePanic} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Geolocation Status */}
              <div className={cn(
                'flex items-center space-x-2 px-3 py-2.5 rounded-lg text-sm',
                geoStatus === 'loading' && 'bg-blue-50 text-blue-700',
                geoStatus === 'success' && 'bg-green-50 text-green-700',
                geoStatus === 'error' && 'bg-yellow-50 text-yellow-700',
                geoStatus === 'idle' && 'bg-gray-50 text-gray-500',
              )}>
                <Navigation className={cn('w-4 h-4 flex-shrink-0', geoStatus === 'loading' && 'animate-spin')} />
                <div className="flex-1">
                  {geoStatus === 'loading' && <span>Mendapatkan lokasi GPS...</span>}
                  {geoStatus === 'success' && (
                    <span>Lokasi didapatkan ({form.lokasi.lat.toFixed(5)}, {form.lokasi.lng.toFixed(5)})</span>
                  )}
                  {geoStatus === 'error' && (
                    <span>
                      Gagal mendapatkan lokasi GPS.{' '}
                      <button type="button" onClick={getGeolocation} className="underline font-medium">Coba lagi</button>
                    </span>
                  )}
                  {geoStatus === 'idle' && <span>Lokasi GPS belum didapatkan</span>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Darurat</label>
                <select
                  value={form.tipeEmergency}
                  onChange={(e) => setForm({ ...form, tipeEmergency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  {emergencyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi / Alamat</label>
                <input
                  type="text"
                  value={form.lokasi.alamat}
                  onChange={(e) => setForm({ ...form, lokasi: { ...form.lokasi, alamat: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Alamat atau lokasi kejadian"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan (opsional)</label>
                <textarea
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Jelaskan situasi darurat..."
                />
              </div>

              {/* Foto Bukti */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto Bukti (opsional)</label>
                {fotoPreview ? (
                  <div className="relative">
                    <img src={fotoPreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={removeFoto}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-400 hover:bg-red-50 text-sm text-gray-500 hover:text-red-600 transition"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Ambil Foto / Pilih dari Galeri</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFotoChange}
                  className="hidden"
                />
                <p className="mt-1 text-xs text-gray-400">Format: JPG, PNG, WebP. Maks 5MB</p>
              </div>

              {/* Footer */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowPanicForm(false); resetForm(); }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-bold"
                >
                  {sending ? 'Mengirim...' : 'KIRIM ALERT!'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Respons Alert */}
      {respondForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Respons Alert</h3>
              <button
                onClick={() => setRespondForm(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tindakan yang dilakukan</label>
                <textarea
                  value={respondForm.tindakan}
                  onChange={(e) => setRespondForm({ ...respondForm, tindakan: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Jelaskan tindakan yang dilakukan..."
                />
              </div>
              {/* Footer */}
              <div className="flex gap-3">
                <button
                  onClick={() => setRespondForm(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleRespond}
                  disabled={!respondForm.tindakan.trim()}
                  className="flex-1 px-4 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 text-sm font-medium"
                >
                  Kirim Respons
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detail Alert */}
      {detailAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <AlertCircle className={cn('w-5 h-5', detailAlert.status === 'active' ? 'text-red-600' : detailAlert.status === 'responded' ? 'text-yellow-500' : 'text-green-600')} />
                <h3 className="text-lg font-semibold text-gray-900">Detail Alert</h3>
              </div>
              <button
                onClick={() => setDetailAlert(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Status & Type */}
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-gray-900">{detailAlert.tipeEmergency}</span>
                {getStatusBadge(detailAlert.status)}
              </div>

              {/* Info Grid */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-start space-x-3">
                  <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Pelapor</p>
                    <p className="text-sm font-medium text-gray-900">{detailAlert.pelaporName}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Waktu</p>
                    <p className="text-sm font-medium text-gray-900">
                      {detailAlert.createdAt ? format(new Date(detailAlert.createdAt), 'dd MMM yyyy HH:mm:ss') : '-'}
                    </p>
                  </div>
                </div>
                {(detailAlert.lokasi?.alamat || (detailAlert.lokasi?.lat && detailAlert.lokasi?.lng)) && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Lokasi</p>
                      {detailAlert.lokasi.alamat && <p className="text-sm font-medium text-gray-900">{detailAlert.lokasi.alamat}</p>}
                      {detailAlert.lokasi.lat && detailAlert.lokasi.lng && (
                        <p className="text-xs text-gray-400">GPS: {detailAlert.lokasi.lat.toFixed(6)}, {detailAlert.lokasi.lng.toFixed(6)}</p>
                      )}
                    </div>
                  </div>
                )}
                {detailAlert.deskripsi && (
                  <div className="flex items-start space-x-3">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Keterangan</p>
                      <p className="text-sm text-gray-900">{detailAlert.deskripsi}</p>
                    </div>
                  </div>
                )}
                {detailAlert.respondedByName && (
                  <div className="flex items-start space-x-3">
                    <User className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Direspons oleh</p>
                      <p className="text-sm font-medium text-gray-900">{detailAlert.respondedByName}</p>
                      {detailAlert.respondedAt && (
                        <p className="text-xs text-gray-400">{format(new Date(detailAlert.respondedAt), 'dd MMM yyyy HH:mm')}</p>
                      )}
                    </div>
                  </div>
                )}
                {detailAlert.tindakan && (
                  <div className="flex items-start space-x-3">
                    <FileText className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Tindakan</p>
                      <p className="text-sm text-gray-900">{detailAlert.tindakan}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Foto Bukti */}
              {detailAlert.fotoUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Foto Bukti</label>
                  <img
                    src={`${UPLOADS_BASE}${detailAlert.fotoUrl}`}
                    alt="Foto bukti"
                    className="w-full max-h-56 object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition"
                    onClick={() => setPreviewUrl(`${UPLOADS_BASE}${detailAlert.fotoUrl}`)}
                  />
                </div>
              )}

              {/* Mini Map */}
              {detailAlert.lokasi?.lat && detailAlert.lokasi?.lng && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lokasi di Peta</label>
                  <div className="h-[200px] rounded-lg overflow-hidden border border-gray-200">
                    <MapContainer
                      center={[detailAlert.lokasi.lat, detailAlert.lokasi.lng]}
                      zoom={16}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={false}
                      dragging={false}
                      zoomControl={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker
                        position={[detailAlert.lokasi.lat, detailAlert.lokasi.lng]}
                        icon={getMarkerIcon(detailAlert.status)}
                      />
                    </MapContainer>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDetailAlert(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Tutup
                </button>
                {isResponder && detailAlert.status === 'active' && (
                  <button
                    onClick={() => { setDetailAlert(null); setRespondForm({ id: detailAlert.id, tindakan: '' }); }}
                    className="flex-1 px-4 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm font-medium"
                  >
                    Respons
                  </button>
                )}
                {isResponder && (detailAlert.status === 'active' || detailAlert.status === 'responded') && (
                  <button
                    onClick={() => { setDetailAlert(null); handleResolve(detailAlert.id); }}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    Selesaikan
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Preview Foto (Lightbox) */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-[60] flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-3 -right-3 bg-white text-gray-700 rounded-full p-1.5 shadow-lg hover:bg-gray-100 z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewUrl}
              alt="Preview foto"
              className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
