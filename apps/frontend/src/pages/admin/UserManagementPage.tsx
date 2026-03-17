import { useState, useEffect } from 'react';
import { usersService, UserStatistics } from '../../services/settings.service';
import { publicRegionsService } from '../../services/regions.service';
import { Role, RoleLabels } from '@shared/role.enum';
import { useAuthStore } from '../../stores/auth.store';
import {
  Users, UserPlus, Search, Edit, Trash2, ToggleLeft, ToggleRight,
  X, ChevronLeft, ChevronRight, Shield, UserCheck, UserX, AlertCircle,
} from 'lucide-react';
import { cn } from '../../utils/cn';

// Roles that AdminDesa can manage
const ADMIN_DESA_ROLES: Role[] = [
  Role.KEPALA_DESA, Role.SEKRETARIS_DESA,
  Role.KAUR_KEUANGAN, Role.KAUR_UMUM,
  Role.KASI_PEMERINTAHAN, Role.KASI_KESEJAHTERAAN, Role.KASI_PELAYANAN,
  Role.KETUA_RW, Role.ADMIN_RW,
  Role.KETUA_RT, Role.ADMIN_RT,
  Role.PETUGAS_RONDA, Role.WARGA,
];

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  desa?: string;
  rw?: string;
  rt?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface DesaOption {
  id: string;
  name: string;
}

interface RegionChild {
  id: string;
  name: string;
  type: string;
}

