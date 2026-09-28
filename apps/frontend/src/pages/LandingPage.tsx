import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { ArrowRight, Check, Menu, X, QrCode, MapPin, FileText, Sprout } from 'lucide-react';
import {
  HeroScene,
  KerjaBaktiScene,
  RondaScene,
  UmkmScene,
  MusyawarahScene,
  VillageSilhouette,
} from '../components/landing/Illustrations';

const NAV = [
  { id: 'fitur', label: 'Fitur' },
  { id: 'peran', label: 'Untuk siapa' },
  { id: 'mulai', label: 'Cara mulai' },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ───────────────────────── Product mockups ───────────────────────── */

function WindowFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-desa-line bg-white shadow-lift">
      <div className="flex items-center gap-2 border-b border-desa-line bg-desa-sand/60 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-desa-clay-500/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-desa-gold/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-desa-green-500/40" />
        <span className="ml-2 truncate text-xs text-desa-muted">{title}</span>
      </div>
      {children}
    </div>
  );
}

const MATRIX = [
  { nama: 'Budi Santoso', status: ['L', 'L', 'L', 'B'] },
  { nama: 'Siti Aminah', status: ['L', 'L', 'L', 'L'] },
  { nama: 'Ahmad Fauzi', status: ['L', 'B', 'B', 'B'] },
  { nama: 'Dewi Lestari', status: ['L', 'L', 'Q', 'L'] },
  { nama: 'Rudi Hartono', status: ['L', 'L', 'L', 'B'] },
];

