import { useState, useEffect } from 'react';
import { usersService, UserStatistics } from '../../services/settings.service';
import { publicRegionsService } from '../../services/regions.service';
import { customRolesService } from '../../services/custom-roles.service';
import { Role, RoleLabels } from '@shared/role.enum';
import { useAuthStore } from '../../stores/auth.store';
import {
  Users, UserPlus, Search, Edit, Trash2, ToggleLeft, ToggleRight,
  ChevronLeft, ChevronRight, Shield, UserCheck, UserX, AlertCircle,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Card, CardBody } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatTile } from '../../components/ui/StatTile';
import { Table, Thead, Tbody, Th, Td } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';

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

  // Custom roles (see modules/custom-roles) - only SuperAdmin/AdminPlatform
  // can assign them; AdminDesa stays restricted to ADMIN_DESA_ROLES above.
  const [customRoleOptions, setCustomRoleOptions] = useState<{ code: string; label: string }[]>([]);
  useEffect(() => {
    if (isAdminDesa) return;
    customRolesService
      .getAll()
      .then((roles: any[]) => setCustomRoleOptions(roles.filter((r) => r.isActive).map((r) => ({ code: r.code, label: r.label }))))
      .catch(() => setCustomRoleOptions([]));
  }, [isAdminDesa]);

  const roleOptions = [
    ...availableRoles.map((r) => ({ value: r as string, label: RoleLabels[r] })),
    ...customRoleOptions.map((c) => ({ value: c.code, label: c.label })),
  ];
  const roleLabelMap = new Map(roleOptions.map((o) => [o.value, o.label]));
  const labelForRole = (role: string) => roleLabelMap.get(role) || role;

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
      <PageHeader
        title="Manajemen User"
        subtitle="Kelola seluruh akun pengguna platform"
        actions={
          <Button onClick={() => { setShowCreateModal(true); setCreateError(''); }}>
            <UserPlus className="w-4 h-4" /> Tambah User
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatTile label="Total Users" value={stats?.totalUsers ?? '-'} icon={Users} />
        <StatTile label="Aktif" value={stats?.activeUsers ?? '-'} icon={UserCheck} tone="success" />
        <StatTile label="Nonaktif" value={stats?.inactiveUsers ?? '-'} icon={UserX} tone="danger" />
        <StatTile label="Role Terdaftar" value={stats?.byRole?.length ?? '-'} icon={Shield} tone="info" />
      </div>

      {/* Role breakdown */}
      {stats?.byRole && stats.byRole.length > 0 && (
        <Card className="mb-6">
          <CardBody>
            <p className="text-sm font-medium text-gray-700 mb-3">Distribusi Role</p>
            <div className="flex flex-wrap gap-2">
              {stats.byRole.map((r) => (
                <Badge key={r.role} tone="neutral">
                  {labelForRole(r.role)}
                  <span className="ml-1.5 bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded-full text-[10px]">{r.count}</span>
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="w-auto">
          <option value="">Semua Role</option>
          {roleOptions.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </Select>
        <Select value={desaFilter} onChange={(e) => { setDesaFilter(e.target.value); setPage(1); }} className="w-auto">
          <option value="">Semua Desa</option>
          {desaOptions.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-auto">
          <option value="">Semua Status</option>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </Select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12 text-sm text-gray-500">Memuat data...</div>
      ) : users.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="Tidak ada user ditemukan" description="Coba ubah filter pencarian atau tambah user baru" />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <Thead>
              <tr>
                <Th>#</Th>
                <Th>Nama</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Desa / RW / RT</Th>
                <Th align="center">Status</Th>
                <Th>Last Login</Th>
                <Th align="right">Aksi</Th>
              </tr>
            </Thead>
            <Tbody>
              {users.map((user, idx) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <Td className="text-gray-500">{(page - 1) * limit + idx + 1}</Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        {user.phone && <p className="text-xs text-gray-500">{user.phone}</p>}
                      </div>
                    </div>
                  </Td>
                  <Td className="text-gray-700">{user.email}</Td>
                  <Td>
                    <Badge tone="info">{labelForRole(user.role)}</Badge>
                  </Td>
                  <Td className="text-gray-700">
                    {user.desa || '-'}
                    {user.rw && ` / RW ${user.rw}`}
                    {user.rt && ` / RT ${user.rt}`}
                  </Td>
                  <Td align="center">
                    <Badge tone={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
                  </Td>
                  <Td className="text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(user.id)}
                        className={cn(
                          'p-1.5 rounded-md transition-colors',
                          user.isActive ? 'text-danger-text hover:bg-danger-bg' : 'text-success-text hover:bg-success-bg',
                        )}
                        title={user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {user.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setDeleteId(user.id)}
                        className="p-1.5 text-danger-text hover:bg-danger-bg rounded-md transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {!loading && users.length > 0 && (
        <div className="mt-4 flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3">
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
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Tambah User Baru" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
            <Input
              type="text"
              required
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Masukkan nama lengkap"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <Input
              type="email"
              required
              value={createForm.email}
              onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <Input
              type="password"
              required
              minLength={6}
              value={createForm.password}
              onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Minimal 6 karakter"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <Select
              required
              value={createForm.role}
              onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))}
            >
              {roleOptions.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
            <Input
              type="text"
              value={createForm.phone}
              onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="081234567890"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desa *</label>
            <Select
              required
              value={desaList.find((d) => d.name === createForm.desa)?.id || ''}
              onChange={(e) => handleCreateDesaChange(e.target.value)}
            >
              <option value="">Pilih Desa</option>
              {desaList.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>
          {rwList.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RW</label>
              <Select
                value={rwList.find((r) => r.name === createForm.rw)?.id || ''}
                onChange={(e) => handleCreateRwChange(e.target.value)}
              >
                <option value="">Pilih RW (opsional)</option>
                {rwList.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>
            </div>
          )}
          {rtList.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RT</label>
              <Select
                value={rtList.find((r) => r.name === createForm.rt)?.id || ''}
                onChange={(e) => {
                  const rt = rtList.find((r) => r.id === e.target.value);
                  setCreateForm((p) => ({ ...p, rt: rt?.name || e.target.value }));
                }}
              >
                <option value="">Pilih RT (opsional)</option>
                {rtList.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>
            </div>
          )}

          {createError && (
            <div className="p-3 bg-danger-bg border border-danger-border rounded-md text-sm text-danger-text">{createError}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Menyimpan...' : 'Simpan User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        open={showEditModal && !!editingUser}
        onClose={() => setShowEditModal(false)}
        title={`Edit User: ${editingUser?.name ?? ''}`}
        size="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <Input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
            <Input
              type="text"
              value={editForm.phone}
              onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <Select
              value={editForm.role}
              onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
            >
              {roleOptions.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desa</label>
            <Select
              value={desaList.find((d) => d.name === editForm.desa)?.id || ''}
              onChange={(e) => handleEditDesaChange(e.target.value)}
            >
              <option value="">Pilih Desa</option>
              {desaList.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
            {editForm.desa && !desaList.find((d) => d.name === editForm.desa) && (
              <p className="text-xs text-gray-500 mt-1">Desa saat ini: {editForm.desa}</p>
            )}
          </div>
          {editRwList.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RW</label>
              <Select
                value={editRwList.find((r) => r.name === editForm.rw)?.id || ''}
                onChange={(e) => handleEditRwChange(e.target.value)}
              >
                <option value="">Pilih RW</option>
                {editRwList.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>
            </div>
          )}
          {editRtList.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RT</label>
              <Select
                value={editRtList.find((r) => r.name === editForm.rt)?.id || ''}
                onChange={(e) => {
                  const rt = editRtList.find((r) => r.id === e.target.value);
                  setEditForm((p) => ({ ...p, rt: rt?.name || e.target.value }));
                }}
              >
                <option value="">Pilih RT</option>
                {editRtList.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>
            </div>
          )}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Status Aktif</label>
            <button
              type="button"
              onClick={() => setEditForm((p) => ({ ...p, isActive: !p.isActive }))}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                editForm.isActive ? 'bg-primary-600' : 'bg-gray-300',
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
            <div className="p-3 bg-danger-bg border border-danger-border rounded-md text-sm text-danger-text">{editError}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={updating}>
              {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-danger-bg rounded-full flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-danger-text" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Hapus User</h3>
            <p className="text-sm text-gray-600">User yang dihapus tidak dapat dikembalikan</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Batal
          </Button>
          <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)} disabled={deleting}>
            {deleting ? 'Menghapus...' : 'Ya, Hapus'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