export default function UserManagementPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isAdminDesa = currentUser?.role === Role.ADMIN_DESA;
  const availableRoles = isAdminDesa ? ADMIN_DESA_ROLES : Object.values(Role) as Role[];

  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<any>({});

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [desaFilter, setDesaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Create form
  const [createForm, setCreateForm] = useState({
    email: '', password: '', name: '', role: Role.WARGA as string,
    phone: '', desa: '', rw: '', rt: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit form
  const [editForm, setEditForm] = useState({
    name: '', phone: '', role: '' as string, desa: '', rw: '', rt: '', isActive: true,
  });
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  // Cascading dropdown data
  const [desaList, setDesaList] = useState<DesaOption[]>([]);
  const [rwList, setRwList] = useState<RegionChild[]>([]);
  const [rtList, setRtList] = useState<RegionChild[]>([]);
  const [editRwList, setEditRwList] = useState<RegionChild[]>([]);
  const [editRtList, setEditRtList] = useState<RegionChild[]>([]);

  useEffect(() => {
    loadDesaList();
    loadStatistics();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [page, search, roleFilter, desaFilter, statusFilter]);

  const loadDesaList = async () => {
    try {
      const data = await publicRegionsService.getDesa();
      setDesaList(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error loading desa:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await usersService.getStatistics();
      setStats(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit, search };
      if (roleFilter) params.role = roleFilter;
      if (desaFilter) params.desa = desaFilter;
      if (statusFilter) params.isActive = statusFilter;
      const response = await usersService.getAll(params);
      setUsers(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cascading: load RW when desa selected (create)
  const handleCreateDesaChange = async (desaId: string) => {
    const desa = desaList.find((d) => d.id === desaId);
    setCreateForm((prev) => ({ ...prev, desa: desa?.name || desaId, rw: '', rt: '' }));
    setRwList([]);
    setRtList([]);
    if (desaId) {
      try {
        const children = await publicRegionsService.getChildren(desaId);
        setRwList(Array.isArray(children) ? children : children.data || []);
      } catch (error) {
        console.error('Error loading RW:', error);
      }
    }
  };

  const handleCreateRwChange = async (rwId: string) => {
    const rw = rwList.find((r) => r.id === rwId);
    setCreateForm((prev) => ({ ...prev, rw: rw?.name || rwId, rt: '' }));
    setRtList([]);
    if (rwId) {
      try {
        const children = await publicRegionsService.getChildren(rwId);
        setRtList(Array.isArray(children) ? children : children.data || []);
      } catch (error) {
        console.error('Error loading RT:', error);
      }
    }
  };

  // Cascading for edit
  const handleEditDesaChange = async (desaId: string) => {
    const desa = desaList.find((d) => d.id === desaId);
    setEditForm((prev) => ({ ...prev, desa: desa?.name || desaId, rw: '', rt: '' }));
    setEditRwList([]);
    setEditRtList([]);
    if (desaId) {
      try {
        const children = await publicRegionsService.getChildren(desaId);
        setEditRwList(Array.isArray(children) ? children : children.data || []);
      } catch (error) {
        console.error('Error loading RW:', error);
      }
    }
  };

  const handleEditRwChange = async (rwId: string) => {
    const rw = editRwList.find((r) => r.id === rwId);
    setEditForm((prev) => ({ ...prev, rw: rw?.name || rwId, rt: '' }));
    setEditRtList([]);
    if (rwId) {
      try {
        const children = await publicRegionsService.getChildren(rwId);
        setEditRtList(Array.isArray(children) ? children : children.data || []);
      } catch (error) {
        console.error('Error loading RT:', error);
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const payload: any = {
        email: createForm.email,
        password: createForm.password,
        name: createForm.name,
        role: createForm.role,
        desa: createForm.desa,
      };
      if (createForm.phone) payload.phone = createForm.phone;
      if (createForm.rw) payload.rw = createForm.rw;
      if (createForm.rt) payload.rt = createForm.rt;

      await usersService.create(payload);
      setShowCreateModal(false);
      setCreateForm({ email: '', password: '', name: '', role: Role.WARGA, phone: '', desa: '', rw: '', rt: '' });
      loadUsers();
      loadStatistics();
    } catch (error: any) {
      setCreateError(error.response?.data?.message || 'Gagal membuat user');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (user: UserItem) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      phone: user.phone || '',
      role: user.role,
      desa: user.desa || '',
      rw: user.rw || '',
      rt: user.rt || '',
      isActive: user.isActive,
    });
    setEditRwList([]);
    setEditRtList([]);
    setEditError('');
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError('');
    setUpdating(true);
    try {
      await usersService.update(editingUser.id, editForm);
      setShowEditModal(false);
      setEditingUser(null);
      loadUsers();
      loadStatistics();
    } catch (error: any) {
      setEditError(error.response?.data?.message || 'Gagal memperbarui user');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await usersService.toggleActive(id);
      loadUsers();
      loadStatistics();
    } catch (error) {
      console.error('Error toggling active:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      await usersService.delete(id);
      setDeleteId(null);
      loadUsers();
      loadStatistics();
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setDeleting(false);
    }
  };

  // Unique desa from stats for filter dropdown
  const desaOptions = stats?.byDesa?.map((d) => d.desa) || [];

  // Pagination
  const totalPages = meta.totalPages || 1;
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen User</h1>
          <p className="text-gray-600 mt-1">Kelola seluruh akun pengguna platform</p>
        </div>
        <button
          onClick={() => { setShowCreateModal(true); setCreateError(''); }}
          className="inline-flex items-center px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Tambah User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Users</p>
              <p className="text-3xl font-bold mt-1">{stats?.totalUsers ?? '-'}</p>
            </div>
            <Users className="w-12 h-12 text-blue-200 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Aktif</p>
              <p className="text-3xl font-bold mt-1">{stats?.activeUsers ?? '-'}</p>
            </div>
            <UserCheck className="w-12 h-12 text-green-200 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Nonaktif</p>
              <p className="text-3xl font-bold mt-1">{stats?.inactiveUsers ?? '-'}</p>
            </div>
            <UserX className="w-12 h-12 text-red-200 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Role Terdaftar</p>
              <p className="text-3xl font-bold mt-1">{stats?.byRole?.length ?? '-'}</p>
            </div>
            <Shield className="w-12 h-12 text-purple-200 opacity-50" />
          </div>
        </div>
      </div>

      {/* Role breakdown */}
      {stats?.byRole && stats.byRole.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Distribusi Role</p>
          <div className="flex flex-wrap gap-2">
            {stats.byRole.map((r) => (
              <span
                key={r.role}
                className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-xs font-medium"
              >
                {RoleLabels[r.role as Role] || r.role}
                <span className="ml-1.5 bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded-full text-xs">{r.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Semua Role</option>
          {availableRoles.map((r) => (
            <option key={r} value={r}>{RoleLabels[r]}</option>
          ))}
        </select>
        <select
          value={desaFilter}
          onChange={(e) => { setDesaFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Semua Desa</option>
          {desaOptions.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Semua Status</option>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Memuat data...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada user ditemukan</h3>
          <p className="text-gray-500">Coba ubah filter pencarian atau tambah user baru</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Desa / RW / RT</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user, idx) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{(page - 1) * limit + idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          {user.phone && <p className="text-xs text-gray-500">{user.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {RoleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {user.desa || '-'}
                      {user.rw && ` / RW ${user.rw}`}
                      {user.rt && ` / RT ${user.rt}`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium',
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
                      )}>
                        {user.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user.id)}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            user.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50',
                          )}
                          title={user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {user.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setDeleteId(user.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && users.length > 0 && (
        <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
          <p className="text-sm text-gray-600">
            Menampilkan {(page - 1) * limit + 1}-{Math.min(page * limit, meta.total || 0)} dari {meta.total || 0} user
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {getPageNumbers().map((p, i) =>
              p === '...' ? (
                <span key={`dots-${i}`} className="px-2 py-1 text-sm text-gray-500">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={cn(
                    'px-3 py-1 text-sm rounded',
                    page === p
                      ? 'bg-primary-600 text-white border border-primary-600'
                      : 'border border-gray-300 hover:bg-gray-50',
                  )}
                >
                  {p}
                </button>
              ),
            )}
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg mx-4 w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Tambah User Baru</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={createForm.password}
                  onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  required
                  value={createForm.role}
                  onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>{RoleLabels[r]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                <input
                  type="text"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="081234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desa *</label>
                <select
                  required
                  value={desaList.find((d) => d.name === createForm.desa)?.id || ''}
                  onChange={(e) => handleCreateDesaChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Pilih Desa</option>
                  {desaList.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              {rwList.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RW</label>
                  <select
                    value={rwList.find((r) => r.name === createForm.rw)?.id || ''}
                    onChange={(e) => handleCreateRwChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Pilih RW (opsional)</option>
                    {rwList.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {rtList.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RT</label>
                  <select
                    value={rtList.find((r) => r.name === createForm.rt)?.id || ''}
                    onChange={(e) => {
                      const rt = rtList.find((r) => r.id === e.target.value);
                      setCreateForm((p) => ({ ...p, rt: rt?.name || e.target.value }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Pilih RT (opsional)</option>
                    {rtList.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{createError}</div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {creating ? 'Menyimpan...' : 'Simpan User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg mx-4 w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit User: {editingUser.name}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>{RoleLabels[r]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desa</label>
                <select
                  value={desaList.find((d) => d.name === editForm.desa)?.id || ''}
                  onChange={(e) => handleEditDesaChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Pilih Desa</option>
                  {desaList.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {editForm.desa && !desaList.find((d) => d.name === editForm.desa) && (
                  <p className="text-xs text-gray-500 mt-1">Desa saat ini: {editForm.desa}</p>
                )}
              </div>
              {editRwList.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RW</label>
                  <select
                    value={editRwList.find((r) => r.name === editForm.rw)?.id || ''}
                    onChange={(e) => handleEditRwChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Pilih RW</option>
                    {editRwList.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {editRtList.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RT</label>
                  <select
                    value={editRtList.find((r) => r.name === editForm.rt)?.id || ''}
                    onChange={(e) => {
                      const rt = editRtList.find((r) => r.id === e.target.value);
                      setEditForm((p) => ({ ...p, rt: rt?.name || e.target.value }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Pilih RT</option>
                    {editRtList.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Status Aktif</label>
                <button
                  type="button"
                  onClick={() => setEditForm((p) => ({ ...p, isActive: !p.isActive }))}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    editForm.isActive ? 'bg-green-500' : 'bg-gray-300',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      editForm.isActive ? 'translate-x-6' : 'translate-x-1',
                    )}
                  />
                </button>
                <span className="text-sm text-gray-600">{editForm.isActive ? 'Aktif' : 'Nonaktif'}</span>
              </div>

              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{editError}</div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Hapus User</h3>
                <p className="text-sm text-gray-600">User yang dihapus tidak dapat dikembalikan</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
