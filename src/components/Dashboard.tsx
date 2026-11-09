import React from 'react';
import { 
  Flame, 
  XCircle, 
  Camera, 
  ArrowRight, 
  ShieldCheck, 
  MapPin, 
  Wrench,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  onOpenScanner: () => void;
  onSelectApar: (aparId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  setActiveTab,
  onOpenScanner,
  onSelectApar,
}) => {
  const { apars } = useApp();

  const totalApar = apars.length;
  const criticalApars = apars.filter(a => a.lastInspectionStatus === 'TIDAK LAYAK');
  const criticalCount = criticalApars.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Title Header */}
      <div className="text-center sm:text-left">
        <div className="inline-flex items-center space-x-2 text-red-500 font-bold text-xs uppercase tracking-wider mb-1">
          <Flame className="w-4 h-4" />
          <span>HSE PT V-Belt Indonesia</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Dashboard Inspeksi APAR
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Ringkasan status kesiapan alat pemadam api ringan di pabrik manufaktur V-Belt.
        </p>
      </div>

      {/* 2 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* 1. JUMLAH TOTAL APAR */}
        <div 
          onClick={() => setActiveTab('master-apar')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-xl transition-all hover:scale-[1.01] cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Jumlah Total APAR
            </span>
            <div className="p-3 rounded-xl bg-slate-800 text-slate-300 group-hover:text-red-400 group-hover:bg-slate-750 transition-colors">
              <Flame className="w-6 h-6" />
            </div>
          </div>

          <div className="my-4">
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              {totalApar}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Tabung terdaftar di seluruh area pabrik
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-red-400 group-hover:text-red-300">
            <span>Buka Master Data APAR</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 2. JUMLAH KONDISI APAR TIDAK LAYAK */}
        <div 
          onClick={() => setActiveTab('tindak-lanjut')}
          className={`border rounded-2xl p-6 shadow-xl transition-all hover:scale-[1.01] cursor-pointer group flex flex-col justify-between ${
            criticalCount > 0 
              ? 'bg-gradient-to-br from-red-950/50 via-slate-900 to-slate-900 border-red-800/80 hover:border-red-700' 
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${criticalCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
              Kondisi APAR Tidak Layak
            </span>
            <div className={`p-3 rounded-xl ${
              criticalCount > 0 ? 'bg-red-900/60 text-red-400 animate-pulse' : 'bg-slate-800 text-emerald-400'
            }`}>
              {criticalCount > 0 ? <XCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
          </div>

          <div className="my-4">
            <div className={`text-4xl sm:text-5xl font-black tracking-tight ${
              criticalCount > 0 ? 'text-red-500' : 'text-emerald-400'
            }`}>
              {criticalCount}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {criticalCount > 0 
                ? 'Tabung mengalami kerusakan kritis / perlu penggantian' 
                : 'Seluruh tabung yang telah diperiksa dalam kondisi aman'}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-300 group-hover:text-white">
            <span>{criticalCount > 0 ? 'Lihat Daftar Tindak Lanjut' : 'Kondisi Aman'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* 3. TOMBOL BESAR SCAN INSPEKSI APAR */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-600 rounded-2xl p-6 sm:p-7 shadow-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4 text-center sm:text-left">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight">
              Scan Inspeksi APAR
            </h2>
            <p className="text-xs sm:text-sm text-red-100 mt-0.5">
              Arahkan kamera smartphone ke QR Code tabung untuk langsung membuka checklist pemeriksaan mingguan.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenScanner}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white text-slate-950 font-black text-sm sm:text-base hover:bg-slate-100 shadow-xl transition-all active:scale-95 cursor-pointer shrink-0 flex items-center justify-center space-x-2"
        >
          <Camera className="w-5 h-5 text-red-600" />
          <span>BUKA KAMERA SCAN QR</span>
        </button>
      </div>

      {/* DAFTAR APAR TIDAK LAYAK (JIKA ADA) */}
      {criticalCount > 0 && (
        <div className="bg-slate-900 border border-red-900/50 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-red-400 font-bold text-sm">
              <XCircle className="w-4 h-4" />
              <span>Daftar Tabung APAR Tidak Layak ({criticalCount} Unit)</span>
            </div>
            <button
              onClick={() => setActiveTab('tindak-lanjut')}
              className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center"
            >
              Kelola Perbaikan <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="space-y-2.5">
            {criticalApars.map((apar) => (
              <div 
                key={apar.id}
                className="p-3.5 rounded-xl bg-red-950/25 border border-red-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sm text-white">{apar.aparCode}</span>
                    <span className="text-xs px-2 py-0.5 rounded font-semibold bg-slate-800 text-slate-300">
                      {apar.mediaType} ({apar.capacity})
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                      TIDAK LAYAK
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center space-x-1 mt-1">
                    <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                    <span>{apar.building} • {apar.area}</span>
                  </div>
                  {apar.notes && (
                    <p className="text-xs text-red-300 mt-1 font-medium line-clamp-1">
                      Catatan: {apar.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => onSelectApar(apar.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
                  >
                    Detail
                  </button>
                  <button
                    onClick={() => setActiveTab('tindak-lanjut')}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center space-x-1"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Tindak Lanjut</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* JIKA SEMUA APAR LAYAK */}
      {criticalCount === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 space-y-1">
          <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
          <p className="font-bold text-white text-sm">Semua APAR Berfungsi dengan Baik</p>
          <p className="text-xs">Tidak ditemukan tabung pemadam api dalam kondisi tidak layak pada pemeriksaan rutin.</p>
        </div>
      )}

    </div>
  );
};
