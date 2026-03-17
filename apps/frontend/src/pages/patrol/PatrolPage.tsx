import { useState, useEffect } from 'react';
import { patrolCheckpointsService, patrolSchedulesService, patrolLogsService } from '../../services/patrol.service';
import { useAuthStore } from '../../stores/auth.store';
import { canPerformAction } from '../../config/permissions';
import { useRegionScope } from '../../hooks/useRegionScope';
import { MapPin, Clock, QrCode, Plus, Play, CheckCircle, XCircle, Trash2, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';
import Swal from 'sweetalert2';

export default function PatrolPage() {
  const tabs = [
    { id: 'checkpoints', label: 'Checkpoint', icon: MapPin },
    { id: 'schedules', label: 'Jadwal Patroli', icon: Calendar },
    { id: 'logs', label: 'Log Patroli', icon: Clock },
  ];
  const [activeTab, setActiveTab] = useState('checkpoints');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patroli Ronda</h1>
          <p className="text-gray-600 mt-1">Kelola jadwal dan checkpoint patroli</p>
        </div>
      </div>

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

      {activeTab === 'checkpoints' && <CheckpointsTab />}
      {activeTab === 'schedules' && <SchedulesTab />}
      {activeTab === 'logs' && <LogsTab />}
    </div>
  );
}

