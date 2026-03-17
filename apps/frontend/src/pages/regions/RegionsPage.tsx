import { useState, useEffect, useMemo } from 'react';
import { regionsService, Region, RegionType, CreateRegionDto } from '../../services/regions.service';
import { useAuthStore } from '../../stores/auth.store';
import { Role } from '@shared/role.enum';
import { canPerformAction } from '../../config/permissions';
import { MapPin, ChevronRight, Users, Home, Plus, Edit, Trash2, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import Swal from 'sweetalert2';

const REGION_TYPE_ORDER: RegionType[] = [
  RegionType.PROVINSI, RegionType.KABUPATEN, RegionType.KECAMATAN,
  RegionType.DESA, RegionType.RW, RegionType.RT,
];

const PLATFORM_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN_PLATFORM];
const DESA_ROLES: Role[] = [Role.KEPALA_DESA, Role.SEKRETARIS_DESA];
const RW_ROLES: Role[] = [Role.KETUA_RW, Role.ADMIN_RW];
const RT_ROLES: Role[] = [Role.KETUA_RT, Role.ADMIN_RT];

const getChildType = (parentType: RegionType): RegionType | null => {
  const idx = REGION_TYPE_ORDER.indexOf(parentType);
  return idx >= 0 && idx < REGION_TYPE_ORDER.length - 1 ? REGION_TYPE_ORDER[idx + 1] : null;
};

