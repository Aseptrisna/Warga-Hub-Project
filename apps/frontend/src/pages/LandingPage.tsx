import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import {
  Users,
  FileText,
  Wallet,
  Shield,
  Megaphone,
  AlertTriangle,
  CalendarDays,
  BookOpen,
  BarChart3,
  ClipboardList,
  Zap,
  Lock,
  Globe,
  Gift,
  ChevronRight,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  QrCode,
  Cctv,
  Siren,
  ShoppingBag,
  Vote,
  Map,
  MessageCircle,
  Rocket,
} from 'lucide-react';

// ─── Scroll Reveal Hook ───
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// ─── Data ───
const features = [
  { icon: Users, label: 'Data Warga', desc: 'Kelola data warga & keluarga secara digital', color: 'bg-blue-100 text-blue-600' },
  { icon: FileText, label: 'Surat Menyurat', desc: 'Buat surat otomatis dengan template dinamis', color: 'bg-emerald-100 text-emerald-600' },
  { icon: Wallet, label: 'Iuran & Keuangan', desc: 'Catat iuran, pengeluaran & laporan keuangan', color: 'bg-amber-100 text-amber-600' },
  { icon: Shield, label: 'Ronda & Keamanan', desc: 'QR checkpoint & jadwal ronda digital', color: 'bg-red-100 text-red-600' },
  { icon: Megaphone, label: 'Pengumuman', desc: 'Broadcast info ke seluruh warga', color: 'bg-purple-100 text-purple-600' },
  { icon: ClipboardList, label: 'Laporan', desc: 'Laporan warga real-time & terpusat', color: 'bg-indigo-100 text-indigo-600' },
  { icon: CalendarDays, label: 'Event & Kegiatan', desc: 'Kelola acara desa dan partisipasi warga', color: 'bg-pink-100 text-pink-600' },
  { icon: AlertTriangle, label: 'Panic Button', desc: 'Tombol darurat dengan notifikasi instan', color: 'bg-orange-100 text-orange-600' },
  { icon: BookOpen, label: 'Buku Tamu', desc: 'Pencatatan tamu desa secara digital', color: 'bg-teal-100 text-teal-600' },
  { icon: BarChart3, label: 'Dashboard Analitik', desc: 'Statistik & grafik data desa real-time', color: 'bg-cyan-100 text-cyan-600' },
];

const comingSoonFeatures = [
  { icon: QrCode, label: 'Pembayaran QRIS/VA', desc: 'Bayar iuran via QRIS & Virtual Account instan', color: 'bg-lime-100 text-lime-600' },
  { icon: Cctv, label: 'CCTV Desa', desc: 'Integrasi & monitoring CCTV seluruh wilayah desa', color: 'bg-slate-100 text-slate-600' },
  { icon: Siren, label: 'Early Warning System', desc: 'Deteksi dini banjir, kebakaran & pencurian', color: 'bg-rose-100 text-rose-600' },
  { icon: ShoppingBag, label: 'Marketplace Desa', desc: 'Jual beli produk UMKM & hasil bumi desa', color: 'bg-violet-100 text-violet-600' },
  { icon: Vote, label: 'E-Voting Online', desc: 'Voting & musyawarah desa secara digital', color: 'bg-sky-100 text-sky-600' },
  { icon: Map, label: 'Peta Digital Desa', desc: 'Peta interaktif wilayah RT, RW & fasilitas desa', color: 'bg-fuchsia-100 text-fuchsia-600' },
  { icon: MessageCircle, label: 'WhatsApp Bot', desc: 'Notifikasi otomatis & layanan via WhatsApp', color: 'bg-green-100 text-green-600' },
];

const steps = [
  { num: 1, title: 'Admin Input Data', desc: 'Admin desa memasukkan data wilayah, warga, dan konfigurasi awal.' },
  { num: 2, title: 'Warga Mendaftar', desc: 'Warga mendaftar melalui aplikasi dengan data NIK dan verifikasi.' },
  { num: 3, title: 'Verifikasi Akun', desc: 'Admin memverifikasi dan mengaktifkan akun warga yang terdaftar.' },
  { num: 4, title: 'Akses Layanan', desc: 'Warga dapat mengakses semua layanan digital desa.' },
];

