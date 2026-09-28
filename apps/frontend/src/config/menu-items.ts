// Canonical list of sidebar menu entries (path + label), shared by
// DashboardLayout (renders the sidebar) and RoleManagementPage (lets an
// admin pick which of these paths a custom role can see).
export interface MenuItemConfig {
  name: string;
  path: string;
}

export const MENU_ITEMS: MenuItemConfig[] = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Profil Saya', path: '/my-profile' },
  { name: 'Wilayah', path: '/regions' },
  { name: 'Data Warga', path: '/citizens' },
  { name: 'Kartu Keluarga', path: '/families' },
  { name: 'Surat Menyurat', path: '/letters' },
  { name: 'Iuran Warga', path: '/finance' },
  { name: 'Pengeluaran', path: '/expenses' },
  { name: 'Buku Tamu', path: '/guestbook' },
  { name: 'Patroli Ronda', path: '/patrol' },
  { name: 'Pengumuman', path: '/announcements' },
  { name: 'Kicau Desa', path: '/kicau' },
  { name: 'UMKM Desa', path: '/umkm' },
  { name: 'Laporan', path: '/reports' },
  { name: 'Event', path: '/events' },
  { name: 'Panic Button', path: '/panic' },
  { name: 'Profil Desa', path: '/desa/profile' },
  { name: 'Landing Page', path: '/desa/landing' },
  { name: 'Aktivasi Warga', path: '/admin/activations' },
  { name: 'Audit Log', path: '/audit-logs' },
  { name: 'Manajemen User', path: '/admin/users' },
  { name: 'Manajemen Role', path: '/admin/roles' },
  { name: 'Pengaturan', path: '/settings' },
];
