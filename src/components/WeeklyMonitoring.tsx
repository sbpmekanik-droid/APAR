import React, { useState, useMemo } from 'react';
import { 
  ClipboardCheck, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  Filter, 
  Search, 
  ArrowRight,
  Flame,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { AparItem } from '../types';
import { useApp } from '../context/AppContext';
import { getIsoWeek, isDateInCurrentWeek } from '../utils/inspectionLogic';

interface WeeklyMonitoringProps {
  onStartInspection: (apar: AparItem) => void;
  onSelectApar: (aparId: string) => void;
}

export const WeeklyMonitoring: React.FC<WeeklyMonitoringProps> = ({
  onStartInspection,
  onSelectApar,
}) => {
  const { apars, inspections } = useApp();
  const { week, year } = getIsoWeek(new Date());

  const [periodFilter, setPeriodFilter] = useState<'this_week' | 'last_week' | 'this_month' | 'all'>('this_week');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checked' | 'uninspected' | 'critical' | 'needs_action'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeApars = useMemo(() => apars.filter(a => a.status === 'aktif'), [apars]);
  const areas = useMemo(() => Array.from(new Set(activeApars.map(a => a.area))), [activeApars]);

  // Inspection status matrix evaluation
  const matrixData = useMemo(() => {
    return activeApars.map(apar => {
      const isChecked = isDateInCurrentWeek(apar.lastInspectionDate);
      return {
        apar,
        isCheckedThisWeek: isChecked,
        lastDate: apar.lastInspectionDate,
        lastInspector: apar.lastInspectorName || '-',
        condition: apar.lastInspectionStatus || 'BELUM DIPERIKSA',
      };
    });
  }, [activeApars]);

  // Apply filters
  const filteredList = useMemo(() => {
    return matrixData.filter(item => {
      const apar = item.apar;
      const matchQuery = 
        apar.aparCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apar.inventoryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apar.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apar.locationDetail.toLowerCase().includes(searchQuery.toLowerCase());

      const matchArea = areaFilter === 'all' || apar.area === areaFilter;

      let matchStatus = true;
      if (statusFilter === 'checked') matchStatus = item.isCheckedThisWeek;
      if (statusFilter === 'uninspected') matchStatus = !item.isCheckedThisWeek;
      if (statusFilter === 'critical') matchStatus = item.condition === 'TIDAK LAYAK';
      if (statusFilter === 'needs_action') matchStatus = item.condition === 'PERLU TINDAKAN';

      return matchQuery && matchArea && matchStatus;
    });
  }, [matrixData, searchQuery, areaFilter, statusFilter]);

  // Aggregated Stats
  const totalActive = activeApars.length;
  const inspectedCount = matrixData.filter(m => m.isCheckedThisWeek).length;
  const uninspectedCount = totalActive - inspectedCount;
  const compliancePct = totalActive > 0 ? Math.round((inspectedCount / totalActive) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <ClipboardCheck className="w-6 h-6 text-red-500" />
            <span>Monitoring Inspeksi Mingguan</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Matriks kepatuhan dan status inspeksi tabung APAR Minggu ke-{week} ({year}) di seluruh area pabrik V-Belt.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-red-400" />
            <span className="font-bold">Minggu {week} / {year}</span>
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Tingkat Kepatuhan</p>
            <p className={`text-2xl font-black mt-1 ${compliancePct === 100 ? 'text-emerald-400' : compliancePct > 60 ? 'text-amber-400' : 'text-red-400'}`}>
              {compliancePct}%
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">{inspectedCount} dari {totalActive} tabung</p>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
            {compliancePct}%
          </div>
        </div>

        <div className="bg-slate-900 border border-emerald-950/70 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-400 font-semibold uppercase">Sudah Diperiksa</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{inspectedCount} Unit</p>
            <p className="text-[11px] text-emerald-400/70 mt-0.5">Minggu ke-{week} aktif</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-red-950/70 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-400 font-semibold uppercase">Belum Diperiksa</p>
            <p className="text-2xl font-black text-red-400 mt-1">{uninspectedCount} Unit</p>
            <p className="text-[11px] text-red-400/70 mt-0.5">Memerlukan inspeksi segera</p>
          </div>
          <div className="p-3 rounded-xl bg-red-950 text-red-400 animate-pulse">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ID APAR, lokasi, atau area..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex space-x-2">
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="all">Semua Area ({activeApars.length})</option>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="all">Semua Status Inspeksi</option>
              <option value="uninspected">⚠️ Belum Diperiksa ({uninspectedCount})</option>
              <option value="checked">✓ Sudah Diperiksa ({inspectedCount})</option>
              <option value="critical">🚨 Kritis / Tidak Layak</option>
              <option value="needs_action">⚠️ Perlu Tindakan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-850 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Nomor & ID APAR</th>
                <th className="px-4 py-3.5">Lokasi & Area</th>
                <th className="px-4 py-3.5">Jenis APAR</th>
                <th className="px-4 py-3.5">Status Minggu Ini</th>
                <th className="px-4 py-3.5">Kondisi Tabung</th>
                <th className="px-4 py-3.5">Inspeksi Terakhir</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <Check className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                    <p className="font-semibold text-slate-300">Semua tabung telah diperiksa sesuai kriteria filter.</p>
                  </td>
                </tr>
              ) : (
                filteredList.map(({ apar, isCheckedThisWeek, lastDate, lastInspector, condition }) => {
                  return (
                    <tr 
                      key={apar.id}
                      className={`hover:bg-slate-850/60 transition-colors ${
                        !isCheckedThisWeek ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Nomor & ID */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onSelectApar(apar.id)}
                          className="font-bold text-white hover:text-red-400 transition-colors cursor-pointer text-xs sm:text-sm font-mono"
                        >
                          {apar.aparCode}
                        </button>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {apar.inventoryNumber}
                        </div>
                      </td>

                      {/* Lokasi & Area */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-semibold text-slate-200 truncate">{apar.area}</div>
                        <div className="text-[11px] text-slate-400 truncate">{apar.building}</div>
                        <div className="text-[10px] text-slate-500 truncate">{apar.locationDetail}</div>
                      </td>

                      {/* Jenis APAR */}
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-200">{apar.mediaType}</span>
                        <div className="text-[11px] text-slate-400">{apar.capacity} • {apar.brand}</div>
                      </td>

                      {/* Status Minggu Ini */}
                      <td className="px-4 py-3">
                        {isCheckedThisWeek ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>SUDAH DIPERIKSA</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-950 text-red-300 border border-red-800 animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-red-400" />
                            <span>BELUM DIPERIKSA</span>
                          </span>
                        )}
                      </td>

                      {/* Kondisi Fisik */}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          condition === 'BAIK' ? 'bg-emerald-900/60 text-emerald-300' :
                          condition === 'TIDAK LAYAK' ? 'bg-red-900/80 text-red-300' :
                          condition === 'PERLU TINDAKAN' ? 'bg-amber-900/80 text-amber-300' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {condition}
                        </span>
                      </td>

                      {/* Inspeksi Terakhir */}
                      <td className="px-4 py-3 text-[11px]">
                        <div className="text-slate-200 font-medium">{lastDate || '-'}</div>
                        <div className="text-slate-400 text-[10px]">{lastInspector}</div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onStartInspection(apar)}
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-xs cursor-pointer inline-flex items-center space-x-1"
                        >
                          <span>{isCheckedThisWeek ? 'Inspeksi Ulang' : 'Periksa Sekarang'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
