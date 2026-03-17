import { useState, useEffect } from 'react';
import { panicService } from '../../services/panic.service';
import { useAuthStore } from '../../stores/auth.store';
import { canPerformAction } from '../../config/permissions';
import { useRegionScope } from '../../hooks/useRegionScope';
import { AlertCircle, MapPin, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';
import Swal from 'sweetalert2';

const emergencyTypes = ['Kebakaran', 'Pencurian', 'Kesehatan', 'Kecelakaan', 'Bencana Alam', 'Lainnya'];

export default function PanicPage() {
  const { user } = useAuthStore();
  const scope = useRegionScope();
  const isResponder = user ? canPerformAction(user.role, 'panic', 'respond') : false;
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPanicForm, setShowPanicForm] = useState(false);
  const [form, setForm] = useState({ tipeEmergency: 'Kebakaran', deskripsi: '', lokasi: { alamat: '' } });
  const [respondForm, setRespondForm] = useState<{ id: string; tindakan: string } | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const promises: Promise<any>[] = [panicService.getAll({ limit: 50, ...scope }).catch(() => ({ data: [] }))];
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

  const handlePanic = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await panicService.create(form);
      setShowPanicForm(false);
      setForm({ tipeEmergency: 'Kebakaran', deskripsi: '', lokasi: { alamat: '' } });
      loadData();
      await Swal.fire({ icon: 'warning', title: 'PANIC ALERT TERKIRIM!', text: 'Bantuan sedang dalam perjalanan.', confirmButtonColor: '#dc2626' });
    } catch (error) {
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
    } catch (error) {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panic Button</h1>
          <p className="text-gray-600 mt-1">Sistem darurat dan emergency alert</p>
        </div>
      </div>

      {/* Big Panic Button */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6 text-center">
        {!showPanicForm ? (
          <div>
            <button
              onClick={() => setShowPanicForm(true)}
              className="w-40 h-40 rounded-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 mx-auto flex flex-col items-center justify-center"
            >
              <AlertCircle className="w-16 h-16 mb-2" />
              <span className="text-lg font-bold">DARURAT</span>
            </button>
            <p className="text-gray-500 mt-4 text-sm">Tekan tombol di atas untuk mengirim alert darurat</p>
          </div>
        ) : (
          <form onSubmit={handlePanic} className="max-w-md mx-auto text-left space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-red-800">Kirim Alert Darurat</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Darurat</label>
              <select value={form.tipeEmergency} onChange={(e) => setForm({ ...form, tipeEmergency: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                {emergencyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi/Alamat</label>
              <input type="text" value={form.lokasi.alamat} onChange={(e) => setForm({ ...form, lokasi: { ...form.lokasi, alamat: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Alamat atau lokasi kejadian" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan (opsional)</label>
              <textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="flex space-x-3">
              <button type="button" onClick={() => setShowPanicForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
              <button type="submit" disabled={sending} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold disabled:opacity-50">
                {sending ? 'Mengirim...' : 'KIRIM ALERT!'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Stats for responders */}
      {isResponder && stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
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
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg font-bold text-red-800">{a.tipeEmergency}</span>
                      {getStatusBadge(a.status)}
                    </div>
                    <p className="text-sm text-red-700">Pelapor: {a.pelaporName} &middot; {a.createdAt ? format(new Date(a.createdAt), 'dd MMM yyyy HH:mm') : ''}</p>
                    {a.lokasi?.alamat && <p className="text-sm text-red-600 flex items-center mt-1"><MapPin className="w-4 h-4 mr-1" />{a.lokasi.alamat}</p>}
                    {a.deskripsi && <p className="text-sm text-red-700 mt-1">{a.deskripsi}</p>}
                  </div>
                  <div className="flex space-x-2">
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

      {/* History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Riwayat Alert</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Waktu</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tipe</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Pelapor</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Lokasi</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Responder</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : alerts.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Belum ada riwayat alert</td></tr>
            ) : alerts.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{a.createdAt ? format(new Date(a.createdAt), 'dd MMM yyyy HH:mm') : '-'}</td>
                <td className="px-6 py-4 text-sm font-medium">{a.tipeEmergency}</td>
                <td className="px-6 py-4 text-sm">{a.pelaporName}</td>
                <td className="px-6 py-4 text-sm">{a.lokasi?.alamat || '-'}</td>
                <td className="px-6 py-4">{getStatusBadge(a.status)}</td>
                <td className="px-6 py-4 text-sm">{a.respondedByName || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Respond Modal */}
      {respondForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Respons Alert</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tindakan</label>
                <textarea value={respondForm.tindakan} onChange={(e) => setRespondForm({ ...respondForm, tindakan: e.target.value })} rows={3} required className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Jelaskan tindakan yang dilakukan..." />
              </div>
              <div className="flex justify-end space-x-3">
                <button onClick={() => setRespondForm(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
                <button onClick={handleRespond} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">Kirim Respons</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
