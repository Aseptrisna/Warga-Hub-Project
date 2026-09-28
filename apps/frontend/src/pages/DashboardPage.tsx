import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { RoleLabels, Role } from '@shared/role.enum';
import { dashboardService } from '../services/dashboard.service';
import { useRegionScope } from '../hooks/useRegionScope';
import {
  Users, Home, Wallet, FileText, Flag, Calendar, User, CreditCard, Bell,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
} from 'recharts';
import { Card, CardBody } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { StatTile } from '../components/ui/StatTile';
import { Select } from '../components/ui/Input';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function WargaDashboard() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const quickActions = [
    { label: 'Profil Saya', href: '/my-profile', icon: User },
    { label: 'Tagihan Saya', href: '/finance', icon: CreditCard },
    { label: 'Surat Saya', href: '/letters', icon: FileText },
    { label: 'Laporan Saya', href: '/reports', icon: Flag },
    { label: 'Pengumuman', href: '/announcements', icon: Bell },
    { label: 'Event', href: '/events', icon: Calendar },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard Warga"
        subtitle={`Halo, ${user?.name}${user?.desa ? ` — Desa ${user.desa}` : ''}${user?.rw ? ` RW ${user.rw}` : ''}${user?.rt ? ` RT ${user.rt}` : ''}`}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.href}
              onClick={() => navigate(action.href)}
              className="text-left"
            >
              <Card className="p-5 hover:border-gray-300 transition-colors">
                <Icon className="w-5 h-5 text-primary-600 mb-3" />
                <h3 className="text-sm font-medium text-gray-900">{action.label}</h3>
              </Card>
            </button>
          );
        })}
      </div>

      <Card>
        <CardBody>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Layanan Mandiri</h3>
          <p className="text-sm text-gray-600">
            Melalui dashboard ini, Anda dapat mengelola profil kependudukan, melihat tagihan iuran,
            mengajukan surat, membuat laporan, dan mengikuti kegiatan desa.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const scope = useRegionScope();
  const [summary, setSummary] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');

  useEffect(() => { loadData(); }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryRes, chartsRes] = await Promise.all([
        dashboardService.getSummary(scope).catch(() => null),
        dashboardService.getChartData(period, scope).catch(() => null),
      ]);
      if (summaryRes) setSummary(summaryRes);
      if (chartsRes) setCharts(chartsRes);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1)}jt`;
    if (amount >= 1000) return `Rp ${(amount / 1000).toFixed(0)}rb`;
    return `Rp ${amount}`;
  };

  const formatCurrencyFull = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  // Build combined income/expense chart
  const financeChartData = (() => {
    if (!charts) return [];
    const allPeriods = new Set<string>();
    charts.incomeTrend?.forEach((i: any) => allPeriods.add(i._id));
    charts.expenseTrend?.forEach((e: any) => allPeriods.add(e._id));
    const periods = Array.from(allPeriods).sort();

    return periods.map((p) => {
      const income = charts.incomeTrend?.find((i: any) => i._id === p);
      const expense = charts.expenseTrend?.find((e: any) => e._id === p);
      return {
        period: p,
        Pemasukan: income?.total || 0,
        Pengeluaran: expense?.total || 0,
      };
    });
  })();

  // Gender pie chart data
  const genderData = summary?.gender ? [
    { name: 'Laki-laki', value: summary.gender['Laki-laki'] || 0 },
    { name: 'Perempuan', value: summary.gender['Perempuan'] || 0 },
  ] : [];

  // Report by category pie chart
  const reportCategoryData = charts?.reportByCategory?.map((r: any) => ({
    name: r._id || 'Lainnya',
    value: r.count,
  })) || [];

  const statsCards = [
    { name: 'Total Warga', value: summary?.totalWarga || 0, icon: Users },
    { name: 'Kartu Keluarga', value: summary?.totalKeluarga || 0, icon: Home },
    { name: 'Tagihan Lunas', value: `${summary?.tagihanLunas || 0}/${summary?.totalTagihan || 0}`, icon: Wallet },
    { name: 'Surat Pending', value: summary?.suratPending || 0, icon: FileText },
    { name: 'Laporan', value: summary?.laporanTotal || 0, icon: Flag },
    { name: 'Event', value: summary?.totalEvent || 0, icon: Calendar },
  ];

  // Show Warga-specific dashboard for Warga role
  if (user?.role === Role.WARGA) {
    return <WargaDashboard />;
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`${user?.name}${user?.role ? ` · ${RoleLabels[user.role]}` : ''}`}
        actions={
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-auto">
            <option value="weekly">Mingguan</option>
            <option value="monthly">Bulanan</option>
            <option value="yearly">Tahunan</option>
          </Select>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {statsCards.map((stat) => (
          <StatTile key={stat.name} label={stat.name} value={loading ? '...' : stat.value} icon={stat.icon} />
        ))}
      </div>

      {/* Row 2: Bar Chart + Gender Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2">
          <CardBody>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Pemasukan vs Pengeluaran</h3>
            {financeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={financeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value: number) => formatCurrencyFull(value)} />
                  <Legend />
                  <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">Belum ada data keuangan</div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Komposisi Gender</h3>
            {genderData.length > 0 && genderData.some((g: any) => g.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {genderData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">Belum ada data warga</div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Row 3: Payment Trend Line + Report Category Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2">
          <CardBody>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Tren Pembayaran</h3>
            {charts?.incomeTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={charts.incomeTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrencyFull(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="total" name="Total Pembayaran" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} yAxisId="left" />
                  <Line type="monotone" dataKey="count" name="Jumlah Transaksi" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} yAxisId="right" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">Belum ada data pembayaran</div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Laporan per Kategori</h3>
            {reportCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={reportCategoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {reportCategoryData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">Belum ada laporan</div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Row 4: Quick Actions + Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Ringkasan Keuangan</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-success-bg rounded-md">
                <span className="text-sm text-success-text">Total Pemasukan (Lunas)</span>
                <span className="font-medium text-success-text">{summary ? formatCurrencyFull(summary.totalPemasukan || 0) : '...'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-danger-bg rounded-md">
                <span className="text-sm text-danger-text">Total Pengeluaran (Approved)</span>
                <span className="font-medium text-danger-text">{summary ? formatCurrencyFull(summary.totalPengeluaran || 0) : '...'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-info-bg rounded-md">
                <span className="text-sm text-info-text">Selisih</span>
                <span className="font-medium text-info-text">{summary ? formatCurrencyFull((summary.totalPemasukan || 0) - (summary.totalPengeluaran || 0)) : '...'}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Kelola Warga', href: '/citizens' },
                { label: 'Kartu Keluarga', href: '/families' },
                { label: 'Surat Menyurat', href: '/letters' },
                { label: 'Iuran Warga', href: '/finance' },
                { label: 'Pengeluaran', href: '/expenses' },
                { label: 'Buku Tamu', href: '/guestbook' },
                { label: 'Pengumuman', href: '/announcements' },
                { label: 'Laporan', href: '/reports' },
              ].map((action) => (
                <a key={action.href} href={action.href} className="block px-3 py-2 bg-primary-50 text-primary-700 rounded-md hover:bg-primary-100 transition-colors text-sm text-center font-medium">
                  {action.label}
                </a>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
