import { useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { canPerformAction } from '../../config/permissions';
import { Settings, List, LayoutGrid } from 'lucide-react';
import IuranSetupTab from './tabs/IuranSetupTab';
import PaymentListTab from './tabs/PaymentListTab';
import PaymentMatrixTab from './tabs/PaymentMatrixTab';

type TabKey = 'setup' | 'list' | 'matrix';

export default function PaymentsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user ? canPerformAction(user.role, 'iuranTypes', 'create') : false;
  const [activeTab, setActiveTab] = useState<TabKey>('list');

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; adminOnly: boolean }[] = [
    { key: 'setup', label: 'Setup Iuran', icon: <Settings className="w-4 h-4" />, adminOnly: true },
    { key: 'list', label: 'Daftar Pembayaran', icon: <List className="w-4 h-4" />, adminOnly: false },
    { key: 'matrix', label: 'Status Iuran', icon: <LayoutGrid className="w-4 h-4" />, adminOnly: true },
  ];

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Keuangan</h1>
        <p className="text-gray-600 mt-1">Kelola iuran dan pembayaran warga</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1 -mb-px">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'setup' && isAdmin && <IuranSetupTab />}
      {activeTab === 'list' && <PaymentListTab />}
      {activeTab === 'matrix' && isAdmin && <PaymentMatrixTab />}
    </div>
  );
}
