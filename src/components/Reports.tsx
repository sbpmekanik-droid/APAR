import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Flame,
  ShieldCheck,
  Building
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  exportAparListToExcel, 
  exportInspectionsToExcel, 
  exportAreaComplianceToExcel,
  exportAparListToPdf, 
  exportWeeklyInspectionToPdf 
} from '../utils/exportUtils';
import { getIsoWeek, isDateInCurrentWeek } from '../utils/inspectionLogic';

export const Reports: React.FC = () => {
  const { apars, inspections, settings } = useApp();
  const { week, year } = getIsoWeek(new Date());

  const [selectedReportType, setSelectedReportType] = useState<
    'inventory' | 'weekly' | 'monthly' | 'problematic' | 'followup' | 'area_compliance'
  >('inventory');

  const [filterWeek, setFilterWeek] = useState<number>(week);
  const [filterYear, setFilterYear] = useState<number>(year);

  // Computations
  const activeApars = useMemo(() => apars.filter(a => a.status === 'aktif'), [apars]);
  const problematicInspections = useMemo(() => {
    return inspections.filter(i => i.finalStatus === 'TIDAK LAYAK' || i.finalStatus === 'PERLU TINDAKAN');
  }, [inspections]);

  const weeklyInspections = useMemo(() => {
    return inspections.filter(i => i.weekNumber === filterWeek && i.year === filterYear);
  }, [inspections, filterWeek, filterYear]);

  // Area compliance computation
  const areaComplianceStats = useMemo(() => {
    const map: Record<string, { total: number; checked: number; good: number; needsAction: number; critical: number }> = {};
    activeApars.forEach(a => {
      if (!map[a.area]) {
        map[a.area] = { total: 0, checked: 0, good: 0, needsAction: 0, critical: 0 };
      }
      map[a.area].total += 1;
      if (isDateInCurrentWeek(a.lastInspectionDate)) {
        map[a.area].checked += 1;
      }
      if (a.lastInspectionStatus === 'BAIK') map[a.area].good += 1;
      if (a.lastInspectionStatus === 'PERLU TINDAKAN') map[a.area].needsAction += 1;
      if (a.lastInspectionStatus === 'TIDAK LAYAK') map[a.area].critical += 1;
    });

    return Object.entries(map).map(([area, stats]) => ({
      area,
      ...stats,
    }));
  }, [activeApars]);

  // Handlers for export
  const handleExportExcel = () => {
    switch (selectedReportType) {
      case 'inventory':
        exportAparListToExcel(apars, 'Daftar_Inventaris_Master_APAR');
        break;
      case 'weekly':
        exportInspectionsToExcel(weeklyInspections, `Laporan_Inspeksi_APAR_Minggu_${filterWeek}_${filterYear}`);
        break;
      case 'monthly':
        exportInspectionsToExcel(inspections, `Laporan_Inspeksi_Bulanan_APAR_${filterYear}`);
        break;
      case 'problematic':
        exportInspectionsToExcel(problematicInspections, 'Laporan_APAR_Bermasalah_Kritis');
        break;
      case 'followup':
        exportInspectionsToExcel(problematicInspections, 'Laporan_Tindak_Lanjut_Perbaikan');
        break;
      case 'area_compliance':
        exportAreaComplianceToExcel(areaComplianceStats, filterWeek);
        break;
    }
  };

  const handleExportPdf = () => {
    if (selectedReportType === 'inventory') {
      exportAparListToPdf(apars);
    } else {
      exportWeeklyInspectionToPdf(
        selectedReportType === 'problematic' ? problematicInspections : weeklyInspections,
        filterWeek,
        filterYear
      );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <FileText className="w-6 h-6 text-red-500" />
            <span>Pusat Laporan & Ekspor Dokumen HSE</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cetak dan unduh laporan inspeksi berkala, rekonsiliasi inventaris, dan kepatuhan per area dalam format Excel (.xlsx) dan PDF resmi.
          </p>
        </div>
      </div>

      {/* Report Type Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        <button
          onClick={() => setSelectedReportType('inventory')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedReportType === 'inventory'
              ? 'bg-red-950/60 border-red-600 ring-2 ring-red-500'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-white text-sm">1. Master Inventaris APAR</span>
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xs text-slate-400">
            Daftar lengkap seluruh {apars.length} tabung pemadam, lokasi gedung, serial number, dan masa berlaku servis.
          </p>
        </button>

        <button
          onClick={() => setSelectedReportType('weekly')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedReportType === 'weekly'
              ? 'bg-red-950/60 border-red-600 ring-2 ring-red-500'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-white text-sm">2. Laporan Inspeksi Mingguan</span>
            <Calendar className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-xs text-slate-400">
            Rekap hasil checklist 13 butir dan evaluasi kondisi mingguan sesuai periode minggu ISO terpilih.
          </p>
        </button>

        <button
          onClick={() => setSelectedReportType('problematic')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedReportType === 'problematic'
              ? 'bg-red-950/60 border-red-600 ring-2 ring-red-500'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-white text-sm">3. Laporan APAR Bermasalah</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xs text-slate-400">
            Daftar seluruh tabung dengan status Tidak Layak & Perlu Tindakan beserta rekomendasi perbaikannya.
          </p>
        </button>

        <button
          onClick={() => setSelectedReportType('followup')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedReportType === 'followup'
              ? 'bg-red-950/60 border-red-600 ring-2 ring-red-500'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-white text-sm">4. Laporan Tindak Lanjut</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xs text-slate-400">
            Monitoring progress perbaikan (Pending, In-Progress, Resolved) & pemakaian tabung cadangan sementara.
          </p>
        </button>

        <button
          onClick={() => setSelectedReportType('area_compliance')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedReportType === 'area_compliance'
              ? 'bg-red-950/60 border-red-600 ring-2 ring-red-500'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-white text-sm">5. Rekap Kepatuhan per Area</span>
            <Building className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xs text-slate-400">
            Tingkat kepatuhan persentase inspeksi di tiap area lini produksi V-Belt, boiler, dan gardu listrik.
          </p>
        </button>

        <button
          onClick={() => setSelectedReportType('monthly')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedReportType === 'monthly'
              ? 'bg-red-950/60 border-red-600 ring-2 ring-red-500'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-white text-sm">6. Laporan Inspeksi Bulanan</span>
            <FileText className="w-4 h-4 text-slate-300" />
          </div>
          <p className="text-xs text-slate-400">
            Arsip akumulatif seluruh pemeriksaan keselamatan APAR selama satu tahun kalender.
          </p>
        </button>

      </div>

      {/* Action and Filter Controls Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Week & Year selector for weekly inspection */}
          <div className="flex items-center space-x-3 text-xs">
            {(selectedReportType === 'weekly' || selectedReportType === 'area_compliance') && (
              <>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Pilih Minggu:</label>
                  <select
                    value={filterWeek}
                    onChange={(e) => setFilterWeek(parseInt(e.target.value, 10))}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    {Array.from({ length: 52 }, (_, i) => i + 1).map(w => (
                      <option key={w} value={w}>Minggu ke-{w}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Pilih Tahun:</label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(parseInt(e.target.value, 10))}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                    <option value={2024}>2024</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Download Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unduh Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Unduh PDF Resmi</span>
            </button>
          </div>

        </div>

        {/* Official Kop Surat Information */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>Kop Surat Resmi: {settings.companyName} • {settings.departmentName}</span>
          <span>Penanggung Jawab: {settings.hseManagerName} ({settings.hseManagerTitle})</span>
        </div>
      </div>

    </div>
  );
};