export default function RegionsPage() {
  const [tree, setTree] = useState<any[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('tree');

  const { user } = useAuthStore();
  const role = user?.role as Role;

  const isPlatform = PLATFORM_ROLES.includes(role);
  const isDesa = DESA_ROLES.includes(role);
  const isRW = RW_ROLES.includes(role);
  const isRT = RT_ROLES.includes(role);

  const canManage = isPlatform || isDesa || isRW || isRT;
  const canCreate = canPerformAction(role, 'regions', 'create');
  const canEdit = canPerformAction(role, 'regions', 'edit');
  const canDelete = canPerformAction(role, 'regions', 'delete');

  // Which types this user can create
  const allowedCreateTypes = useMemo((): RegionType[] => {
    if (isPlatform) return [...REGION_TYPE_ORDER];
    if (isDesa) return [RegionType.RW, RegionType.RT];
    if (isRW) return [RegionType.RT];
    return [];
  }, [isPlatform, isDesa, isRW]);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateRegionDto>({
    name: '', type: RegionType.DESA, parentId: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [parentRegions, setParentRegions] = useState<Region[]>([]);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [editForm, setEditForm] = useState<Partial<CreateRegionDto>>({});
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    loadData();
  }, [viewMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (viewMode === 'tree') {
        const treeData = await regionsService.getMyTree();
        setTree(Array.isArray(treeData) ? treeData : [treeData]);
      } else {
        const response = await regionsService.getAll({ limit: 100 });
        setRegions(response.data);
      }
    } catch (error) {
      console.error('Error loading regions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRegionTypeColor = (type: RegionType) => {
    switch (type) {
      case RegionType.PROVINSI: return 'bg-purple-100 text-purple-800 border-purple-200';
      case RegionType.KABUPATEN: return 'bg-blue-100 text-blue-800 border-blue-200';
      case RegionType.KECAMATAN: return 'bg-green-100 text-green-800 border-green-200';
      case RegionType.DESA: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case RegionType.RW: return 'bg-orange-100 text-orange-800 border-orange-200';
      case RegionType.RT: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Can this user add a child to this node?
  const canAddChild = (nodeType: RegionType): boolean => {
    if (!canCreate) return false;
    const childType = getChildType(nodeType);
    if (!childType) return false;
    return allowedCreateTypes.includes(childType);
  };

  // Create handlers
  const openCreateModal = (parentId?: string, parentType?: RegionType) => {
    const childType = parentType ? getChildType(parentType) : allowedCreateTypes[0];
    setCreateForm({ name: '', type: childType || allowedCreateTypes[0] || RegionType.DESA, parentId: parentId || '' });
    setCreateError('');
    setShowCreateModal(true);

    // If opening from tree node, parent is already set, load parent regions for the type
    if (!parentId && childType) {
      handleTypeChange(childType);
    }
  };

  const handleTypeChange = async (type: RegionType) => {
    setCreateForm((p) => ({ ...p, type, parentId: '' }));
    const idx = REGION_TYPE_ORDER.indexOf(type);
    if (idx > 0) {
      try {
        const parentType = REGION_TYPE_ORDER[idx - 1];
        const res = await regionsService.getAll({ type: parentType, limit: 200 });
        setParentRegions(res.data || []);
      } catch {
        setParentRegions([]);
      }
    } else {
      setParentRegions([]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const payload: any = { name: createForm.name, type: createForm.type };
      if (createForm.parentId) payload.parentId = createForm.parentId;
      if (createForm.leaderName) payload.leaderName = createForm.leaderName;
      if (createForm.leaderPhone) payload.leaderPhone = createForm.leaderPhone;
      if (createForm.description) payload.description = createForm.description;
      await regionsService.create(payload);
      setShowCreateModal(false);
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Wilayah berhasil ditambahkan',
        timer: 2000,
        showConfirmButton: false,
      });
      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Gagal membuat wilayah';
      setCreateError(msg);
      Swal.fire({ icon: 'error', title: 'Gagal', text: msg });
    } finally {
      setCreating(false);
    }
  };

  // Edit handlers
  const openEditModal = (region: Region) => {
    setEditingRegion(region);
    setEditForm({
      name: region.name,
      leaderName: region.leaderName || '',
      leaderPhone: region.leaderPhone || '',
      description: region.description || '',
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRegion) return;
    setEditError('');
    setUpdating(true);
    try {
      await regionsService.update(editingRegion.id, editForm);
      setShowEditModal(false);
      setEditingRegion(null);
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Wilayah berhasil diperbarui',
        timer: 2000,
        showConfirmButton: false,
      });
      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Gagal memperbarui wilayah';
      setEditError(msg);
      Swal.fire({ icon: 'error', title: 'Gagal', text: msg });
    } finally {
      setUpdating(false);
    }
  };

  // Delete handler with SweetAlert2 confirmation
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Hapus Wilayah?',
      text: 'Wilayah dengan sub-wilayah tidak dapat dihapus. Apakah Anda yakin?',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    try {
      await regionsService.delete(id);
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Wilayah berhasil dihapus',
        timer: 2000,
        showConfirmButton: false,
      });
      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Gagal menghapus wilayah. Pastikan tidak memiliki sub-wilayah.';
      Swal.fire({ icon: 'error', title: 'Gagal Menghapus', text: msg });
    }
  };

  const renderTreeNode = (node: any, level = 0) => {
    const showAddChild = canAddChild(node.type);
    const showEdit = canEdit;
    const showDelete = canDelete && node.type !== RegionType.PROVINSI && node.type !== RegionType.KABUPATEN && node.type !== RegionType.KECAMATAN && node.type !== RegionType.DESA;

    return (
      <div key={node.id} className="mb-2">
        <div
          className={cn(
            'flex items-center justify-between p-4 bg-white border-l-4 rounded-lg shadow-sm hover:shadow-md transition-shadow',
            level === 0 ? 'border-l-purple-500' : level === 1 ? 'border-l-blue-500' : level === 2 ? 'border-l-green-500' : level === 3 ? 'border-l-yellow-500' : level === 4 ? 'border-l-orange-500' : 'border-l-red-500',
          )}
          style={{ marginLeft: `${level * 30}px` }}
        >
          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-gray-500" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">{node.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRegionTypeColor(node.type)}`}
                >
                  {node.type}
                </span>
              </div>
              {node.leaderName && (
                <p className="text-xs text-gray-500 mt-1">
                  Kepala: {node.leaderName}
                  {node.leaderPhone && ` | ${node.leaderPhone}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(node.totalCitizens || node.totalFamilies) && (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{node.totalCitizens || 0} warga</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Home className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{node.totalFamilies || 0} KK</span>
                </div>
              </div>
            )}
            {canManage && (
              <div className="flex items-center gap-1">
                {showAddChild && (
                  <button
                    onClick={() => openCreateModal(node.id, node.type)}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title={`Tambah ${getChildType(node.type) || 'sub-wilayah'}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
                {showEdit && (
                  <button
                    onClick={() => openEditModal(node)}
                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                {showDelete && (
                  <button
                    onClick={() => handleDelete(node.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="mt-2">{node.children.map((child: any) => renderTreeNode(child, level + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wilayah</h1>
          <p className="text-gray-600 mt-1">Struktur hierarki wilayah multi-tenant</p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && allowedCreateTypes.length > 0 && (
            <button
              onClick={() => openCreateModal()}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Tambah Wilayah
            </button>
          )}
          <button
            onClick={() => setViewMode('tree')}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              viewMode === 'tree'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
            )}
          >
            Tree View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              viewMode === 'list'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
            )}
          >
            List View
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center text-sm text-gray-600">
          <span className="font-medium text-gray-900">Hierarki:</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span>Provinsi</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span>Kabupaten</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span>Kecamatan</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span>Desa</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span>RW</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="font-semibold text-primary-600">RT</span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          Loading...
        </div>
      ) : viewMode === 'tree' ? (
        <div className="space-y-2">{tree.map((node) => renderTreeNode(node))}</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Wilayah</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kepala Wilayah</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Warga</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Keluarga</th>
                {canManage && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {regions.map((region) => (
                <tr key={region.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{region.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRegionTypeColor(region.type)}`}>
                      {region.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {region.leaderName || '-'}
                    {region.leaderPhone && (
                      <span className="block text-xs text-gray-500">{region.leaderPhone}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-700">{region.totalCitizens || 0}</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-700">{region.totalFamilies || 0}</td>
                  {canManage && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <button
                            onClick={() => openEditModal(region)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(region.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Region Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg mx-4 w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Tambah Wilayah</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Wilayah *</label>
                <select
                  required
                  value={createForm.type}
                  onChange={(e) => handleTypeChange(e.target.value as RegionType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {allowedCreateTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              {parentRegions.length > 0 && !createForm.parentId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Wilayah *</label>
                  <select
                    required
                    value={createForm.parentId}
                    onChange={(e) => setCreateForm((p) => ({ ...p, parentId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Pilih parent wilayah</option>
                    {parentRegions.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Wilayah *</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Contoh: Desa Sukamaju"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kepala Wilayah</label>
                <input
                  type="text"
                  value={createForm.leaderName || ''}
                  onChange={(e) => setCreateForm((p) => ({ ...p, leaderName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Nama kepala wilayah"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon Kepala</label>
                <input
                  type="text"
                  value={createForm.leaderPhone || ''}
                  onChange={(e) => setCreateForm((p) => ({ ...p, leaderPhone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="081234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  value={createForm.description || ''}
                  onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={2}
                  placeholder="Deskripsi wilayah (opsional)"
                />
              </div>

              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{createError}</div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" disabled={creating} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  {creating ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Region Modal */}
      {showEditModal && editingRegion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg mx-4 w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit: {editingRegion.name}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                <input
                  type="text"
                  disabled
                  value={editingRegion.type}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Wilayah *</label>
                <input
                  type="text"
                  required
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kepala Wilayah</label>
                <input
                  type="text"
                  value={editForm.leaderName || ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, leaderName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon Kepala</label>
                <input
                  type="text"
                  value={editForm.leaderPhone || ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, leaderPhone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={2}
                />
              </div>

              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{editError}</div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" disabled={updating} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
