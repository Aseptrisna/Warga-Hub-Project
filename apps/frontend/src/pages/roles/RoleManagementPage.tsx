import { useState, useEffect } from 'react';
import { Role, RoleLabels } from '@shared/role.enum';
import { Plus, Trash2, Pencil, ShieldCheck, Info } from 'lucide-react';
import Swal from 'sweetalert2';
import { customRolesService } from '../../services/custom-roles.service';
import { MENU_ITEMS } from '../../config/menu-items';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Table, Thead, Tbody, Th, Td } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';

interface CustomRole {
  id: string;
  code: string;
  label: string;
  description?: string;
  baseRoles: Role[];
  menuPaths: string[];
  isActive: boolean;
  usersCount: number;
}

const emptyForm = {
  code: '',
  label: '',
  description: '',
  baseRoles: [] as Role[],
  menuPaths: [] as string[],
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState<{ show: boolean; editing: CustomRole | null }>({ show: false, editing: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await customRolesService.getAll();
      setRoles(res || []);
    } catch (error) {
      console.error('Error loading custom roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm(emptyForm);
    setModal({ show: true, editing: null });
  };

  const openEdit = (role: CustomRole) => {
    setForm({
      code: role.code,
      label: role.label,
      description: role.description || '',
      baseRoles: role.baseRoles,
      menuPaths: role.menuPaths,
    });
    setModal({ show: true, editing: role });
  };

  const closeModal = () => setModal({ show: false, editing: null });

  const toggleBaseRole = (role: Role) => {
    setForm((f) => ({
      ...f,
      baseRoles: f.baseRoles.includes(role) ? f.baseRoles.filter((r) => r !== role) : [...f.baseRoles, role],
    }));
  };

  const toggleMenuPath = (path: string) => {
    setForm((f) => ({
      ...f,
      menuPaths: f.menuPaths.includes(path) ? f.menuPaths.filter((p) => p !== path) : [...f.menuPaths, path],
    }));
  };

  const handleSave = async () => {
    if (!form.label.trim()) {
      Swal.fire({ icon: 'warning', title: 'Nama role wajib diisi' });
      return;
    }
    if (form.baseRoles.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Pilih minimal 1 role dasar', text: 'Role dasar menentukan izin akses API yang diwariskan role ini.' });
      return;
    }

    try {
      setSaving(true);
      if (modal.editing) {
        await customRolesService.update(modal.editing.code, {
          label: form.label,
          description: form.description,
          baseRoles: form.baseRoles,
          menuPaths: form.menuPaths,
        });
      } else {
        await customRolesService.create({
          code: form.code || slugify(form.label),
          label: form.label,
          description: form.description,
          baseRoles: form.baseRoles,
          menuPaths: form.menuPaths,
        });
      }
      closeModal();
      loadData();
      Swal.fire({ icon: 'success', title: 'Role berhasil disimpan', timer: 2000, showConfirmButton: false });
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan role', text: error?.response?.data?.message || 'Terjadi kesalahan' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: CustomRole) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: `Hapus role "${role.label}"?`,
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      confirmButtonColor: '#b91c1c',
    });
    if (!confirm.isConfirmed) return;

    try {
      await customRolesService.delete(role.code);
      loadData();
      Swal.fire({ icon: 'success', title: 'Role dihapus', timer: 2000, showConfirmButton: false });
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal menghapus role', text: error?.response?.data?.message || 'Terjadi kesalahan' });
    }
  };

  const handleToggleActive = async (role: CustomRole) => {
    try {
      await customRolesService.update(role.code, { isActive: !role.isActive });
      loadData();
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal mengubah status', text: error?.response?.data?.message || 'Terjadi kesalahan' });
    }
  };

  return (
    <div>
      <PageHeader
        title="Manajemen Role"
        subtitle="Buat role custom dan atur menu yang boleh diakses"
        actions={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" /> Tambah Role
          </Button>
        }
      />

      <div className="mb-6 bg-info-bg border border-info-border rounded-md p-4 flex gap-3">
        <Info className="w-4 h-4 text-info-text flex-shrink-0 mt-0.5" />
        <div className="text-sm text-info-text">
          <p className="font-medium">Cara kerja role custom</p>
          <p className="mt-1">
            Role custom <strong>mewarisi izin akses API</strong> dari satu atau lebih role bawaan yang dipilih sebagai "role dasar".
            <strong> Menu sidebar</strong> yang tampil untuk role ini diatur terpisah dan bisa lebih terbatas dari role dasarnya (tidak bisa lebih luas).
          </p>
        </div>
      </div>

      {/* Custom roles table */}
      <Card className="overflow-hidden mb-6">
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary-600" /> Role Custom
          </h2>
        </CardHeader>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Memuat...</div>
        ) : roles.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="Belum ada role custom" description='Klik "Tambah Role" untuk membuat.' />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Role</Th>
                <Th>Role Dasar</Th>
                <Th>Menu</Th>
                <Th align="center">User</Th>
                <Th align="center">Status</Th>
                <Th align="center">Aksi</Th>
              </tr>
            </Thead>
            <Tbody>
              {roles.map((role) => (
                <tr key={role.code}>
                  <Td>
                    <p className="font-medium text-gray-900">{role.label}</p>
                    <p className="text-xs text-gray-400">{role.code}</p>
                    {role.description && <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>}
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {role.baseRoles.map((r) => (
                        <Badge key={r} tone="neutral">{RoleLabels[r] || r}</Badge>
                      ))}
                    </div>
                  </Td>
                  <Td className="text-gray-600">{role.menuPaths.length} menu</Td>
                  <Td align="center" className="text-gray-600">{role.usersCount}</Td>
                  <Td align="center">
                    <button onClick={() => handleToggleActive(role)}>
                      <Badge tone={role.isActive ? 'success' : 'neutral'}>{role.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
                    </button>
                  </Td>
                  <Td align="center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(role)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 rounded"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(role)}
                        disabled={role.usersCount > 0}
                        className="p-1.5 text-gray-400 hover:text-danger-text rounded disabled:opacity-30 disabled:hover:text-gray-400"
                        title={role.usersCount > 0 ? 'Tidak bisa dihapus, masih dipakai user' : 'Hapus'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {/* Built-in roles (read-only reference) */}
      <Card className="overflow-hidden">
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">Role Bawaan Sistem</h2>
          <p className="text-xs text-gray-500 mt-0.5">Daftar tetap, tidak bisa diubah/dihapus dari sini</p>
        </CardHeader>
        <CardBody className="flex flex-wrap gap-2">
          {Object.values(Role).map((r) => (
            <Badge key={r} tone="neutral">{RoleLabels[r]}</Badge>
          ))}
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={modal.show}
        onClose={closeModal}
        title={modal.editing ? 'Edit Role' : 'Tambah Role Baru'}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Role *</label>
            <Input
              type="text"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Bendahara Tambahan"
            />
          </div>

          {!modal.editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kode Role</label>
              <Input
                type="text"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: slugify(e.target.value) }))}
                placeholder={form.label ? slugify(form.label) : 'auto dari nama role'}
                className="font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">Kosongkan untuk dibuat otomatis dari nama role</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role Dasar (izin akses API diwariskan dari sini) *
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
              {Object.values(Role).map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.baseRoles.includes(r)}
                    onChange={() => toggleBaseRole(r)}
                    className="rounded"
                  />
                  {RoleLabels[r]}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Menu yang Bisa Diakses</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
              {MENU_ITEMS.map((m) => (
                <label key={m.path} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.menuPaths.includes(m.path)}
                    onChange={() => toggleMenuPath(m.path)}
                    className="rounded"
                  />
                  {m.name}
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
