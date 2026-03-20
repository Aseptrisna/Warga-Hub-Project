import { useState, useEffect, useCallback, useRef } from 'react';
import { patrolCheckpointsService, patrolSchedulesService, patrolLogsService } from '../../services/patrol.service';
import { usersService } from '../../services/settings.service';
import { useAuthStore } from '../../stores/auth.store';
import { canPerformAction } from '../../config/permissions';
import { useRegionScope } from '../../hooks/useRegionScope';
import {
  MapPin, Clock, QrCode, Plus, Play, CheckCircle, XCircle, Trash2,
  Calendar, User, Download, RefreshCw, Edit2, Search, ChevronLeft,
  ChevronRight, Sun, Moon, X, Shield, Activity, BarChart3, Target,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '../../utils/cn';
import Swal from 'sweetalert2';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Html5Qrcode } from 'html5-qrcode';

// ============ MAP ICONS ============
const createIcon = (color: string, pulse = false) =>
  new L.DivIcon({
    className: '',
    html: `<div style="
      width: 24px; height: 24px; border-radius: 50%;
      background: ${color}; border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ${pulse ? 'animation: pulse 1.5s infinite;' : ''}
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });

const checkpointIconActive = createIcon('#16a34a');
const checkpointIconInactive = createIcon('#9ca3af');
const logIconValid = createIcon('#16a34a');
const logIconInvalid = createIcon('#dc2626');
const logIconDuplicate = createIcon('#eab308');
const logIconWarn = createIcon('#f97316');
const pickerIcon = createIcon('#2563eb', true);

const LOG_ICON_MAP: Record<string, L.DivIcon> = {
  valid: logIconValid,
  invalid_location: logIconInvalid,
  invalid_time: logIconWarn,
  duplicate: logIconDuplicate,
};

const DEFAULT_CENTER: [number, number] = [-6.9175, 107.6191];

// ============ MAIN COMPONENT ============
export default function PatrolPage() {
  const { user } = useAuthStore();
  const canScan = user ? canPerformAction(user.role, 'patrol', 'scan') : false;
  const canManagePatrol = user ? canPerformAction(user.role, 'patrol', 'manage') : false;

  const tabs = [
    ...(canScan ? [{ id: 'patrol-saya', label: 'Patroli Saya', icon: Shield }] : []),
    ...(canManagePatrol ? [{ id: 'checkpoints', label: 'Checkpoint', icon: MapPin }] : []),
    { id: 'schedules', label: 'Jadwal Patroli', icon: Calendar },
    { id: 'logs', label: 'Log Patroli', icon: Clock },
  ];
  const [activeTab, setActiveTab] = useState(canScan ? 'patrol-saya' : (canManagePatrol ? 'checkpoints' : 'schedules'));
  const scope = useRegionScope();

  // Dashboard stats
  const [stats, setStats] = useState({ checkpoints: 0, activeCheckpoints: 0, todaySchedules: 0, todayScans: 0, completionRate: 0 });

  useEffect(() => {
    (async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const [cpRes, schedStats, logStats] = await Promise.all([
          patrolCheckpointsService.getAll({ limit: 1, ...scope }),
          patrolSchedulesService.getStatistics({ startDate: today, endDate: today, ...scope }),
          patrolLogsService.getStatistics({ startDate: new Date(today + 'T00:00:00').toISOString(), endDate: new Date(today + 'T23:59:59').toISOString(), ...scope }),
        ]);
        const cpAll = await patrolCheckpointsService.getAll({ limit: 1, isActive: 'true', ...scope });
        setStats({
          checkpoints: cpRes.meta?.total || 0,
          activeCheckpoints: cpAll.meta?.total || 0,
          todaySchedules: schedStats.total || 0,
          todayScans: logStats.total || 0,
          completionRate: parseFloat(schedStats.completionRate) || 0,
        });
      } catch {}
    })();
  }, [scope.desa, scope.rw, scope.rt]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patroli Ronda</h1>
          <p className="text-gray-600 mt-1">Kelola checkpoint, jadwal, dan monitoring patroli keamanan lingkungan</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Target className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeCheckpoints}<span className="text-sm font-normal text-gray-500">/{stats.checkpoints}</span></p>
              <p className="text-xs text-gray-500">Checkpoint Aktif</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg"><Shield className="w-5 h-5 text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.todaySchedules}</p>
              <p className="text-xs text-gray-500">Jadwal Hari Ini</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Activity className="w-5 h-5 text-purple-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.todayScans}</p>
              <p className="text-xs text-gray-500">Scan Hari Ini</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg"><BarChart3 className="w-5 h-5 text-amber-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
              <p className="text-xs text-gray-500">Tingkat Penyelesaian</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === tab.id ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'patrol-saya' && <PatrolSayaTab />}
      {activeTab === 'checkpoints' && <CheckpointsTab />}
      {activeTab === 'schedules' && <SchedulesTab />}
      {activeTab === 'logs' && <LogsTab />}
    </div>
  );
}

// ============ SHARED COMPONENTS ============
function LocationPicker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onLocationSelect(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function Pagination({ page, totalPages, total, onPageChange }: { page: number; totalPages: number; total?: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
      <span className="text-sm text-gray-600">{total ? `${total} data - ` : ''}Halaman {page} dari {totalPages}</span>
      <div className="flex space-x-2">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, actionLabel, onAction }: { icon: any; title: string; desc: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{desc}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="inline-flex items-center px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
          <Plus className="w-5 h-5 mr-2" />{actionLabel}
        </button>
      )}
    </div>
  );
}

// ========================================================
// ============ CHECKPOINTS TAB ============
// ========================================================
function CheckpointsTab() {
  const { user } = useAuthStore();
  const scope = useRegionScope();
  const canManage = user ? canPerformAction(user.role, 'patrol', 'manage') : false;
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>({});

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', address: '', description: '', latitude: 0, longitude: 0, validationRadius: 50 });
  const [pickedLocation, setPickedLocation] = useState<[number, number] | null>(null);

  // QR Modal
  const [qrModal, setQrModal] = useState<{ open: boolean; checkpoint: any | null }>({ open: false, checkpoint: null });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await patrolCheckpointsService.getAll({ search: search || undefined, page, limit: 20, ...scope });
      setCheckpoints(res.data || []);
      setMeta(res.meta || {});
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [search, page, scope.desa, scope.rw, scope.rt]);

  useEffect(() => { loadData(); }, [loadData]);

  const mapCenter: [number, number] = (() => {
    const cp = checkpoints.find((c) => c.latitude && c.longitude);
    return cp ? [cp.latitude, cp.longitude] : DEFAULT_CENTER;
  })();

  const openAddModal = () => {
    setEditingId(null);
    setForm({ name: '', code: '', address: '', description: '', latitude: 0, longitude: 0, validationRadius: 50 });
    setPickedLocation(null);
    setShowModal(true);
  };

  const openEditModal = (cp: any) => {
    setEditingId(cp.id);
    setForm({ name: cp.name || '', code: cp.code || '', address: cp.address || '', description: cp.description || '', latitude: cp.latitude || 0, longitude: cp.longitude || 0, validationRadius: cp.validationRadius || 50 });
    setPickedLocation(cp.latitude && cp.longitude ? [cp.latitude, cp.longitude] : null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        regionId: scope.rt || scope.rw || scope.desa || 'default',
        desa: scope.desa || user?.desa || '',
        rw: scope.rw || user?.rw || '',
        rt: scope.rt || user?.rt || '',
      };
      if (editingId) {
        await patrolCheckpointsService.update(editingId, payload);
      } else {
        await patrolCheckpointsService.create(payload);
      }
      setShowModal(false);
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: editingId ? 'Checkpoint diperbarui' : 'Checkpoint berhasil dibuat', timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menyimpan checkpoint' });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({ title: 'Hapus Checkpoint?', text: `"${name}" akan dihapus permanen.`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: 'Ya, Hapus', cancelButtonText: 'Batal' });
    if (!result.isConfirmed) return;
    try {
      await patrolCheckpointsService.delete(id);
      await Swal.fire({ icon: 'success', title: 'Terhapus!', timer: 1500, showConfirmButton: false });
      loadData();
    } catch { Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus checkpoint' }); }
  };

  const handleToggleActive = async (cp: any) => {
    try { await patrolCheckpointsService.update(cp.id, { isActive: !cp.isActive }); loadData(); } catch { Swal.fire({ icon: 'error', title: 'Gagal' }); }
  };

  const handleRegenerateQR = async (id: string) => {
    const result = await Swal.fire({ title: 'Regenerate QR?', text: 'QR lama tidak berlaku lagi.', icon: 'question', showCancelButton: true, confirmButtonText: 'Generate Ulang', cancelButtonText: 'Batal' });
    if (!result.isConfirmed) return;
    try {
      await patrolCheckpointsService.regenerateQR(id);
      await Swal.fire({ icon: 'success', title: 'Berhasil', timer: 1500, showConfirmButton: false });
      loadData();
    } catch { Swal.fire({ icon: 'error', title: 'Gagal' }); }
  };

  const handleDownloadQR = (cp: any) => {
    if (!cp.qrCode) return;
    const link = document.createElement('a');
    link.href = cp.qrCode;
    link.download = `QR-${cp.code || cp.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!loading && checkpoints.length === 0 && !search) {
    return (
      <>
        <EmptyState
          icon={MapPin}
          title="Belum Ada Checkpoint"
          desc="Tambahkan checkpoint patroli dengan titik GPS dan QR Code. Petugas ronda akan scan QR di setiap pos."
          actionLabel={canManage ? 'Tambah Checkpoint Pertama' : undefined}
          onAction={canManage ? openAddModal : undefined}
        />
        {renderModal()}
      </>
    );
  }

  function renderModal() {
    if (!showModal) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">{editingId ? 'Edit Checkpoint' : 'Tambah Checkpoint Baru'}</h3>
            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Checkpoint *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Pos Jaga Utara" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kode *</label>
                <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required placeholder="CP-RT01-001" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat *</label>
              <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Jl. Raya No. 1, depan Masjid" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Pos jaga di pertigaan utara..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Radius Validasi GPS (meter)</label>
              <input type="number" value={form.validationRadius} onChange={(e) => setForm({ ...form, validationRadius: parseInt(e.target.value) || 50 })} min={1} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              <p className="text-xs text-gray-400 mt-1">Jarak maksimal petugas dari checkpoint agar scan dianggap valid</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Lokasi di Peta *</label>
              <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height: 280 }}>
                <MapContainer center={pickedLocation || mapCenter} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationPicker onLocationSelect={(lat, lng) => { setPickedLocation([lat, lng]); setForm((f) => ({ ...f, latitude: lat, longitude: lng })); }} />
                  {pickedLocation && <Marker position={pickedLocation} icon={pickerIcon}><Popup>Lokasi Checkpoint</Popup></Marker>}
                </MapContainer>
              </div>
              {pickedLocation ? (
                <p className="text-xs text-green-600 mt-1 font-medium">Lat: {pickedLocation[0].toFixed(6)}, Lng: {pickedLocation[1].toFixed(6)}</p>
              ) : (
                <p className="text-xs text-amber-600 mt-1">Klik peta untuk menandai lokasi checkpoint</p>
              )}
            </div>
            <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
                {editingId ? 'Simpan Perubahan' : 'Buat Checkpoint'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search + Add */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Cari checkpoint..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
        </div>
        {canManage && (
          <button onClick={openAddModal} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 whitespace-nowrap font-medium">
            <Plus className="w-5 h-5 mr-2" />Tambah Checkpoint
          </button>
        )}
      </div>

      {/* Map */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Peta Checkpoint</h3>
          </div>
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <span className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span>Aktif</span>
            <span className="flex items-center"><span className="w-3 h-3 bg-gray-400 rounded-full mr-1"></span>Nonaktif</span>
          </div>
        </div>
        <div style={{ height: 380 }}>
          <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {checkpoints.filter((c) => c.latitude && c.longitude).map((cp) => (
              <Marker key={cp.id} position={[cp.latitude, cp.longitude]} icon={cp.isActive ? checkpointIconActive : checkpointIconInactive}>
                <Popup>
                  <div className="min-w-[180px]">
                    <p className="font-bold text-sm">{cp.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{cp.code}</p>
                    <p className="text-xs text-gray-600 mt-1">{cp.address}</p>
                    <div className="flex justify-between mt-2 text-xs">
                      <span className={cp.isActive ? 'text-green-600 font-medium' : 'text-gray-400'}>
                        {cp.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                      <span className="text-gray-500">{cp.totalScans || 0} scan</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Kode</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nama</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Alamat</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total Scan</th>
              {canManage && <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : checkpoints.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Tidak ditemukan</td></tr>
            ) : checkpoints.map((cp) => (
              <tr key={cp.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-mono font-medium text-primary-700">{cp.code}</td>
                <td className="px-6 py-4 text-sm font-medium">{cp.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{cp.address || '-'}</td>
                <td className="px-6 py-4">
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium', cp.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600')}>
                    {cp.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium">{cp.totalScans || 0}</td>
                {canManage && (
                  <td className="px-6 py-4">
                    <div className="flex space-x-1">
                      <button onClick={() => setQrModal({ open: true, checkpoint: cp })} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Lihat QR"><QrCode className="w-4 h-4" /></button>
                      <button onClick={() => handleDownloadQR(cp)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Download QR"><Download className="w-4 h-4" /></button>
                      <button onClick={() => openEditModal(cp)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleToggleActive(cp)} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded" title={cp.isActive ? 'Nonaktifkan' : 'Aktifkan'}>{cp.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}</button>
                      <button onClick={() => handleRegenerateQR(cp.id)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="Regenerate QR"><RefreshCw className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(cp.id, cp.name)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} totalPages={meta.totalPages || 1} total={meta.total} onPageChange={setPage} />
      </div>

      {renderModal()}

      {/* QR Modal */}
      {qrModal.open && qrModal.checkpoint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">QR Code</h3>
              <button onClick={() => setQrModal({ open: false, checkpoint: null })} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 text-center">
              {qrModal.checkpoint.qrCode ? (
                <>
                  <img src={qrModal.checkpoint.qrCode} alt="QR Code" className="mx-auto w-52 h-52 mb-4 border rounded-lg p-2" />
                  <p className="text-sm font-bold">{qrModal.checkpoint.name}</p>
                  <p className="text-xs font-mono text-gray-500">{qrModal.checkpoint.code}</p>
                  <p className="text-xs text-gray-400 mb-5">{qrModal.checkpoint.address}</p>
                  <button onClick={() => handleDownloadQR(qrModal.checkpoint)} className="inline-flex items-center px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
                    <Download className="w-4 h-4 mr-2" />Download QR Code
                  </button>
                </>
              ) : (
                <p className="text-gray-500">QR Code belum tersedia</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================================
// ============ SCHEDULES TAB ============
// ========================================================
function SchedulesTab() {
  const { user } = useAuthStore();
  const scope = useRegionScope();
  const canManage = user ? canPerformAction(user.role, 'patrol', 'manage') : false;
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>({});

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [quickFilter, setQuickFilter] = useState<string>('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ date: '', shift: 'Siang' as string, assignedOfficerNames: [] as string[], requiredCheckpoints: [] as string[], notes: '' });
  const [officers, setOfficers] = useState<any[]>([]);
  const [checkpointOptions, setCheckpointOptions] = useState<any[]>([]);
  const [manualOfficer, setManualOfficer] = useState('');

  const applyQuickFilter = (key: string) => {
    const now = new Date();
    let start = '', end = '';
    if (key === 'today') { const d = format(now, 'yyyy-MM-dd'); start = d; end = d; }
    else if (key === 'week') { start = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'); end = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'); }
    else if (key === 'month') { start = format(startOfMonth(now), 'yyyy-MM-dd'); end = format(endOfMonth(now), 'yyyy-MM-dd'); }
    setQuickFilter(key === quickFilter ? '' : key);
    if (key === quickFilter) { setDateRange({ start: '', end: '' }); } else { setDateRange({ start, end }); }
    setPage(1);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20, ...scope };
      if (statusFilter) params.status = statusFilter;
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;
      const res = await patrolSchedulesService.getAll(params);
      setSchedules(res.data || []);
      setMeta(res.meta || {});
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [page, statusFilter, dateRange.start, dateRange.end, scope.desa, scope.rw, scope.rt]);

  useEffect(() => { loadData(); }, [loadData]);

  const openAddModal = async () => {
    setForm({ date: '', shift: 'Siang', assignedOfficerNames: [], requiredCheckpoints: [], notes: '' });
    setManualOfficer('');
    try {
      const [officerRes, cpRes] = await Promise.all([
        usersService.getAll({ role: 'PetugasRonda', limit: 100, ...scope }),
        patrolCheckpointsService.getAll({ isActive: 'true', limit: 100, ...scope }),
      ]);
      setOfficers(officerRes.data || []);
      setCheckpointOptions(cpRes.data || []);
    } catch {}
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await patrolSchedulesService.create({
        date: form.date, shift: form.shift,
        regionId: scope.rt || scope.rw || scope.desa || 'default',
        desa: scope.desa || user?.desa || '', rw: scope.rw || user?.rw || '', rt: scope.rt || user?.rt || '',
        assignedOfficerNames: form.assignedOfficerNames,
        requiredCheckpoints: form.requiredCheckpoints,
        totalCheckpoints: form.requiredCheckpoints.length,
        notes: form.notes,
      });
      setShowModal(false);
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Jadwal patroli berhasil dibuat', timer: 1500, showConfirmButton: false });
      loadData();
    } catch { Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal membuat jadwal' }); }
  };

  const handleAction = async (action: string, id: string) => {
    if (action === 'start') {
      try { await patrolSchedulesService.start(id); Swal.fire({ icon: 'success', title: 'Patroli Dimulai', timer: 1500, showConfirmButton: false }); loadData(); } catch { Swal.fire({ icon: 'error', title: 'Gagal' }); }
    } else if (action === 'complete') {
      try { await patrolSchedulesService.complete(id); Swal.fire({ icon: 'success', title: 'Patroli Selesai', timer: 1500, showConfirmButton: false }); loadData(); } catch { Swal.fire({ icon: 'error', title: 'Gagal' }); }
    } else if (action === 'cancel') {
      const r = await Swal.fire({ title: 'Batalkan Patroli?', icon: 'question', showCancelButton: true, confirmButtonColor: '#f59e0b', confirmButtonText: 'Ya, Batalkan', cancelButtonText: 'Tidak' });
      if (!r.isConfirmed) return;
      try { await patrolSchedulesService.cancel(id); Swal.fire({ icon: 'success', title: 'Dibatalkan', timer: 1500, showConfirmButton: false }); loadData(); } catch { Swal.fire({ icon: 'error', title: 'Gagal' }); }
    } else if (action === 'delete') {
      const r = await Swal.fire({ title: 'Hapus Jadwal?', text: 'Data akan dihapus permanen.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Ya, Hapus', cancelButtonText: 'Batal' });
      if (!r.isConfirmed) return;
      try { await patrolSchedulesService.delete(id); Swal.fire({ icon: 'success', title: 'Terhapus', timer: 1500, showConfirmButton: false }); loadData(); } catch { Swal.fire({ icon: 'error', title: 'Gagal' }); }
    }
  };

  const addManualOfficer = () => {
    if (manualOfficer.trim() && !form.assignedOfficerNames.includes(manualOfficer.trim())) {
      setForm({ ...form, assignedOfficerNames: [...form.assignedOfficerNames, manualOfficer.trim()] });
      setManualOfficer('');
    }
  };

  const toggleOfficer = (name: string) => setForm((f) => ({ ...f, assignedOfficerNames: f.assignedOfficerNames.includes(name) ? f.assignedOfficerNames.filter((n) => n !== name) : [...f.assignedOfficerNames, name] }));
  const toggleCheckpoint = (id: string) => setForm((f) => ({ ...f, requiredCheckpoints: f.requiredCheckpoints.includes(id) ? f.requiredCheckpoints.filter((c) => c !== id) : [...f.requiredCheckpoints, id] }));

  const statusBadge = (status: string) => {
    const m: Record<string, [string, string]> = { scheduled: ['bg-blue-100 text-blue-800', 'Terjadwal'], in_progress: ['bg-yellow-100 text-yellow-800', 'Berjalan'], completed: ['bg-green-100 text-green-800', 'Selesai'], cancelled: ['bg-red-100 text-red-800', 'Dibatalkan'] };
    const [cls, label] = m[status] || ['bg-gray-100 text-gray-800', status];
    return <span className={cn('px-2 py-1 rounded-full text-xs font-medium', cls)}>{label}</span>;
  };

  const shiftBadge = (shift: string) => shift === 'Siang'
    ? <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Sun className="w-3 h-3 mr-1" />Siang</span>
    : <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"><Moon className="w-3 h-3 mr-1" />Malam</span>;

  if (!loading && schedules.length === 0 && !statusFilter && !dateRange.start) {
    return (
      <>
        <EmptyState
          icon={Calendar}
          title="Belum Ada Jadwal Patroli"
          desc="Buat jadwal patroli dengan menentukan tanggal, shift, petugas ronda, dan checkpoint yang harus dikunjungi."
          actionLabel={canManage ? 'Buat Jadwal Patroli' : undefined}
          onAction={canManage ? openAddModal : undefined}
        />
        {renderScheduleModal()}
      </>
    );
  }

  function renderScheduleModal() {
    if (!showModal) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Buat Jadwal Patroli</h3>
            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Patroli *</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shift *</label>
                <div className="flex space-x-2">
                  <button type="button" onClick={() => setForm({ ...form, shift: 'Siang' })} className={cn('flex-1 flex items-center justify-center px-3 py-2 rounded-lg border text-sm font-medium transition-colors', form.shift === 'Siang' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')}>
                    <Sun className="w-4 h-4 mr-1.5" />Siang (06-18)
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, shift: 'Malam' })} className={cn('flex-1 flex items-center justify-center px-3 py-2 rounded-lg border text-sm font-medium transition-colors', form.shift === 'Malam' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')}>
                    <Moon className="w-4 h-4 mr-1.5" />Malam (18-06)
                  </button>
                </div>
              </div>
            </div>

            {/* Officers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Petugas Ronda</label>
              {officers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {officers.map((o: any) => (
                    <button key={o.id} type="button" onClick={() => toggleOfficer(o.name)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-colors', form.assignedOfficerNames.includes(o.name) ? 'bg-primary-100 text-primary-800 border-primary-300' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50')}>
                      <User className="w-3 h-3 inline mr-1" />{o.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex space-x-2">
                <input type="text" value={manualOfficer} onChange={(e) => setManualOfficer(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManualOfficer(); } }} placeholder="Tambah petugas manual..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" />
                <button type="button" onClick={addManualOfficer} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">Tambah</button>
              </div>
              {form.assignedOfficerNames.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.assignedOfficerNames.map((name, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                      {name}
                      <button type="button" onClick={() => setForm({ ...form, assignedOfficerNames: form.assignedOfficerNames.filter((_, j) => j !== i) })} className="ml-1.5 hover:text-red-600"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Checkpoints */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Checkpoint yang Harus Discan</label>
              {checkpointOptions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {checkpointOptions.map((cp: any) => (
                    <label key={cp.id} className="flex items-center space-x-2 cursor-pointer text-sm hover:bg-gray-50 p-1 rounded">
                      <input type="checkbox" checked={form.requiredCheckpoints.includes(cp.id)} onChange={() => toggleCheckpoint(cp.id)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <span className="text-gray-700"><span className="font-mono text-xs text-primary-600">{cp.code}</span> {cp.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Belum ada checkpoint aktif. Buat checkpoint terlebih dahulu.</p>
              )}
              {form.requiredCheckpoints.length > 0 && (
                <p className="text-xs text-green-600 mt-1 font-medium">{form.requiredCheckpoints.length} checkpoint dipilih</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Catatan tambahan..." />
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">Buat Jadwal Patroli</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex space-x-1">
          {[{ key: 'today', label: 'Hari Ini' }, { key: 'week', label: 'Minggu Ini' }, { key: 'month', label: 'Bulan Ini' }].map((q) => (
            <button key={q.key} onClick={() => applyQuickFilter(q.key)} className={cn('px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors', quickFilter === q.key ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')}>{q.label}</button>
          ))}
        </div>
        <input type="date" value={dateRange.start} onChange={(e) => { setDateRange((d) => ({ ...d, start: e.target.value })); setQuickFilter(''); setPage(1); }} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
        <span className="text-gray-400 text-sm">s/d</span>
        <input type="date" value={dateRange.end} onChange={(e) => { setDateRange((d) => ({ ...d, end: e.target.value })); setQuickFilter(''); setPage(1); }} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
          <option value="">Semua Status</option>
          <option value="scheduled">Terjadwal</option>
          <option value="in_progress">Berjalan</option>
          <option value="completed">Selesai</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
        {(statusFilter || dateRange.start || dateRange.end) && (
          <button onClick={() => { setStatusFilter(''); setDateRange({ start: '', end: '' }); setQuickFilter(''); setPage(1); }} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="Reset"><X className="w-4 h-4" /></button>
        )}
        <div className="flex-1" />
        {canManage && (
          <button onClick={openAddModal} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 whitespace-nowrap font-medium">
            <Plus className="w-5 h-5 mr-2" />Buat Jadwal Patroli
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tanggal</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Shift</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Petugas</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Progress</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              {canManage && <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : schedules.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Tidak ada jadwal ditemukan</td></tr>
            ) : schedules.map((s) => {
              const pct = s.totalCheckpoints > 0 ? Math.round((s.completedCheckpoints / s.totalCheckpoints) * 100) : 0;
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{s.date ? format(new Date(s.date), 'dd MMM yyyy') : '-'}</td>
                  <td className="px-6 py-4">{shiftBadge(s.shift)}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center flex-wrap gap-1">
                      {(s.assignedOfficerNames?.length > 0) ? s.assignedOfficerNames.map((name: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{name}</span>
                      )) : <span className="text-gray-400">-</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', pct >= 100 ? 'bg-green-500' : 'bg-primary-600')} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className="text-xs text-gray-600 font-medium">{s.completedCheckpoints || 0}/{s.totalCheckpoints || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{statusBadge(s.status)}</td>
                  {canManage && (
                    <td className="px-6 py-4">
                      <div className="flex space-x-1">
                        {s.status === 'scheduled' && <button onClick={() => handleAction('start', s.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Mulai Patroli"><Play className="w-4 h-4" /></button>}
                        {s.status === 'in_progress' && <button onClick={() => handleAction('complete', s.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Selesaikan"><CheckCircle className="w-4 h-4" /></button>}
                        {(s.status === 'scheduled' || s.status === 'in_progress') && <button onClick={() => handleAction('cancel', s.id)} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded" title="Batalkan"><XCircle className="w-4 h-4" /></button>}
                        <button onClick={() => handleAction('delete', s.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination page={page} totalPages={meta.totalPages || 1} total={meta.total} onPageChange={setPage} />
      </div>

      {renderScheduleModal()}
    </div>
  );
}

// ========================================================
// ============ LOGS TAB ============
// ========================================================
function LogsTab() {
  const scope = useRegionScope();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>({});

  // Filters
  const today = format(new Date(), 'yyyy-MM-dd');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: today, end: today });
  const [quickFilter, setQuickFilter] = useState<string>('today');
  const [statusFilter, setStatusFilter] = useState('');
  const [checkpointFilter, setCheckpointFilter] = useState('');
  const [checkpointOptions, setCheckpointOptions] = useState<any[]>([]);

  // Log stats
  const [logStats, setLogStats] = useState({ total: 0, valid: 0, invalidLocation: 0, invalidTime: 0, duplicate: 0 });

  useEffect(() => {
    (async () => {
      try {
        const res = await patrolCheckpointsService.getAll({ limit: 100, ...scope });
        setCheckpointOptions(res.data || []);
      } catch {}
    })();
  }, [scope.desa, scope.rw, scope.rt]);

  const applyQuickFilter = (key: string) => {
    const now = new Date();
    let start = '', end = '';
    if (key === 'today') { const d = format(now, 'yyyy-MM-dd'); start = d; end = d; }
    else if (key === 'week') { start = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'); end = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'); }
    else if (key === 'month') { start = format(startOfMonth(now), 'yyyy-MM-dd'); end = format(endOfMonth(now), 'yyyy-MM-dd'); }
    setQuickFilter(key === quickFilter ? '' : key);
    if (key === quickFilter) { setDateRange({ start: '', end: '' }); } else { setDateRange({ start, end }); }
    setPage(1);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20, ...scope };
      if (dateRange.start) params.startDate = new Date(dateRange.start + 'T00:00:00').toISOString();
      if (dateRange.end) params.endDate = new Date(dateRange.end + 'T23:59:59').toISOString();
      if (statusFilter) params.status = statusFilter;
      if (checkpointFilter) params.checkpointId = checkpointFilter;

      const [logsRes, statsRes] = await Promise.all([
        patrolLogsService.getAll(params),
        patrolLogsService.getStatistics({
          ...(dateRange.start ? { startDate: new Date(dateRange.start + 'T00:00:00').toISOString() } : {}),
          ...(dateRange.end ? { endDate: new Date(dateRange.end + 'T23:59:59').toISOString() } : {}),
          ...scope,
        }),
      ]);
      setLogs(logsRes.data || []);
      setMeta(logsRes.meta || {});
      setLogStats({
        total: statsRes.total || 0,
        valid: statsRes.valid || 0,
        invalidLocation: statsRes.invalidLocation || 0,
        invalidTime: statsRes.invalidTime || 0,
        duplicate: statsRes.duplicate || 0,
      });
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [page, dateRange.start, dateRange.end, statusFilter, checkpointFilter, scope.desa, scope.rw, scope.rt]);

  useEffect(() => { loadData(); }, [loadData]);

  const statusBadge = (status: string) => {
    const m: Record<string, [string, string]> = { valid: ['bg-green-100 text-green-800', 'Valid'], invalid_location: ['bg-red-100 text-red-800', 'Lokasi Invalid'], invalid_time: ['bg-orange-100 text-orange-800', 'Waktu Invalid'], duplicate: ['bg-yellow-100 text-yellow-800', 'Duplikat'] };
    const [cls, label] = m[status] || ['bg-gray-100 text-gray-800', status];
    return <span className={cn('px-2 py-1 rounded-full text-xs font-medium', cls)}>{label}</span>;
  };

  // Map data: logs that have lat/lng
  const logsWithCoords = logs.filter((l) => l.latitude && l.longitude);
  const mapCenter: [number, number] = logsWithCoords.length > 0
    ? [logsWithCoords[0].latitude, logsWithCoords[0].longitude]
    : DEFAULT_CENTER;

  // Route: sorted by time
  const routeCoords: [number, number][] = logsWithCoords
    .sort((a, b) => new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime())
    .map((l) => [l.latitude, l.longitude]);

  return (
    <div>
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 text-center">
          <p className="text-xl font-bold text-gray-900">{logStats.total}</p>
          <p className="text-xs text-gray-500">Total Scan</p>
        </div>
        <div className="bg-white rounded-lg border border-green-200 px-4 py-3 text-center">
          <p className="text-xl font-bold text-green-600">{logStats.valid}</p>
          <p className="text-xs text-gray-500">Valid</p>
        </div>
        <div className="bg-white rounded-lg border border-red-200 px-4 py-3 text-center">
          <p className="text-xl font-bold text-red-600">{logStats.invalidLocation}</p>
          <p className="text-xs text-gray-500">Lokasi Invalid</p>
        </div>
        <div className="bg-white rounded-lg border border-orange-200 px-4 py-3 text-center">
          <p className="text-xl font-bold text-orange-600">{logStats.invalidTime}</p>
          <p className="text-xs text-gray-500">Waktu Invalid</p>
        </div>
        <div className="bg-white rounded-lg border border-yellow-200 px-4 py-3 text-center">
          <p className="text-xl font-bold text-yellow-600">{logStats.duplicate}</p>
          <p className="text-xs text-gray-500">Duplikat</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex space-x-1">
          {[{ key: 'today', label: 'Hari Ini' }, { key: 'week', label: 'Minggu Ini' }, { key: 'month', label: 'Bulan Ini' }].map((q) => (
            <button key={q.key} onClick={() => applyQuickFilter(q.key)} className={cn('px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors', quickFilter === q.key ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')}>{q.label}</button>
          ))}
        </div>
        <input type="date" value={dateRange.start} onChange={(e) => { setDateRange((d) => ({ ...d, start: e.target.value })); setQuickFilter(''); setPage(1); }} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
        <span className="text-gray-400 text-sm">s/d</span>
        <input type="date" value={dateRange.end} onChange={(e) => { setDateRange((d) => ({ ...d, end: e.target.value })); setQuickFilter(''); setPage(1); }} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
        <select value={checkpointFilter} onChange={(e) => { setCheckpointFilter(e.target.value); setPage(1); }} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
          <option value="">Semua Checkpoint</option>
          {checkpointOptions.map((cp: any) => <option key={cp.id} value={cp.id}>{cp.code} - {cp.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
          <option value="">Semua Status</option>
          <option value="valid">Valid</option>
          <option value="invalid_location">Lokasi Invalid</option>
          <option value="invalid_time">Waktu Invalid</option>
          <option value="duplicate">Duplikat</option>
        </select>
        {(statusFilter || checkpointFilter) && (
          <button onClick={() => { setStatusFilter(''); setCheckpointFilter(''); setPage(1); }} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="Reset"><X className="w-4 h-4" /></button>
        )}
      </div>

      {/* Patrol Route Map */}
      {logsWithCoords.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700">Peta Rute Patroli</h3>
            </div>
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <span className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span>Valid</span>
              <span className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded-full mr-1"></span>Invalid</span>
              <span className="flex items-center"><span className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></span>Duplikat</span>
              <span className="flex items-center border-t-2 border-dashed border-blue-400 w-5 mr-1"></span>Rute
            </div>
          </div>
          <div style={{ height: 380 }}>
            <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {/* Route line */}
              {routeCoords.length > 1 && <Polyline positions={routeCoords} pathOptions={{ color: '#3b82f6', weight: 3, dashArray: '8 6', opacity: 0.7 }} />}
              {/* Scan markers */}
              {logsWithCoords.map((log, idx) => (
                <Marker key={log.id || idx} position={[log.latitude, log.longitude]} icon={LOG_ICON_MAP[log.status] || logIconValid}>
                  <Popup>
                    <div className="min-w-[160px] text-sm">
                      <p className="font-bold">{log.checkpointName || 'Checkpoint'}</p>
                      <p className="text-xs text-gray-500 font-mono">{log.checkpointCode}</p>
                      <p className="text-xs text-gray-600 mt-1">Petugas: {log.scannedByName || '-'}</p>
                      <p className="text-xs text-gray-600">Waktu: {log.scannedAt ? format(new Date(log.scannedAt), 'HH:mm:ss') : '-'}</p>
                      {log.distanceFromCheckpoint != null && (
                        <p className="text-xs text-gray-600">Jarak: {Math.round(log.distanceFromCheckpoint)} m</p>
                      )}
                      <p className={cn('text-xs font-medium mt-1', log.status === 'valid' ? 'text-green-600' : log.status === 'duplicate' ? 'text-yellow-600' : 'text-red-600')}>
                        {log.status === 'valid' ? 'Valid' : log.status === 'invalid_location' ? 'Lokasi Invalid' : log.status === 'invalid_time' ? 'Waktu Invalid' : 'Duplikat'}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">Riwayat Scan Checkpoint</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Waktu</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Checkpoint</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Petugas</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Jarak</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Belum ada log patroli untuk periode ini</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{log.scannedAt ? format(new Date(log.scannedAt), 'dd MMM yyyy HH:mm') : '-'}</td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium">{log.checkpointName || '-'}</p>
                  <p className="text-xs text-gray-500 font-mono">{log.checkpointCode || ''}</p>
                </td>
                <td className="px-6 py-4 text-sm">{log.scannedByName || '-'}</td>
                <td className="px-6 py-4">{statusBadge(log.status)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{log.distanceFromCheckpoint != null ? `${Math.round(log.distanceFromCheckpoint)} m` : '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">{log.notes || log.validationMessage || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} totalPages={meta.totalPages || 1} total={meta.total} onPageChange={setPage} />
      </div>
    </div>
  );
}

// ========================================================
// ============ QR SCANNER MODAL ============
// ========================================================
function QRScannerModal({ onScan, onClose }: { onScan: (data: string) => void; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode('patrol-qr-reader');
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => {
          if (stoppedRef.current) return;
          stoppedRef.current = true;
          scanner.stop().then(() => onScan(decodedText)).catch(() => onScan(decodedText));
        },
        () => {},
      )
      .catch(() => {
        setError('Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.');
      });

    return () => {
      stoppedRef.current = true;
      scanner.stop().catch(() => {});
    };
  }, []);

  const handleClose = () => {
    stoppedRef.current = true;
    scannerRef.current?.stop().catch(() => {});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <div>
          <h3 className="text-white font-semibold text-lg">Scan QR Checkpoint</h3>
          <p className="text-gray-400 text-sm">Arahkan kamera ke QR Code di pos checkpoint</p>
        </div>
        <button onClick={handleClose} className="p-2 text-white hover:bg-white/10 rounded-lg">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        {error ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-white text-lg font-medium mb-2">Kamera Tidak Tersedia</p>
            <p className="text-gray-400 mb-6 max-w-sm">{error}</p>
            <button onClick={handleClose} className="px-6 py-2.5 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100">
              Tutup
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div id="patrol-qr-reader" className="rounded-xl overflow-hidden" />
            <p className="text-center text-gray-400 text-sm mt-4">Posisikan QR Code di dalam kotak scan</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================================
// ============ PATROLI SAYA TAB ============
// ========================================================
function PatrolSayaTab() {
  const { user } = useAuthStore();
  const scope = useRegionScope();
  const canScan = user ? canPerformAction(user.role, 'patrol', 'scan') : false;

  // Schedule list
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active patrol execution
  const [activePatrol, setActivePatrol] = useState<any>(null);
  const [patrolLogs, setPatrolLogs] = useState<any[]>([]);
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [loadingExec, setLoadingExec] = useState(false);

  // QR Scanner
  const [showScanner, setShowScanner] = useState(false);

  // Load today's & upcoming schedules
  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      const res = await patrolSchedulesService.getAll({
        startDate: today,
        limit: 50,
        ...scope,
      });
      // Sort: in_progress first, then scheduled, then rest
      const sorted = (res.data || []).sort((a: any, b: any) => {
        const order: Record<string, number> = { in_progress: 0, scheduled: 1, completed: 2, cancelled: 3 };
        return (order[a.status] ?? 9) - (order[b.status] ?? 9);
      });
      setSchedules(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [scope.desa, scope.rw, scope.rt]);

  useEffect(() => { loadSchedules(); }, [loadSchedules]);

  // Open patrol execution view
  const openPatrol = async (schedule: any) => {
    setLoadingExec(true);
    try {
      const cpIds = schedule.requiredCheckpoints || [];
      const [logsRes, cpRes] = await Promise.all([
        patrolLogsService.getScheduleLogs(schedule.id),
        patrolCheckpointsService.getAll({ limit: 100, ...scope }),
      ]);
      const allCheckpoints = cpRes.data || [];
      const requiredCps = cpIds.length > 0
        ? cpIds.map((id: string) => allCheckpoints.find((cp: any) => cp.id === id)).filter(Boolean)
        : allCheckpoints;

      setCheckpoints(requiredCps);
      setPatrolLogs(Array.isArray(logsRes) ? logsRes : logsRes?.data || []);
      setActivePatrol(schedule);
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memuat data patroli' });
    } finally {
      setLoadingExec(false);
    }
  };

  // Start patrol
  const handleStartPatrol = async (schedule: any) => {
    try {
      await patrolSchedulesService.start(schedule.id);
      await Swal.fire({
        icon: 'success',
        title: 'Patroli Dimulai!',
        text: 'Segera kunjungi setiap checkpoint dan scan QR Code.',
        timer: 2000,
        showConfirmButton: false,
      });
      loadSchedules();
      openPatrol({ ...schedule, status: 'in_progress' });
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memulai patroli' });
    }
  };

  // Handle QR scan result
  const handleQRScan = async (qrCodeData: string) => {
    setShowScanner(false);
    if (!activePatrol) return;

    // Show loading
    Swal.fire({ title: 'Memproses scan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      // Parse QR data
      let parsedData: any;
      try {
        parsedData = JSON.parse(qrCodeData);
      } catch {
        Swal.fire({ icon: 'error', title: 'QR Tidak Valid', text: 'Format QR code tidak dikenali.' });
        return;
      }

      if (parsedData.type !== 'patrol_checkpoint') {
        Swal.fire({ icon: 'error', title: 'QR Tidak Valid', text: 'QR code ini bukan untuk checkpoint patroli.' });
        return;
      }

      // Get user GPS
      let latitude: number | undefined;
      let longitude: number | undefined;
      let gpsAccuracy: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }),
        );
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
        gpsAccuracy = pos.coords.accuracy;
      } catch {
        // GPS not available, continue without it
      }

      // Send scan request
      const result = await patrolLogsService.scan({
        scheduleId: activePatrol.id,
        checkpointId: parsedData.checkpointId,
        qrCodeData,
        latitude,
        longitude,
        gpsAccuracy,
      });

      // Reload logs
      const logsRes = await patrolLogsService.getScheduleLogs(activePatrol.id);
      setPatrolLogs(Array.isArray(logsRes) ? logsRes : logsRes?.data || []);

      // Show result
      if (result.status === 'valid') {
        const cp = checkpoints.find((c: any) => c.id === parsedData.checkpointId);
        await Swal.fire({
          icon: 'success',
          title: 'Scan Berhasil!',
          html: `
            <div class="text-left">
              <p class="font-semibold text-lg">${cp?.name || result.checkpointName || 'Checkpoint'}</p>
              <p class="text-sm text-gray-500 mt-1">${result.validationMessage || 'Checkpoint berhasil discan'}</p>
              ${result.distanceFromCheckpoint != null ? `<p class="text-sm text-gray-500">Jarak: ${Math.round(result.distanceFromCheckpoint)} meter</p>` : ''}
            </div>
          `,
          timer: 3000,
          showConfirmButton: false,
        });
      } else if (result.status === 'duplicate') {
        await Swal.fire({
          icon: 'warning',
          title: 'Sudah Discan',
          text: 'Checkpoint ini sudah discan sebelumnya dalam patroli ini.',
          timer: 2500,
          showConfirmButton: false,
        });
      } else if (result.status === 'invalid_location') {
        await Swal.fire({
          icon: 'warning',
          title: 'Lokasi Terlalu Jauh',
          html: `<p>${result.validationMessage || 'Anda terlalu jauh dari checkpoint.'}</p>
                 ${result.distanceFromCheckpoint != null ? `<p class="text-sm text-gray-500 mt-2">Jarak Anda: ${Math.round(result.distanceFromCheckpoint)} meter</p>` : ''}`,
        });
      } else {
        await Swal.fire({
          icon: 'info',
          title: 'Scan Dicatat',
          html: `<p>${result.validationMessage || 'Scan tercatat dengan catatan.'}</p>`,
        });
      }

      // Refresh schedules for updated progress
      loadSchedules();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Scan',
        text: err?.response?.data?.message || 'Gagal memproses scan QR. Pastikan QR code valid.',
      });
    }
  };

  // Complete patrol
  const handleCompletePatrol = async () => {
    const scannedIds = patrolLogs.filter((l: any) => l.status === 'valid').map((l: any) => l.checkpointId);
    const unscanned = checkpoints.filter((cp: any) => !scannedIds.includes(cp.id));

    const r = await Swal.fire({
      title: 'Selesaikan Patroli?',
      html: unscanned.length > 0
        ? `<p class="text-amber-600 font-medium">${unscanned.length} checkpoint belum discan:</p>
           <ul class="text-sm text-left mt-2 list-disc pl-6">${unscanned.map((cp: any) => `<li>${cp.name}</li>`).join('')}</ul>
           <p class="text-sm text-gray-500 mt-3">Lanjutkan selesaikan patroli?</p>`
        : '<p class="text-green-600">Semua checkpoint sudah discan!</p>',
      icon: unscanned.length > 0 ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Selesaikan',
      cancelButtonText: 'Belum',
      confirmButtonColor: unscanned.length > 0 ? '#f59e0b' : '#16a34a',
    });

    if (!r.isConfirmed) return;

    try {
      await patrolSchedulesService.complete(activePatrol.id);
      await Swal.fire({ icon: 'success', title: 'Patroli Selesai!', text: 'Terima kasih atas partisipasi Anda.', timer: 2500, showConfirmButton: false });
      setActivePatrol(null);
      loadSchedules();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menyelesaikan patroli' });
    }
  };

  // === PATROL EXECUTION VIEW ===
  if (activePatrol) {
    const scannedCheckpointIds = patrolLogs
      .filter((l: any) => l.status === 'valid')
      .map((l: any) => l.checkpointId);

    const uniqueScanned = [...new Set(scannedCheckpointIds)];
    const totalCps = checkpoints.length;
    const scannedCps = checkpoints.filter((cp: any) => uniqueScanned.includes(cp.id)).length;
    const progress = totalCps > 0 ? Math.round((scannedCps / totalCps) * 100) : 0;

    return (
      <div>
        {loadingExec && (
          <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 shadow-xl text-center">
              <RefreshCw className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Memuat data patroli...</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setActivePatrol(null)} className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-medium">
            <ChevronLeft className="w-4 h-4 mr-1" />Kembali ke Daftar
          </button>
          <div className="flex space-x-2">
            {activePatrol.status === 'in_progress' && (
              <button onClick={handleCompletePatrol} className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />Selesaikan Patroli
              </button>
            )}
          </div>
        </div>

        {/* Patrol Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {activePatrol.shift === 'Siang'
                ? <div className="p-3 bg-amber-100 rounded-xl"><Sun className="w-6 h-6 text-amber-600" /></div>
                : <div className="p-3 bg-indigo-100 rounded-xl"><Moon className="w-6 h-6 text-indigo-600" /></div>}
              <div>
                <h3 className="text-lg font-bold text-gray-900">Patroli {activePatrol.shift}</h3>
                <p className="text-sm text-gray-500">{activePatrol.date ? format(new Date(activePatrol.date), 'dd MMMM yyyy') : '-'}</p>
              </div>
            </div>
            <span className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium',
              activePatrol.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
              activePatrol.status === 'completed' ? 'bg-green-100 text-green-800' :
              'bg-blue-100 text-blue-800',
            )}>
              {activePatrol.status === 'in_progress' ? 'Sedang Berjalan' : activePatrol.status === 'completed' ? 'Selesai' : 'Terjadwal'}
            </span>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress Checkpoint</span>
              <span className="text-sm font-bold text-gray-900">{scannedCps}/{totalCps} ({progress}%)</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', progress >= 100 ? 'bg-green-500' : 'bg-primary-600')}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Officers */}
          {activePatrol.assignedOfficerNames?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-gray-500 leading-relaxed">Petugas:</span>
              {activePatrol.assignedOfficerNames.map((name: string, i: number) => (
                <span
                  key={i}
                  className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                    name === user?.name ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-700'
                  )}
                >
                  {name}{name === user?.name ? ' (Anda)' : ''}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Scan QR Button */}
        {activePatrol.status === 'in_progress' && canScan && (
          <button
            onClick={() => setShowScanner(true)}
            className="w-full mb-6 flex items-center justify-center px-6 py-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
          >
            <QrCode className="w-7 h-7 mr-3" />
            Scan QR Checkpoint
          </button>
        )}

        {/* Checkpoint List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center space-x-2">
            <Target className="w-4 h-4 text-gray-500" />
            <h4 className="text-sm font-semibold text-gray-700">Daftar Checkpoint ({scannedCps}/{totalCps} terscan)</h4>
          </div>
          <div className="divide-y divide-gray-100">
            {checkpoints.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-500 text-sm">Tidak ada checkpoint yang perlu discan</div>
            ) : checkpoints.map((cp: any) => {
              const isScanned = uniqueScanned.includes(cp.id);
              const log = patrolLogs.find((l: any) => l.checkpointId === cp.id && l.status === 'valid');

              return (
                <div key={cp.id} className={cn('flex items-center px-5 py-4 transition-colors', isScanned ? 'bg-green-50/50' : 'hover:bg-gray-50')}>
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0',
                    isScanned ? 'bg-green-500 shadow-sm' : 'bg-gray-200',
                  )}>
                    {isScanned
                      ? <CheckCircle className="w-5 h-5 text-white" />
                      : <MapPin className="w-5 h-5 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-semibold', isScanned ? 'text-green-800' : 'text-gray-900')}>{cp.name}</p>
                    <p className="text-xs text-gray-500 truncate">{cp.code} &bull; {cp.address || '-'}</p>
                    {isScanned && log && (
                      <p className="text-xs text-green-600 mt-0.5 font-medium">
                        Discan {log.scannedAt ? format(new Date(log.scannedAt), 'HH:mm:ss') : ''}
                        {log.scannedByName ? ` oleh ${log.scannedByName}` : ''}
                        {log.distanceFromCheckpoint != null ? ` \u2022 ${Math.round(log.distanceFromCheckpoint)}m` : ''}
                      </p>
                    )}
                  </div>
                  {isScanned ? (
                    <span className="px-2.5 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex-shrink-0 ml-2">
                      <CheckCircle className="w-3 h-3 inline mr-1" />Terscan
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full flex-shrink-0 ml-2">Belum</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scan History */}
        {patrolLogs.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <h4 className="text-sm font-semibold text-gray-700">Riwayat Scan ({patrolLogs.length})</h4>
            </div>
            <div className="divide-y divide-gray-100">
              {[...patrolLogs]
                .sort((a: any, b: any) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime())
                .map((log: any, idx: number) => (
                  <div key={log.id || idx} className="flex items-center px-5 py-3">
                    <div className={cn(
                      'w-2.5 h-2.5 rounded-full mr-3 flex-shrink-0',
                      log.status === 'valid' ? 'bg-green-500' :
                      log.status === 'duplicate' ? 'bg-yellow-500' :
                      log.status === 'invalid_location' ? 'bg-red-500' :
                      'bg-orange-500',
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900">{log.checkpointName || 'Checkpoint'}</p>
                      <p className="text-xs text-gray-500">
                        {log.scannedAt ? format(new Date(log.scannedAt), 'HH:mm:ss') : '-'}
                        {log.scannedByName ? ` \u2022 ${log.scannedByName}` : ''}
                        {log.distanceFromCheckpoint != null ? ` \u2022 ${Math.round(log.distanceFromCheckpoint)}m` : ''}
                      </p>
                    </div>
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-2',
                      log.status === 'valid' ? 'bg-green-100 text-green-800' :
                      log.status === 'duplicate' ? 'bg-yellow-100 text-yellow-800' :
                      log.status === 'invalid_location' ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-orange-800',
                    )}>
                      {log.status === 'valid' ? 'Valid' :
                       log.status === 'duplicate' ? 'Duplikat' :
                       log.status === 'invalid_location' ? 'Lokasi Invalid' :
                       log.status === 'invalid_time' ? 'Waktu Invalid' : log.status}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* QR Scanner Modal */}
        {showScanner && <QRScannerModal onScan={handleQRScan} onClose={() => setShowScanner(false)} />}
      </div>
    );
  }

  // === SCHEDULE LIST VIEW ===
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Jadwal Patroli Saya</h3>
          <p className="text-sm text-gray-500">Jadwal patroli hari ini dan mendatang di wilayah Anda</p>
        </div>
        <button onClick={loadSchedules} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Refresh">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-6 h-6 text-primary-600 animate-spin mr-3" />
          <span className="text-gray-500">Memuat jadwal...</span>
        </div>
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="Tidak Ada Jadwal"
          desc="Belum ada jadwal patroli untuk hari ini dan mendatang di wilayah Anda. Hubungi admin RT untuk dijadwalkan."
        />
      ) : (
        <div className="grid gap-4">
          {schedules.map((s: any) => {
            const pct = s.totalCheckpoints > 0 ? Math.round((s.completedCheckpoints / s.totalCheckpoints) * 100) : 0;
            const isAssigned = s.assignedOfficerNames?.includes(user?.name);
            const isToday = s.date && format(new Date(s.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

            return (
              <div
                key={s.id}
                className={cn(
                  'bg-white rounded-xl shadow-sm border p-5 transition-all',
                  isAssigned ? 'border-primary-300 ring-1 ring-primary-50' : 'border-gray-200',
                  s.status === 'in_progress' && 'border-yellow-300 ring-1 ring-yellow-50',
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {s.shift === 'Siang'
                      ? <div className="p-2.5 bg-amber-100 rounded-xl"><Sun className="w-5 h-5 text-amber-600" /></div>
                      : <div className="p-2.5 bg-indigo-100 rounded-xl"><Moon className="w-5 h-5 text-indigo-600" /></div>}
                    <div>
                      <h4 className="font-bold text-gray-900">Patroli {s.shift}</h4>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-gray-500">{s.date ? format(new Date(s.date), 'dd MMM yyyy') : '-'}</p>
                        {isToday && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">HARI INI</span>}
                        {isAssigned && <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 text-[10px] font-bold rounded">ANDA DITUGASKAN</span>}
                      </div>
                    </div>
                  </div>
                  <span className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-semibold',
                    s.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    s.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 animate-pulse' :
                    s.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800',
                  )}>
                    {s.status === 'scheduled' ? 'Terjadwal' : s.status === 'in_progress' ? 'Berjalan' : s.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                  </span>
                </div>

                {/* Progress */}
                {s.totalCheckpoints > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Checkpoint</span>
                      <span className="text-xs font-semibold text-gray-700">{s.completedCheckpoints || 0}/{s.totalCheckpoints} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', pct >= 100 ? 'bg-green-500' : 'bg-primary-600')} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                )}

                {/* Officers */}
                {s.assignedOfficerNames?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {s.assignedOfficerNames.map((name: string, i: number) => (
                      <span
                        key={i}
                        className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                          name === user?.name ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        <User className="w-3 h-3 inline mr-0.5" />{name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  {s.status === 'scheduled' && canScan && (
                    <button
                      onClick={() => handleStartPatrol(s)}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm transition-colors"
                    >
                      <Play className="w-4 h-4 mr-2" />Mulai Patroli
                    </button>
                  )}
                  {s.status === 'in_progress' && (
                    <button
                      onClick={() => openPatrol(s)}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold text-sm transition-colors"
                    >
                      <QrCode className="w-4 h-4 mr-2" />Lanjutkan Patroli
                    </button>
                  )}
                  {s.status === 'completed' && (
                    <button
                      onClick={() => openPatrol(s)}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
                    >
                      <Clock className="w-4 h-4 mr-2" />Lihat Detail
                    </button>
                  )}
                </div>

                {/* Notes */}
                {s.notes && (
                  <p className="text-xs text-gray-400 mt-3 italic">{s.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
