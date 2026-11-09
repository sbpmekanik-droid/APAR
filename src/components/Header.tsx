import React from 'react';
import { 
  ShieldAlert, 
  Flame, 
  QrCode, 
  User, 
  LogOut, 
  AlertTriangle,
  Calendar,
  Menu,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { getIsoWeek, isDateInCurrentWeek } from '../utils/inspectionLogic';

interface HeaderProps {
  onOpenScanner: () => void;
  onToggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenScanner, 
  onToggleSidebar, 
  activeTab: _activeTab,
  setActiveTab 
}) => {
  const { currentUser, isAdmin, logout, loginAs } = useAuth();
  const { apars, inspections, settings, isFirestoreConnected } = useApp();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const { week, year } = getIsoWeek(new Date());

  // Count uninspected APARs this week
  const activeApars = apars.filter(a => a.status === 'aktif');
  const checkedThisWeek = activeApars.filter(a => isDateInCurrentWeek(a.lastInspectionDate));
  const uninspectedCount = activeApars.length - checkedThisWeek.length;

  // Count critical / needs action
  const criticalCount = activeApars.filter(a => a.lastInspectionStatus === 'TIDAK LAYAK').length;
  const needsActionCount = activeApars.filter(a => a.lastInspectionStatus === 'PERLU TINDAKAN').length;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left Brand */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 lg:hidden focus:outline-none"
              title="Buka Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div 
              onClick={() => setActiveTab('dashboard')} 
              className="flex items-center space-x-2.5 cursor-pointer select-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-900/40 group-hover:scale-105 transition-transform">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white group-hover:text-red-400 transition-colors">
                    HSE APAR
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded font-mono font-semibold bg-red-950 text-red-300 border border-red-800/60">
                    V-BELT
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium truncate max-w-[170px] sm:max-w-none">
                  {settings.companyName} • Plant Unit 1
                </p>
              </div>
            </div>
          </div>

          {/* Center Info - Week & Status Badges */}
          <div className="hidden md:flex items-center space-x-2.5 text-xs">
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-[11px]">Cloud Live Sync</span>
            </div>

            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-red-400" />
              <span className="font-medium">Minggu ke-{week} ({year})</span>
            </div>

            {criticalCount > 0 && (
              <button 
                onClick={() => setActiveTab('tindak-lanjut')}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-950/80 border border-red-700 text-red-300 hover:bg-red-900/60 transition-colors cursor-pointer"
                title={`${criticalCount} APAR kondisi tidak layak`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span className="font-semibold">{criticalCount} Kritis</span>
              </button>
            )}

            {uninspectedCount > 0 && (
              <button 
                onClick={() => setActiveTab('monitoring')}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-950/70 border border-amber-800 text-amber-300 hover:bg-amber-900/60 transition-colors cursor-pointer"
                title={`${uninspectedCount} APAR belum diperiksa minggu ini`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>{uninspectedCount} Belum Diperiksa</span>
              </button>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Big Quick Scan Button */}
            <button
              onClick={onOpenScanner}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-red-900/30 hover:shadow-red-800/50 transition-all active:scale-95 cursor-pointer"
            >
              <QrCode className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span className="hidden xs:inline">Scan QR</span>
            </button>

            {/* User Profile & Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-slate-200">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <div className="font-semibold text-slate-200 max-w-[120px] truncate leading-tight">
                    {currentUser?.name?.split(' ')[0] || 'User'}
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-red-400">
                    {currentUser?.role === 'admin' ? 'HSE Manager' : 'Inspector'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-slate-200 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setShowUserMenu(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-700">
                    <p className="text-xs text-slate-400 font-medium">Masuk Sebagai:</p>
                    <p className="text-sm font-bold text-white truncate">{currentUser?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{currentUser?.email}</p>
                    <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-900/60 text-red-300 border border-red-700/60">
                      {currentUser?.role === 'admin' ? '🛡️ Administrator / HSE Manager' : '🔍 Inspector / Petugas HSE'}
                    </div>
                  </div>

                  {/* Switch Role Quick Links (Helpful for testing both roles) */}
                  <div className="px-3 py-2 border-b border-slate-700">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 px-1">
                      Ganti Peran Uji Coba:
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => { loginAs('admin'); setShowUserMenu(false); }}
                        className={`text-xs py-1.5 px-2 rounded-lg font-medium text-center transition-colors ${
                          isAdmin 
                            ? 'bg-red-700 text-white font-bold' 
                            : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        HSE Manager
                      </button>
                      <button
                        onClick={() => { loginAs('inspector'); setShowUserMenu(false); }}
                        className={`text-xs py-1.5 px-2 rounded-lg font-medium text-center transition-colors ${
                          !isAdmin 
                            ? 'bg-red-700 text-white font-bold' 
                            : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Inspector
                      </button>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => { setActiveTab('pengaturan'); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-750 flex items-center space-x-2"
                    >
                      <span>Profil & Pengaturan Akun</span>
                    </button>
                    <button
                      onClick={() => { logout(); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-950/40 flex items-center space-x-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