function CheckpointsTab() {
  const { user } = useAuthStore();
  const scope = useRegionScope();
  const canManage = user ? canPerformAction(user.role, 'patrol', 'manage') : false;
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nama: '', lokasi: '', deskripsi: '', regionId: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await patrolCheckpointsService.getAll({ limit: 50, ...scope });
      setCheckpoints(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await patrolCheckpointsService.create(form);
      setShowForm(false);
      setForm({ nama: '', lokasi: '', deskripsi: '', regionId: '' });
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Checkpoint berhasil dibuat', timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal membuat checkpoint' });
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    const result = await Swal.fire({
      title: 'Hapus Checkpoint?',
      text: `Checkpoint "${nama}" akan dihapus permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    try {
      await patrolCheckpointsService.delete(id);
      await Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'Checkpoint berhasil dihapus', timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus checkpoint' });
    }
  };

  return (
    <div>
      {canManage && (
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Plus className="w-5 h-5 mr-2" />Tambah Checkpoint
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Tambah Checkpoint Baru</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Checkpoint</label>
                <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                <input type="text" value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Simpan</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">Loading...</div>
        ) : checkpoints.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">Belum ada checkpoint</div>
        ) : checkpoints.map((cp) => (
          <div key={cp.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className={cn('w-3 h-3 rounded-full', cp.isActive ? 'bg-green-500' : 'bg-gray-400')} />
                <h4 className="font-semibold text-gray-900">{cp.nama}</h4>
              </div>
              {canManage && (
                <button onClick={() => handleDelete(cp.id, cp.nama)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center"><MapPin className="w-4 h-4 mr-2" />{cp.lokasi || '-'}</div>
              {cp.deskripsi && <p className="text-gray-500">{cp.deskripsi}</p>}
              {cp.qrCode && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-center">
                  <QrCode className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                  <p className="text-xs text-gray-500">QR: {cp.qrCode.substring(0, 16)}...</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SchedulesTab() {
  const { user } = useAuthStore();
  const scope = useRegionScope();
  const canManage = user ? canPerformAction(user.role, 'patrol', 'manage') : false;
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tanggal: '', waktuMulai: '', waktuSelesai: '', assignedOfficers: '', regionId: '', notes: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await patrolSchedulesService.getAll({ limit: 50, ...scope });
      setSchedules(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await patrolSchedulesService.create({
        ...form,
        assignedOfficers: form.assignedOfficers.split(',').map(s => s.trim()).filter(Boolean),
      });
      setShowForm(false);
      setForm({ tanggal: '', waktuMulai: '', waktuSelesai: '', assignedOfficers: '', regionId: '', notes: '' });
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Jadwal patroli berhasil dibuat', timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal membuat jadwal' });
    }
  };

  const handleStart = async (id: string) => {
    try {
      await patrolSchedulesService.start(id);
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Patroli dimulai', timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memulai patroli' });
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await patrolSchedulesService.complete(id);
      await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Patroli selesai', timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menyelesaikan patroli' });
    }
  };

  const handleCancel = async (id: string) => {
    const result = await Swal.fire({
      title: 'Batalkan Patroli?',
      text: 'Jadwal patroli ini akan dibatalkan.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Batalkan',
      cancelButtonText: 'Tidak',
    });
    if (!result.isConfirmed) return;
    try {
      await patrolSchedulesService.cancel(id);
      await Swal.fire({ icon: 'success', title: 'Dibatalkan', text: 'Patroli berhasil dibatalkan', timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal membatalkan patroli' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus Jadwal?',
      text: 'Jadwal patroli ini akan dihapus permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });
    if (!result.isConfirmed) return;
    try {
      await patrolSchedulesService.delete(id);
      await Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'Jadwal berhasil dihapus', timer: 1500, showConfirmButton: false });
      loadData();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus jadwal' });
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      scheduled: 'Terjadwal',
      in_progress: 'Berjalan',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    };
    return <span className={cn('px-2 py-1 rounded-full text-xs font-medium', map[status] || 'bg-gray-100 text-gray-800')}>{labels[status] || status}</span>;
  };

  return (
    <div>
      {canManage && (
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Plus className="w-5 h-5 mr-2" />Tambah Jadwal
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Buat Jadwal Patroli</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Mulai</label>
                <input type="time" value={form.waktuMulai} onChange={(e) => setForm({ ...form, waktuMulai: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Selesai</label>
                <input type="time" value={form.waktuSelesai} onChange={(e) => setForm({ ...form, waktuSelesai: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Petugas (pisah koma)</label>
                <input type="text" value={form.assignedOfficers} onChange={(e) => setForm({ ...form, assignedOfficers: e.target.value })} placeholder="Nama1, Nama2" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Simpan</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tanggal</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Waktu</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Petugas</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              {canManage && <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : schedules.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada jadwal</td></tr>
            ) : schedules.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{s.tanggal ? format(new Date(s.tanggal), 'dd MMM yyyy') : '-'}</td>
                <td className="px-6 py-4 text-sm">{s.waktuMulai || ''} - {s.waktuSelesai || ''}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center"><User className="w-4 h-4 mr-1 text-gray-400" />{Array.isArray(s.assignedOfficers) ? s.assignedOfficers.join(', ') : s.assignedOfficerName || '-'}</div>
                </td>
                <td className="px-6 py-4">{getStatusBadge(s.status)}</td>
                {canManage && (
                  <td className="px-6 py-4">
                    <div className="flex space-x-1">
                      {s.status === 'scheduled' && (
                        <button onClick={() => handleStart(s.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Mulai"><Play className="w-4 h-4" /></button>
                      )}
                      {s.status === 'in_progress' && (
                        <button onClick={() => handleComplete(s.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Selesai"><CheckCircle className="w-4 h-4" /></button>
                      )}
                      {(s.status === 'scheduled' || s.status === 'in_progress') && (
                        <button onClick={() => handleCancel(s.id)} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded" title="Batalkan"><XCircle className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LogsTab() {
  const scope = useRegionScope();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await patrolLogsService.getAll({ limit: 50, ...scope });
      setLogs(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      missed: 'bg-red-100 text-red-800',
    };
    return <span className={cn('px-2 py-1 rounded-full text-xs font-medium', map[status] || 'bg-gray-100 text-gray-800')}>{status}</span>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Log Patroli</h3>
        <p className="text-sm text-gray-500">Riwayat scan checkpoint patroli</p>
      </div>
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Waktu</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Checkpoint</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Petugas</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Catatan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {loading ? (
            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
          ) : logs.length === 0 ? (
            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada log patroli</td></tr>
          ) : logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm">{log.scannedAt ? format(new Date(log.scannedAt), 'dd MMM yyyy HH:mm') : log.createdAt ? format(new Date(log.createdAt), 'dd MMM yyyy HH:mm') : '-'}</td>
              <td className="px-6 py-4 text-sm font-medium">{log.checkpointName || log.checkpointId || '-'}</td>
              <td className="px-6 py-4 text-sm">{log.scannedByName || log.scannedBy || '-'}</td>
              <td className="px-6 py-4">{getStatusBadge(log.status)}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{log.notes || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