function IuranMockup() {
  const cell = (s: string) => {
    if (s === 'L') return <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">Lunas</span>;
    if (s === 'Q') return <span className="inline-block rounded-full border border-primary-200 bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700">QRIS</span>;
    return <span className="inline-block rounded-full border border-desa-line bg-white px-2 py-0.5 text-[11px] font-medium text-desa-muted">Belum</span>;
  };
  return (
    <WindowFrame title="Iuran Warga · RT 03 / RW 02 · Desa Sukamaju">
      <div className="p-4 sm:p-5">
        <div className="mb-4 grid grid-cols-3 gap-3">
          {[
            ['Terkumpul', 'Rp 1.840.000'],
            ['Belum bayar', '7 KK'],
            ['Via QRIS', '12 transaksi'],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-desa-line bg-desa-cream/60 px-3 py-2">
              <p className="text-[11px] text-desa-muted">{k}</p>
              <p className="mt-0.5 text-sm font-semibold text-desa-ink">{v}</p>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-xs">
            <thead>
              <tr className="border-b border-desa-line text-desa-muted">
                <th className="py-2 pr-3 font-medium">Kepala keluarga</th>
                <th className="py-2 pr-3 font-medium">Keamanan</th>
                <th className="py-2 pr-3 font-medium">Sampah</th>
                <th className="py-2 pr-3 font-medium">Kas RT</th>
                <th className="py-2 font-medium">Sosial</th>
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((r) => (
                <tr key={r.nama} className="border-b border-desa-line/60 last:border-0">
                  <td className="py-2 pr-3 text-desa-ink">{r.nama}</td>
                  {r.status.map((s, i) => (
                    <td key={i} className="py-2 pr-3">{cell(s)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </WindowFrame>
  );
}

function SuratMockup() {
  const steps = [
    { who: 'Ketua RT 03', when: 'Sen, 08.14', done: true },
    { who: 'Ketua RW 02', when: 'Sen, 10.02', done: true },
    { who: 'Kepala Desa', when: 'Menunggu', done: false },
  ];
  return (
    <WindowFrame title="Surat Keterangan Domisili · No. 470/112/SKM/IX/2026">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-desa-ink">Siti Aminah</p>
            <p className="text-xs text-desa-muted">Diajukan dari HP · Senin, 07.52</p>
          </div>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">Tahap 3 dari 3</span>
        </div>
        <ol className="mt-5 space-y-0">
          {steps.map((s, i) => (
            <li key={s.who} className="relative flex gap-3 pb-5 last:pb-0">
              {i < steps.length - 1 && <span className="absolute left-[9px] top-5 h-full w-px bg-desa-line" aria-hidden />}
              <span className={`relative mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border ${s.done ? 'border-desa-green-600 bg-desa-green-600 text-white' : 'border-desa-line bg-white'}`}>
                {s.done && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <div className="flex flex-1 justify-between gap-2 text-sm">
                <span className={s.done ? 'text-desa-ink' : 'text-desa-muted'}>{s.who}</span>
                <span className="text-xs text-desa-muted">{s.when}</span>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-dashed border-desa-line px-3 py-2.5">
          <FileText className="h-4 w-4 text-desa-muted" />
          <p className="flex-1 text-xs text-desa-muted">PDF bertanda QR terbit otomatis setelah disetujui</p>
          <QrCode className="h-5 w-5 text-desa-muted" />
        </div>
      </div>
    </WindowFrame>
  );
}

function RondaMockup() {
  const logs = [
    ['23.05', 'Pos Ronda Utama', 'Hendra, Joko'],
    ['23.41', 'Gerbang Blok C', 'Hendra, Joko'],
    ['00.18', 'Musala Al-Ikhlas', 'Hendra, Joko'],
    ['00.52', 'Lapangan Voli', '—'],
  ];
  return (
    <WindowFrame title="Patroli Ronda · Malam ini · RW 02">
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-desa-ink">3 dari 4 titik discan</p>
          <div className="h-1.5 w-28 rounded-full bg-desa-sand">
            <div className="h-1.5 w-3/4 rounded-full bg-desa-green-600" />
          </div>
        </div>
        <ul className="divide-y divide-desa-line/60">
          {logs.map(([jam, titik, petugas]) => {
            const missed = petugas === '—';
            return (
              <li key={titik} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="w-11 shrink-0 tabular-nums text-xs text-desa-muted">{jam}</span>
                <MapPin className={`h-4 w-4 shrink-0 ${missed ? 'text-desa-line' : 'text-desa-green-600'}`} />
                <span className={`flex-1 ${missed ? 'text-desa-muted/70' : 'text-desa-ink'}`}>{titik}</span>
                <span className={`text-xs ${missed ? 'text-amber-700' : 'text-desa-muted'}`}>{missed ? 'Belum discan' : petugas}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </WindowFrame>
  );
}

/* ───────────────────────── Illustrated vignettes ───────────────────────── */

const VIGNETTES = [
  { Scene: KerjaBaktiScene, caption: 'Kerja bakti akhir pekan' },
  { Scene: RondaScene, caption: 'Ronda malam, tercatat rapi' },
  { Scene: UmkmScene, caption: 'UMKM warga tampil ke tetangga' },
  { Scene: MusyawarahScene, caption: 'Musyawarah di balai desa' },
];

/* ───────────────────────── Page content ───────────────────────── */

const PROBLEMS = [
  {
    before: 'Iuran dicatat di buku tulis. Bendahara menagih dari pintu ke pintu, dan tidak ada yang tahu pasti siapa yang sudah bayar.',
    after: 'Matriks iuran per KK, bayar lewat QRIS, dan pengingat email terkirim otomatis sebelum jatuh tempo.',
  },
  {
    before: 'Warga bolak-balik ke rumah Pak RT, lalu ke RW, lalu ke kantor desa, hanya untuk satu surat pengantar.',
    after: 'Warga mengajukan dari HP. Surat berjalan RT → RW → Desa, lalu terbit sebagai PDF bertanda QR.',
  },
  {
    before: 'Jadwal ronda ada, tapi tidak ada yang tahu apakah petugas benar-benar berkeliling.',
    after: 'Petugas memindai QR di tiap titik. Pengurus melihat titik mana yang terlewat malam itu.',
  },
  {
    before: 'Saat rapat warga, laporan pemasukan dan pengeluaran sulit dipertanggungjawabkan.',
    after: 'Pengeluaran lengkap dengan bukti foto, dan setiap perubahan data tercatat di audit log.',
  },
];

const FEATURES = [
  {
    eyebrow: 'Iuran warga',
    title: 'Tahu siapa yang sudah bayar, tanpa membuka buku kas.',
    points: [
      'Atur jenis iuran per desa, RW, atau RT',
      'Tagihan bulanan dibuat untuk semua KK sekaligus',
      'Bayar via QRIS, status langsung jadi Lunas',
      'Pengingat email otomatis untuk tagihan yang jatuh tempo',
    ],
    mockup: <IuranMockup />,
  },
  {
    eyebrow: 'Surat menyurat',
    title: 'Surat pengantar selesai tanpa warga keluar rumah.',
    points: [
      'Persetujuan bertingkat RT, RW, lalu Kepala Desa',
      'Template surat bisa disesuaikan per desa',
      'PDF dengan kode QR untuk verifikasi keaslian',
      'Warga dikabari di setiap tahap',
    ],
    mockup: <SuratMockup />,
  },
  {
    eyebrow: 'Keamanan lingkungan',
    title: 'Ronda yang bisa dibuktikan, bukan sekadar dijadwalkan.',
    points: [
      'Titik checkpoint dengan kode QR yang bisa dicetak',
      'Jadwal petugas dan riwayat scan per malam',
      'Tombol darurat dengan lokasi GPS dan foto',
      'Laporan darurat tampil di peta untuk pengurus',
    ],
    mockup: <RondaMockup />,
  },
];

const MORE = [
  ['Data warga & KK', 'Profil warga, kartu keluarga, dan dokumen seperti KTP, akta, dan BPJS di satu tempat.'],
  ['UMKM desa', 'Usaha warga terdaftar, disetujui pengurus, dan tampil dengan tombol hubungi WhatsApp.'],
  ['Kicau desa', 'Ruang bicara warga satu desa: kabar, foto, dan komentar tetangga, bukan grup WhatsApp yang ramai.'],
  ['Pengumuman & kegiatan', 'Kabar desa dan jadwal kegiatan sampai ke warga tanpa bergantung pada grup chat.'],
  ['Laporan warga', 'Keluhan jalan rusak atau lampu mati tercatat dan bisa ditindaklanjuti.'],
  ['Buku tamu', 'Tamu yang datang ke lingkungan tercatat dengan rapi.'],
  ['Halaman publik desa', 'Setiap desa punya halaman profil sendiri yang bisa dibagikan.'],
  ['Audit log', 'Setiap perubahan data tercatat: siapa, kapan, dan apa yang diubah.'],
];

const ROLES = [
  { role: 'Kepala Desa', desc: 'Melihat kondisi seluruh RW dari satu dasbor, dan menyetujui surat di tahap akhir.' },
  { role: 'Sekretaris & Kaur', desc: 'Mengelola data warga, arsip surat, dan pembukuan tanpa rekap manual di spreadsheet.' },
  { role: 'Ketua RW & RT', desc: 'Menagih iuran, menyetujui surat pengantar, dan memantau ronda di wilayahnya.' },
  { role: 'Warga', desc: 'Mengajukan surat, membayar iuran, dan menekan tombol darurat dari HP.' },
];

const STEPS = [
  ['Daftarkan desa', 'Isi profil desa dan verifikasi email admin. Struktur RW dan RT dibuat setelahnya.'],
  ['Undang perangkat', 'Tambahkan Kepala Desa, Kaur, Ketua RW/RT, dan petugas ronda sesuai perannya.'],
  ['Aktifkan warga', 'Warga mendaftar dengan NIK. Pengurus RT memverifikasi, lalu akun aktif.'],
];

export default function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (id: string) => {
    setMenuOpen(false);
    scrollTo(id);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-desa-cream font-jakarta text-desa-ink antialiased">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-desa-line bg-desa-cream/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-desa-green-700 text-white">
              <Sprout className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">WargaHub</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Utama">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => go(n.id)} className="text-sm text-desa-muted hover:text-desa-ink">
                {n.label}
              </button>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated ? (
              <Link to="/dashboard" className="rounded-full bg-desa-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-desa-green-800">
                Buka dasbor
              </Link>
            ) : (
              <>
                <Link to="/login" className="rounded-full px-3.5 py-2 text-sm text-desa-ink/80 hover:text-desa-ink">Masuk</Link>
                <Link to="/register-desa" className="rounded-full bg-desa-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-desa-green-800">
                  Daftarkan desa
                </Link>
              </>
            )}
          </div>
          <button
            className="-mr-2 p-2 text-desa-ink md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-desa-line bg-desa-cream px-4 py-3 md:hidden">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => go(n.id)} className="block w-full py-2 text-left text-sm text-desa-ink/80">
                {n.label}
              </button>
            ))}
            <div className="mt-2 flex gap-2 border-t border-desa-line pt-3">
              {isAuthenticated ? (
                <Link to="/dashboard" className="flex-1 rounded-full bg-desa-green-700 py-2 text-center text-sm font-medium text-white">Buka dasbor</Link>
              ) : (
                <>
                  <Link to="/login" className="flex-1 rounded-full border border-desa-line py-2 text-center text-sm text-desa-ink/80">Masuk</Link>
                  <Link to="/register-desa" className="flex-1 rounded-full bg-desa-green-700 py-2 text-center text-sm font-medium text-white">Daftarkan desa</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-10">
            <div className="max-w-xl">
              <p className="text-sm font-medium tracking-wide text-desa-green-700">Administrasi desa, RW, dan RT</p>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-desa-ink sm:text-5xl">
                Urusan warga tidak perlu lagi dicatat di buku tulis.
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-desa-muted">
                WargaHub menyatukan data warga, surat pengantar, iuran, dan ronda dalam satu sistem
                yang dipakai bersama oleh desa, RW, RT, dan warganya.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={isAuthenticated ? '/dashboard' : '/register-desa'}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-desa-green-700 px-5 py-3 text-sm font-medium text-white shadow-lift hover:bg-desa-green-800"
                >
                  {isAuthenticated ? 'Buka dasbor' : 'Daftarkan desa Anda'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => scrollTo('fitur')}
                  className="inline-flex items-center justify-center rounded-full border border-desa-line px-5 py-3 text-sm font-medium text-desa-ink hover:border-desa-ink/40"
                >
                  Lihat fiturnya
                </button>
              </div>
            </div>
            <div className="relative">
              <HeroScene className="w-full rounded-[28px] border border-desa-line shadow-lift" />
            </div>
          </div>
          <div className="mt-16 lg:mt-20">
            <IuranMockup />
          </div>
        </section>

        {/* Problem → solution */}
        <section className="border-y border-desa-line bg-desa-sand/60">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <h2 className="max-w-2xl font-display text-2xl font-semibold tracking-tight text-desa-ink sm:text-3xl">
              Pekerjaan yang selama ini menyita waktu pengurus.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {PROBLEMS.map((p) => (
                <div key={p.before} className="rounded-[20px] border border-desa-line bg-white p-6 sm:p-7">
                  <p className="text-sm leading-relaxed text-desa-muted">{p.before}</p>
                  <p className="mt-4 flex gap-2.5 text-[15px] leading-relaxed text-desa-ink">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-desa-green-600" />
                    {p.after}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature deep-dives */}
        <section id="fitur" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-16 sm:px-6 lg:py-24">
          <div className="space-y-20 lg:space-y-28">
            {FEATURES.map((f, i) => (
              <div key={f.eyebrow} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                  <p className="text-sm font-medium text-desa-green-700">{f.eyebrow}</p>
                  <h3 className="mt-3 font-display text-2xl font-semibold leading-tight tracking-tight text-desa-ink sm:text-3xl">{f.title}</h3>
                  <ul className="mt-6 space-y-3">
                    {f.points.map((pt) => (
                      <li key={pt} className="flex gap-3 text-[15px] text-desa-ink/80">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-desa-muted" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`min-w-0 ${i % 2 === 1 ? 'lg:order-1' : ''}`}>{f.mockup}</div>
              </div>
            ))}
          </div>

          {/* Illustrated vignettes */}
          <div className="mt-24 border-t border-desa-line pt-16">
            <h3 className="font-display text-xl font-semibold tracking-tight text-desa-ink">Dari warga, untuk warga</h3>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {VIGNETTES.map(({ Scene, caption }) => (
                <div key={caption} className="overflow-hidden rounded-[20px] border border-desa-line bg-white">
                  <Scene className="aspect-[4/3] w-full" />
                  <p className="px-4 py-3 text-sm font-medium text-desa-ink">{caption}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 border-t border-desa-line pt-16">
            <h3 className="font-display text-xl font-semibold tracking-tight text-desa-ink">Juga termasuk</h3>
            <dl className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {MORE.map(([t, d]) => (
                <div key={t}>
                  <dt className="text-sm font-semibold text-desa-ink">{t}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-desa-muted">{d}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Roles */}
        <section id="peran" className="scroll-mt-16 border-t border-desa-line bg-desa-sand/60">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-3">
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight text-desa-ink sm:text-3xl">Satu sistem, dengan akses sesuai jabatan.</h2>
                <p className="mt-4 text-[15px] leading-relaxed text-desa-muted">
                  Tersedia 16 peran perangkat desa, dari Kepala Desa sampai petugas ronda. Setiap orang
                  hanya melihat data wilayah dan menu yang menjadi tugasnya. Peran khusus juga bisa dibuat sendiri.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
                {ROLES.map((r) => (
                  <div key={r.role} className="rounded-[20px] border border-desa-line bg-white p-6">
                    <p className="text-sm font-semibold text-desa-ink">{r.role}</p>
                    <p className="mt-2 text-sm leading-relaxed text-desa-muted">{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section id="mulai" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-16 sm:px-6 lg:py-24">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-desa-ink sm:text-3xl">Mulai dalam tiga langkah.</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="border-t-2 border-desa-green-700 pt-5">
                <span className="text-sm tabular-nums text-desa-muted">0{i + 1}</span>
                <p className="mt-2 font-semibold text-desa-ink">{t}</p>
                <p className="mt-2 text-sm leading-relaxed text-desa-muted">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="relative overflow-hidden rounded-[28px] bg-desa-green-800 px-6 py-14 text-desa-cream sm:px-12 sm:py-16">
            <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Siap merapikan administrasi desa Anda?</h2>
                <p className="mt-2 text-[15px] text-desa-cream/80">Daftarkan desa, lalu undang perangkat dan warga secara bertahap.</p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link to="/register-desa" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-desa-green-800 hover:bg-desa-cream">
                  Daftarkan desa
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/register" className="inline-flex items-center justify-center rounded-full border border-white/30 px-5 py-3 text-sm font-medium text-white hover:border-white/60">
                  Saya warga
                </Link>
              </div>
            </div>
            <VillageSilhouette className="pointer-events-none absolute inset-x-0 bottom-0 h-24 text-black/10" />
          </div>
        </section>
      </main>

      <footer className="border-t border-desa-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-desa-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} WargaHub</p>
          <div className="flex gap-6">
            <Link to="/login" className="hover:text-desa-ink">Masuk</Link>
            <Link to="/register" className="hover:text-desa-ink">Daftar sebagai warga</Link>
            <Link to="/register-desa" className="hover:text-desa-ink">Daftarkan desa</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