const stats = [
  { value: '500+', label: 'Desa Terdaftar' },
  { value: '50.000+', label: 'Warga Aktif' },
  { value: '100.000+', label: 'Surat Terbit' },
  { value: '99.9%', label: 'Uptime' },
];

const benefits = [
  { icon: Zap, title: 'Modern & Cepat', desc: 'Dibangun dengan teknologi terbaru untuk performa optimal.' },
  { icon: Lock, title: 'Aman & Terpercaya', desc: 'Enkripsi data dan akses berbasis peran (RBAC).' },
  { icon: Globe, title: 'Akses Dimana Saja', desc: 'Responsive di semua perangkat — desktop, tablet, mobile.' },
  { icon: Gift, title: 'Gratis untuk Desa', desc: 'Tanpa biaya berlangganan, langsung pakai.' },
];

// ─── Component ───
export default function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Navbar scroll effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = useCallback((id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Section refs for scroll reveal
  const fiturReveal = useScrollReveal();
  const comingSoonReveal = useScrollReveal();
  const caraKerjaReveal = useScrollReveal();
  const statsReveal = useScrollReveal();
  const keunggulanReveal = useScrollReveal();
  const ctaReveal = useScrollReveal();

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* ══════════ NAVBAR ══════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <span className={`text-xl font-bold ${scrolled ? 'text-gray-900' : 'text-white'}`}>
                WargaHub
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-8">
              {['Fitur', 'Cara Kerja', 'Keunggulan', 'Kontak'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollTo(item.toLowerCase().replace(' ', '-'))}
                  className={`text-sm font-medium transition-colors hover:text-primary-500 ${
                    scrolled ? 'text-gray-600' : 'text-white/80'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                      scrolled
                        ? 'text-gray-700 hover:text-primary-600'
                        : 'text-white/90 hover:text-white'
                    }`}
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    Daftar Gratis
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`lg:hidden p-2 rounded-lg ${scrolled ? 'text-gray-700' : 'text-white'}`}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden bg-white border-t shadow-lg animate-fade-in">
            <div className="px-4 py-4 space-y-1">
              {['Fitur', 'Cara Kerja', 'Keunggulan', 'Kontak'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollTo(item.toLowerCase().replace(' ', '-'))}
                  className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium"
                >
                  {item}
                </button>
              ))}
              <div className="pt-3 border-t mt-3 flex flex-col gap-2">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="px-4 py-3 bg-primary-600 text-white text-center text-sm font-semibold rounded-xl"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="px-4 py-3 text-gray-700 text-center text-sm font-medium rounded-xl border border-gray-200"
                    >
                      Masuk
                    </Link>
                    <Link
                      to="/register"
                      className="px-4 py-3 bg-primary-600 text-white text-center text-sm font-semibold rounded-xl"
                    >
                      Daftar Gratis
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-2xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 lg:pt-0 lg:pb-0 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-6 animate-fade-in">
                <Zap size={16} />
                Platform Digital Desa #1 di Indonesia
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 animate-fade-in-up">
                Digitalisasi{' '}
                <span className="text-primary-200">Administrasi</span>{' '}
                Desa Anda
              </h1>

              <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-in-up delay-200">
                Platform all-in-one untuk mengelola data warga, surat menyurat,
                keuangan, keamanan, dan layanan desa lainnya secara digital.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-4 animate-fade-in-up delay-300">
                <Link
                  to="/register-desa"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-700 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg shadow-primary-900/20"
                >
                  Daftarkan Desa Anda <ArrowRight size={18} />
                </Link>
                <button
                  onClick={() => scrollTo('fitur')}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
                >
                  Lihat Fitur
                </button>
              </div>

              <div className="text-center lg:text-left mb-10 animate-fade-in-up delay-300">
                <Link to="/register" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
                  Atau daftar sebagai warga &rarr;
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-6 justify-center lg:justify-start text-white/70 text-sm animate-fade-in-up delay-400">
                <span className="flex items-center gap-1.5">
                  <Gift size={16} /> Gratis
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap size={16} /> Setup 5 menit
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock size={16} /> Aman dan Terpercaya
                </span>
              </div>
            </div>

            {/* Right — Dashboard mockup (CSS only) */}
            <div className="hidden lg:block animate-float">
              <div className="relative">
                {/* Main card */}
                <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-6 border border-white/50">
                  {/* Fake topbar */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <div className="flex-1 h-6 bg-gray-100 rounded-lg ml-3" />
                  </div>

                  {/* Stat cards */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="bg-primary-50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-primary-700">2.458</div>
                      <div className="text-xs text-primary-600/70">Warga</div>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-emerald-700">184</div>
                      <div className="text-xs text-emerald-600/70">Surat</div>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-amber-700">Rp 12jt</div>
                      <div className="text-xs text-amber-600/70">Iuran</div>
                    </div>
                  </div>

                  {/* Fake chart bars */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-end gap-2 h-24">
                      {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
                        <div key={i} className="flex-1 bg-primary-400 rounded-t-lg transition-all" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating notification card */}
                <div className="absolute -bottom-4 -left-6 bg-white rounded-xl shadow-xl p-3 flex items-center gap-3 animate-fade-in delay-500 border border-gray-100">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">Surat Selesai</div>
                    <div className="text-xs text-gray-500">SK Domisili - Budi S.</div>
                  </div>
                </div>

                {/* Floating user card */}
                <div className="absolute -top-3 -right-4 bg-white rounded-xl shadow-xl p-3 flex items-center gap-3 animate-fade-in delay-700 border border-gray-100">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Users size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">+12 Warga Baru</div>
                    <div className="text-xs text-gray-500">Minggu ini</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FITUR ══════════ */}
      <section id="fitur" className="py-20 lg:py-28 bg-gray-50">
        <div
          ref={fiturReveal.ref}
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
            fiturReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-4">
              Fitur Lengkap
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Semua yang Desa Anda Butuhkan
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Dari data warga hingga keamanan lingkungan, WargaHub menyediakan semua fitur yang diperlukan untuk digitalisasi desa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {features.map((f, i) => (
              <div
                key={f.label}
                className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-300 ${
                  fiturReveal.isVisible ? 'animate-fade-in-up' : 'opacity-0'
                } delay-${(i % 5) * 100 + 100}`}
              >
                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                  <f.icon size={22} />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{f.label}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ SEGERA HADIR ══════════ */}
      <section className="py-20 lg:py-28 bg-white">
        <div
          ref={comingSoonReveal.ref}
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
            comingSoonReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold mb-4">
              <Rocket size={14} />
              Segera Hadir
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Fitur yang Sedang Kami Kembangkan
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Kami terus berinovasi untuk menghadirkan fitur-fitur canggih demi mewujudkan desa yang lebih modern dan aman.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {comingSoonFeatures.map((f, i) => (
              <div
                key={f.label}
                className={`relative bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200 p-5 hover:border-primary-300 hover:shadow-md transition-all duration-300 group ${
                  comingSoonReveal.isVisible ? 'animate-fade-in-up' : 'opacity-0'
                } delay-${(i % 4) * 100 + 100}`}
              >
                <span className="absolute top-3 right-3 px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wide">
                  Coming Soon
                </span>
                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-4 opacity-80 group-hover:opacity-100 transition-opacity`}>
                  <f.icon size={22} />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{f.label}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CARA KERJA ══════════ */}
      <section id="cara-kerja" className="py-20 lg:py-28 bg-white">
        <div
          ref={caraKerjaReveal.ref}
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
            caraKerjaReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-4">
              Cara Kerja
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Mulai dalam 4 Langkah Mudah
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Proses sederhana untuk memulai digitalisasi desa Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={s.num} className="relative text-center">
                {/* Connector line (hidden on first item & mobile) */}
                {i > 0 && (
                  <div className="hidden lg:block absolute top-8 -left-4 w-8 border-t-2 border-dashed border-primary-300" />
                )}
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-700 rounded-full text-2xl font-extrabold mb-5">
                  {s.num}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ STATISTIK ══════════ */}
      <section className="relative py-20 lg:py-24 bg-primary-900 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-primary-700/50 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-800/40 rounded-full blur-3xl" />

        <div
          ref={statsReveal.ref}
          className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
            statsReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl sm:text-5xl font-extrabold text-white mb-2">{s.value}</div>
                <div className="text-primary-200 text-sm sm:text-base font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ KEUNGGULAN ══════════ */}
      <section id="keunggulan" className="py-20 lg:py-28 bg-gray-50">
        <div
          ref={keunggulanReveal.ref}
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
            keunggulanReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — benefits list */}
            <div>
              <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-4">
                Kenapa WargaHub?
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-8">
                Keunggulan Platform Kami
              </h2>

              <div className="space-y-6">
                {benefits.map((b) => (
                  <div key={b.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <b.icon size={22} className="text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{b.title}</h3>
                      <p className="text-sm text-gray-500">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — visual cards (hidden on mobile) */}
            <div className="hidden lg:block space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Shield size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Keamanan Terjamin</div>
                    <div className="text-xs text-gray-500">Enkripsi end-to-end & RBAC</div>
                  </div>
                  <div className="ml-auto px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                    Aktif
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['JWT Auth', 'Role-Based', 'Audit Log'].map((tag) => (
                    <div key={tag} className="bg-gray-50 rounded-lg py-2 text-center text-xs font-medium text-gray-600">
                      {tag}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                    <Globe size={20} className="text-primary-600" />
                  </div>
                  <div className="font-bold text-gray-900 mb-1">Multi-Platform</div>
                  <div className="text-xs text-gray-500">Desktop, tablet, mobile — semua lancar.</div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                    <Zap size={20} className="text-amber-600" />
                  </div>
                  <div className="font-bold text-gray-900 mb-1">Super Cepat</div>
                  <div className="text-xs text-gray-500">Response time &lt;200ms di semua API.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section className="py-20 lg:py-24">
        <div
          ref={ctaReveal.ref}
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
            ctaReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="relative bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl px-8 py-16 sm:px-16 text-center overflow-hidden">
            {/* Blobs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/30 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-400/20 rounded-full blur-3xl" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Siap Memulai Transformasi Digital Desa Anda?
              </h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto">
                Bergabung dengan ratusan desa yang sudah menggunakan WargaHub untuk layanan administrasi modern.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register-desa"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-700 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
                >
                  Daftarkan Desa Anda <ChevronRight size={18} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
                >
                  Masuk ke Akun
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer id="kontak" className="bg-gray-900 text-gray-400 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* About */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">W</span>
                </div>
                <span className="text-white font-bold text-lg">WargaHub</span>
              </div>
              <p className="text-sm leading-relaxed">
                Platform digital untuk pengelolaan administrasi desa yang modern, aman, dan mudah digunakan.
              </p>
            </div>

            {/* Tautan Cepat */}
            <div>
              <h4 className="text-white font-semibold mb-4">Tautan Cepat</h4>
              <ul className="space-y-2 text-sm">
                {['Fitur', 'Cara Kerja', 'Keunggulan', 'Kontak'].map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => scrollTo(item.toLowerCase().replace(' ', '-'))}
                      className="hover:text-white transition-colors"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Layanan */}
            <div>
              <h4 className="text-white font-semibold mb-4">Layanan</h4>
              <ul className="space-y-2 text-sm">
                {['Data Warga', 'Surat Menyurat', 'Iuran & Keuangan', 'Keamanan Ronda', 'Pengumuman', 'Dashboard Analitik'].map((item) => (
                  <li key={item}>
                    <span className="hover:text-white transition-colors cursor-default">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Kontak */}
            <div>
              <h4 className="text-white font-semibold mb-4">Kontak</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Mail size={16} className="text-primary-400" />
                  logic.frame.indonesia@gmail.com
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={16} className="text-primary-400" />
                  +62 858 4172 2279
                </li>
                <li className="flex items-start gap-2">
                  <MapPin size={16} className="text-primary-400 mt-0.5" />
                  <span>Bandar Lampung, Indonesia</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <p>&copy; {new Date().getFullYear()} WargaHub. All rights reserved.</p>
            <p>Dibuat dengan ❤ untuk Indonesia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
