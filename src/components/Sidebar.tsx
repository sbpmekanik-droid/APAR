import React from 'react';
import { 
  LayoutDashboard, 
  Database, 
  PlusCircle, 
  QrCode, 
  Camera, 
  ClipboardCheck, 
  History, 
  Wrench, 
  FileText, 
  Users, 
  Settings, 
  X,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { isDateInCurrentWeek } from '../utils/inspectionLogic';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
}) => {
  const { isAdmin, currentUser } = useAuth();
  const { apars, inspections } = useApp();

  // Badges
  const activeApars = apars.filter(a => a.status === 'aktif');
  const checkedThisWeek = activeApars.filter(a => isDateInCurrentWeek(a.lastInspectionDate));
  const uninspectedCount = activeApars.length - checkedThisWeek.length;
  
  const pendingFollowUpCount = inspections.filter(
    i => i.followUpStatus === 'pending' || i.followUpStatus === 'in_progress'
  ).length;

  interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    adminOnly?: boolean;
    badge?: number;
    badgeColor?: string;
  }

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'master-apar', label: 'Master Data APAR', icon: Database },
    { id: 'tambah-apar', label: 'Tambah APAR', icon: PlusCircle, adminOnly: true },
    { id: 'generate-qr', label: 'Generate & Cetak QR', icon: QrCode },
    { id: 'scan-qr', label: 'Scan QR Code', icon: Camera },
    { 
      id: 'monitoring', 
      label: 'Inspeksi Mingguan', 
      icon: ClipboardCheck,
      badge: uninspectedCount > 0 ? uninspectedCount : undefined,
      badgeColor: 'bg-amber-600'
    },
    { id: 'riwayat', label: 'Riwayat Inspeksi', icon: History },
    { 
      id: 'tindak-lanjut', 
      label: 'Tindak Lanjut', 
      icon: Wrench,
      badge: pendingFollowUpCount > 0 ? pendingFollowUpCount : undefined,
      badgeColor: 'bg-red-600'
    },
    { id: 'laporan', label: 'Laporan & Export', icon: FileText },
    { id: 'users', label: 'Manajemen User', icon: Users, adminOnly: true },
    { id: 'pengaturan', label: 'Pengaturan Sistem', icon: Settings },
  ];

  const handleSelect = (id: string, adminOnly?: boolean) => {
    if (adminOnly && !isAdmin) {
      alert('Akses Dibatasi: Menu ini hanya dapat diakses oleh Administrator / HSE Manager.');
      return;
    }
    setActiveTab(id);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header Inside Sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
          <span className="font-bold text-sm text-slate-300">Navigasi HSE</span>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Banner */}
        <div className="p-3 mx-3 my-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
          <div className="flex items-center space-x-2.5">
            <div className={`p-1.5 rounded-lg ${isAdmin ? 'bg-red-900/60 text-red-400' : 'bg-emerald-900/60 text-emerald-400'}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Tingkat Akses</p>
              <p className="text-xs font-bold text-white truncate">
                {isAdmin ? 'HSE Administrator' : 'Petugas Inspector'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isCurrent = activeTab === item.id;
            const isLocked = item.adminOnly && !isAdmin;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id, item.adminOnly)}
                disabled={isLocked}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group ${
                  isCurrent
                    ? 'bg-red-600 text-white font-semibold shadow-md shadow-red-950/40'
                    : isLocked
                    ? 'text-slate-500 opacity-60 cursor-not-allowed hover:bg-transparent'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-colors ${
                    isCurrent ? 'text-white' : isLocked ? 'text-slate-600' : 'text-slate-400 group-hover:text-red-400'
                  }`} />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  {item.badge !== undefined && (
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white ${item.badgeColor || 'bg-red-600'}`}>
                      {item.badge}
                    </span>
                  )}
                  {isLocked && (
                    <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-slate-800 text-slate-500 border border-slate-700">
                      Admin
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span className="font-medium text-slate-300">Sistem Online</span>
          </div>
          <p className="text-[10px] text-slate-400">
            HSE Fire Safety v2.4 • PT V-Belt ID
          </p>
        </div>
      </aside>
    </>
  );
};
