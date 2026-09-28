import { useState, useEffect, useCallback } from 'react';
import { Role } from '@shared/role.enum';
import { Plus, Store, MapPin, MessageCircle, Search, Pencil, Trash2, ImageOff } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuthStore } from '../../stores/auth.store';
import { umkmService, UMKM_KATEGORI, toWaNumber, Umkm, UmkmInput, UmkmStatus } from '../../services/umkm.service';
import { resolveFileUrl } from '../../utils/file-url';
import { cn } from '../../utils/cn';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';

const ADMIN_ROLES: string[] = [
  Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA,
  Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KETUA_RW, Role.KETUA_RT,
];

const STATUS_TONE: Record<UmkmStatus, 'success' | 'warning' | 'danger'> = {
  Disetujui: 'success',
  Menunggu: 'warning',
  Ditolak: 'danger',
};

type Tab = 'direktori' | 'saya' | 'review';

const emptyForm: UmkmInput = { nama: '', kategori: 'Kuliner', deskripsi: '', alamat: '', noWhatsapp: '' };

function errorMessage(error: any) {
  const msg = error?.response?.data?.message;
  return Array.isArray(msg) ? msg.join(', ') : msg || 'Terjadi kesalahan';
}

export default function UmkmPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = !!user && ADMIN_ROLES.includes(user.role);

  const [tab, setTab] = useState<Tab>('direktori');

  // Directory
  const [items, setItems] = useState<Umkm[]>([]);
  const [loading, setLoading] = useState(true);
  const [kategori, setKategori] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Mine / review
  const [mine, setMine] = useState<Umkm[]>([]);
  const [pending, setPending] = useState<Umkm[]>([]);

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Umkm | null>(null);
  const [form, setForm] = useState<UmkmInput>(emptyForm);
  const [foto, setFoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const loadDirectory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await umkmService.getAll({
        page,
        limit: 12,
        kategori: kategori || undefined,
        search: search || undefined,
        status: isAdmin ? 'Disetujui' : undefined,
      });
      setItems(res.data);
      setTotalPages(res.meta.totalPages || 1);
    } catch (error) {
      console.error('Error loading UMKM:', error);
    } finally {
      setLoading(false);
    }
  }, [page, kategori, search, isAdmin]);

  const loadMine = useCallback(async () => {
    try {
      const res = await umkmService.getMine();
      setMine(res.data);
    } catch (error) {
      console.error('Error loading my UMKM:', error);
    }
  }, []);

  const loadPending = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await umkmService.getAll({ status: 'Menunggu', limit: 50 });
      setPending(res.data);
    } catch (error) {
      console.error('Error loading pending UMKM:', error);
    }
  }, [isAdmin]);

  useEffect(() => {
    const t = setTimeout(loadDirectory, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadDirectory, search]);

  useEffect(() => {
    loadMine();
    loadPending();
  }, [loadMine, loadPending]);

  const refreshAll = () => {
    loadDirectory();
    loadMine();
    loadPending();
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFoto(null);
    setFormOpen(true);
  };

  const openEdit = (u: Umkm) => {
    setEditing(u);
    setForm({ nama: u.nama, kategori: u.kategori, deskripsi: u.deskripsi, alamat: u.alamat, noWhatsapp: u.noWhatsapp });
    setFoto(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      let id = editing?.id;
      let message: string;
      if (editing) {
        const res = await umkmService.update(editing.id, form);
        message = res.message;
      } else {
        const res = await umkmService.create(form);
        id = res.data.id;
        message = res.message;
      }
      if (foto && id) await umkmService.uploadFoto(id, foto);
      setFormOpen(false);
      refreshAll();
      Swal.fire({ icon: 'success', title: message, timer: 2000, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan', text: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: Umkm) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: `Hapus "${u.nama}"?`,
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
    });
    if (!confirm.isConfirmed) return;
    try {
      await umkmService.delete(u.id);
      refreshAll();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal menghapus', text: errorMessage(error) });
    }
  };

  const handleApprove = async (u: Umkm) => {
    try {
      await umkmService.review(u.id, { status: 'Disetujui' });
      refreshAll();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal menyetujui', text: errorMessage(error) });
    }
  };

  const handleReject = async (u: Umkm) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: `Tolak "${u.nama}"`,
      input: 'textarea',
      inputLabel: 'Alasan penolakan (dilihat oleh pemilik usaha)',
      inputValidator: (v) => (!v?.trim() ? 'Alasan wajib diisi' : undefined),
      showCancelButton: true,
      confirmButtonText: 'Tolak',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
    });
    if (!isConfirmed) return;
    try {
      await umkmService.review(u.id, { status: 'Ditolak', rejectionReason: reason });
      refreshAll();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal menolak', text: errorMessage(error) });
    }
  };

  const formValid =
    form.nama.trim().length >= 3 &&
    form.deskripsi.trim().length >= 10 &&
    form.alamat.trim().length >= 5 &&
    /^(\+?62|0)8[0-9]{7,12}$/.test(form.noWhatsapp.trim());

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'direktori', label: 'Direktori' },
    { key: 'saya', label: 'Usaha Saya', count: mine.length },
    ...(isAdmin ? [{ key: 'review' as Tab, label: 'Menunggu Persetujuan', count: pending.length }] : []),
  ];

  return (
    <div>
      <PageHeader
        title="UMKM Desa"
        subtitle="Direktori usaha warga, lengkap dengan kontak WhatsApp"
        actions={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" /> Daftarkan Usaha
          </Button>
        }
      />

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                tab === t.key
                  ? 'border-primary-600 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              {t.label}
              {!!t.count && <span className="ml-1.5 text-xs text-gray-400">{t.count}</span>}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'direktori' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Cari nama atau produk"
                className="pl-9"
              />
            </div>
            <Select
              value={kategori}
              onChange={(e) => { setKategori(e.target.value); setPage(1); }}
              className="sm:w-48"
            >
              <option value="">Semua kategori</option>
              {UMKM_KATEGORI.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </Select>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500 py-16 text-center">Memuat...</p>
          ) : items.length === 0 ? (
            <Card>
              <EmptyState
                icon={Store}
                title={search || kategori ? 'Tidak ada usaha yang cocok' : 'Belum ada UMKM terdaftar'}
                description={search || kategori ? 'Coba kata kunci atau kategori lain.' : 'Usaha yang sudah disetujui akan tampil di sini.'}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((u) => (
                <UmkmCard key={u.id} umkm={u} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6 text-sm text-gray-600">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Sebelumnya
              </Button>
              <span>Halaman {page} dari {totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Berikutnya
              </Button>
            </div>
          )}
        </>
      )}

      {tab === 'saya' && (
        mine.length === 0 ? (
          <Card>
            <EmptyState icon={Store} title="Anda belum mendaftarkan usaha" description="Daftarkan usaha agar warga desa bisa menemukan dan menghubungi Anda." />
          </Card>
        ) : (
          <Card>
            <ul className="divide-y divide-gray-100">
              {mine.map((u) => (
                <li key={u.id} className="flex items-start gap-4 p-4">
                  <Thumb url={u.fotoUrl} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900">{u.nama}</p>
                      <Badge tone={STATUS_TONE[u.status]}>{u.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{u.kategori} · {u.alamat}</p>
                    {u.status === 'Ditolak' && u.rejectionReason && (
                      <p className="text-sm text-danger-text mt-2">
                        Ditolak: {u.rejectionReason}. Perbarui data untuk mengajukan ulang.
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(u)} aria-label="Edit">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(u)} aria-label="Hapus">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )
      )}

      {tab === 'review' && isAdmin && (
        pending.length === 0 ? (
          <Card>
            <EmptyState icon={Store} title="Tidak ada pengajuan" description="Pengajuan usaha baru dari warga akan muncul di sini." />
          </Card>
        ) : (
          <Card>
            <ul className="divide-y divide-gray-100">
              {pending.map((u) => (
                <li key={u.id} className="flex flex-col sm:flex-row sm:items-start gap-4 p-4">
                  <Thumb url={u.fotoUrl} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{u.nama}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {u.kategori} · oleh {u.ownerName}{u.rt ? ` · RT ${u.rt}` : ''}{u.rw ? `/RW ${u.rw}` : ''}
                    </p>
                    <p className="text-sm text-gray-700 mt-2">{u.deskripsi}</p>
                    <p className="text-sm text-gray-500 mt-1">{u.alamat} · {u.noWhatsapp}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleReject(u)}>Tolak</Button>
                    <Button size="sm" onClick={() => handleApprove(u)}>Setujui</Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Usaha' : 'Daftarkan Usaha'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={!formValid || saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nama usaha">
            <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Keripik Singkong Bu Sari" />
          </Field>
          <Field label="Kategori">
            <Select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })}>
              {UMKM_KATEGORI.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </Select>
          </Field>
          <Field label="Deskripsi" hint="Produk atau jasa yang ditawarkan, minimal 10 karakter">
            <Textarea
              rows={3}
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              placeholder="Keripik singkong pedas dan original, kemasan 250 g. Bisa pesan untuk acara."
            />
          </Field>
          <Field label="Alamat">
            <Input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} placeholder="Jl. Melati No. 12, RT 03/RW 02" />
          </Field>
          <Field label="Nomor WhatsApp">
            <Input
              value={form.noWhatsapp}
              onChange={(e) => setForm({ ...form, noWhatsapp: e.target.value })}
              placeholder="081234567890"
              inputMode="tel"
            />
          </Field>
          <Field label="Foto usaha" hint={editing?.fotoUrl ? 'Kosongkan untuk tetap memakai foto sekarang' : 'Opsional. JPG, PNG, atau WebP, maks. 5 MB'}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFoto(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-gray-300 file:bg-white file:text-sm file:text-gray-700 hover:file:bg-gray-50"
            />
          </Field>
          {!isAdmin && !editing && (
            <p className="text-xs text-gray-500">Usaha akan tampil di direktori setelah disetujui pengurus RT/RW atau desa.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-400 mt-1">{hint}</span>}
    </label>
  );
}

function Thumb({ url }: { url?: string }) {
  return (
    <div className="w-16 h-16 rounded-md bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
      {url ? (
        <img src={resolveFileUrl(url)} alt="" className="w-full h-full object-cover" />
      ) : (
        <ImageOff className="w-5 h-5 text-gray-300" />
      )}
    </div>
  );
}

function UmkmCard({ umkm }: { umkm: Umkm }) {
  const waText = encodeURIComponent(`Halo, saya melihat ${umkm.nama} di WargaHub. Apakah masih tersedia?`);
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="aspect-[4/3] bg-gray-100 border-b border-gray-200 flex items-center justify-center">
        {umkm.fotoUrl ? (
          <img src={resolveFileUrl(umkm.fotoUrl)} alt={umkm.nama} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <Store className="w-8 h-8 text-gray-300" />
        )}
      </div>
      <CardBody className="flex flex-col flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-gray-900 leading-snug">{umkm.nama}</h3>
          <Badge>{umkm.kategori}</Badge>
        </div>
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{umkm.deskripsi}</p>
        <p className="text-xs text-gray-500 mt-3 flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 mt-px flex-shrink-0" />
          <span className="line-clamp-1">{umkm.alamat}</span>
        </p>
        <div className="mt-auto pt-4">
          <a
            href={`https://wa.me/${toWaNumber(umkm.noWhatsapp)}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <MessageCircle className="w-4 h-4" /> Hubungi via WhatsApp
          </a>
        </div>
      </CardBody>
    </Card>
  );
}
