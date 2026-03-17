import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { settingsService, usersService, profileService } from '../../services/settings.service';
import { Role, RoleLabels } from '@shared/role.enum';
import { Settings, User, Lock, Shield, Search, Trash2, Save, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

const adminRoles = [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.KEPALA_DESA, Role.SEKRETARIS_DESA];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const isAdmin = user && adminRoles.includes(user.role);
  const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'password', label: 'Ganti Password', icon: Lock },
    ...(isAdmin ? [{ id: 'users', label: 'Manajemen User', icon: Shield }] : []),
    ...(isSuperAdmin ? [{ id: 'system', label: 'Konfigurasi Sistem', icon: Settings }] : []),
  ];

  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-gray-600 mt-1">Kelola pengaturan profil dan sistem</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && <ProfileTab />}
      {activeTab === 'password' && <PasswordTab />}
      {activeTab === 'users' && isAdmin && <UsersTab />}
      {activeTab === 'system' && isSuperAdmin && <SystemTab />}
    </div>
  );
}

function ProfileTab() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await profileService.updateProfile(form);
      if (res.user) setUser({ ...user!, ...res.user });
      setMessage('Profil berhasil diperbarui');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
      <h3 className="text-lg font-semibold mb-4">Informasi Profil</h3>
      {message && (
        <div className={cn('p-3 rounded-lg mb-4 text-sm', message.includes('berhasil') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={user?.email || ''} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <input type="text" value={user?.role ? RoleLabels[user.role] : ''} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </div>
      </form>
    </div>
  );
}

function PasswordTab() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setMessage('Password baru tidak cocok');
      return;
    }
    if (form.newPassword.length < 6) {
      setMessage('Password minimal 6 karakter');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await profileService.changePassword(form.currentPassword, form.newPassword);
      setMessage('Password berhasil diubah');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
      <h3 className="text-lg font-semibold mb-4">Ganti Password</h3>
      {message && (
        <div className={cn('p-3 rounded-lg mb-4 text-sm', message.includes('berhasil') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password Lama</label>
          <input
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
          <input
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
            <Lock className="w-4 h-4 mr-2" />
            {loading ? 'Mengubah...' : 'Ganti Password'}
          </button>
        </div>
      </form>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await usersService.getAll(params);
      setUsers(res.data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await usersService.toggleActive(id);
      loadUsers();
    } catch (error) {
      alert('Gagal mengubah status user');
    }
  };

  const handleChangeRole = async (id: string, role: string) => {
    try {
      await usersService.changeRole(id, role);
      loadUsers();
    } catch (error) {
      alert('Gagal mengubah role');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus user ini?')) return;
    try {
      await usersService.delete(id);
      loadUsers();
    } catch (error) {
      alert('Gagal menghapus user');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Manajemen User</h3>
        <div className="flex space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Semua Role</option>
            {Object.values(Role).map((r) => (
              <option key={r} value={r}>{RoleLabels[r]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nama</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Tidak ada user</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.desa}{u.rw && ` RW${u.rw}`}{u.rt && ` RT${u.rt}`}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                <td className="px-6 py-4">
                  <select
                    value={u.role}
                    onChange={(e) => handleChangeRole(u.id, e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    {Object.values(Role).map((r) => (
                      <option key={r} value={r}>{RoleLabels[r]}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => handleToggleActive(u.id)} title={u.isActive ? 'Nonaktifkan' : 'Aktifkan'}>
                    {u.isActive ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" /> Nonaktif
                      </span>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => handleDelete(u.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SystemTab() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await settingsService.getAll();
      setSettings(res.data);
      const vals: Record<string, string> = {};
      res.data.forEach((s: any) => { vals[s.key] = s.value; });
      setEditValues(vals);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const updates = Object.entries(editValues).map(([key, value]) => ({ key, value }));
      await settingsService.bulkUpdate(updates);
      setMessage('Settings berhasil disimpan');
      loadSettings();
    } catch (error) {
      setMessage('Gagal menyimpan settings');
    } finally {
      setSaving(false);
    }
  };

  const categories = ['general', 'notification', 'security'];
  const categoryLabels: Record<string, string> = {
    general: 'Umum',
    notification: 'Notifikasi',
    security: 'Keamanan',
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Konfigurasi Sistem</h3>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Menyimpan...' : 'Simpan Semua'}
          </button>
        </div>
        {message && (
          <div className={cn('p-3 rounded-lg mb-4 text-sm', message.includes('berhasil') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
            {message}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          categories.map((cat) => {
            const catSettings = settings.filter((s: any) => s.category === cat);
            if (catSettings.length === 0) return null;
            return (
              <div key={cat} className="mb-6">
                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">{categoryLabels[cat] || cat}</h4>
                <div className="space-y-3">
                  {catSettings.map((s: any) => (
                    <div key={s.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 mr-4">
                        <div className="text-sm font-medium text-gray-900">{s.key}</div>
                        {s.description && <div className="text-xs text-gray-500">{s.description}</div>}
                      </div>
                      <div className="w-64">
                        {s.value === 'true' || s.value === 'false' ? (
                          <button
                            onClick={() => setEditValues({ ...editValues, [s.key]: editValues[s.key] === 'true' ? 'false' : 'true' })}
                            className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', editValues[s.key] === 'true' ? 'bg-primary-600' : 'bg-gray-300')}
                          >
                            <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform', editValues[s.key] === 'true' ? 'translate-x-6' : 'translate-x-1')} />
                          </button>
                        ) : (
                          <input
                            type="text"
                            value={editValues[s.key] || ''}
                            onChange={(e) => setEditValues({ ...editValues, [s.key]: e.target.value })}
                            disabled={!s.isEditable}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
